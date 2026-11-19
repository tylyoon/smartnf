import os
import unittest
from unittest.mock import patch
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/business'))
from trade_payments import process,config,GatewayError
from test_business_trade import TradeFlow


class TestGateway:
    def __init__(self):
        self.payments={}
        self.requests=[]
        self.timeout_once=False
        self.refund_timeout=False

    def request(self,method,path,body=None,request_id=None):
        self.requests.append((method,path,body,request_id))
        if method=='GET':
            key=path.rsplit('/',1)[-1]
            if key not in self.payments:raise GatewayError(404)
            return dict(self.payments[key])
        if path.endswith('/confirm'):
            key=body['paymentKey']
            self.payments.setdefault(key,{'paymentKey':key,'orderId':body['orderId'],'totalAmount':body['amount'],
                'balanceAmount':body['amount'],'currency':'KRW','status':'DONE','method':'카드'})
            if self.timeout_once:
                self.timeout_once=False
                raise GatewayError()
            return dict(self.payments[key])
        key=path.split('/')[-2]
        payment=self.payments[key]
        payment['balanceAmount']-=body['cancelAmount']
        payment['status']='CANCELED' if payment['balanceAmount']==0 else 'PARTIAL_CANCELED'
        if self.refund_timeout:
            self.refund_timeout=False
            raise GatewayError()
        return dict(payment)


class PaymentTests(unittest.TestCase):
    def setUp(self):
        self.flow=TradeFlow(methodName='test_purchase_to_settlement')
        self.flow.setUp()
        self.addCleanup(self.flow.doCleanups)
        env=patch.dict(os.environ,SMARTNF_TOSS_CLIENT_KEY='test_gck_example',SMARTNF_TOSS_SECRET_KEY='test_gsk_example',
                       SMARTNF_TOSS_WEBHOOK_TOKEN='x'*40)
        env.start();self.addCleanup(env.stop)
        self.db=self.flow.root/'trade.db'
        self.gateway=TestGateway()
        self.flow.stock()
        self.order=self.flow.buy('order',sku=self.flow.sku,packs=2)['id']
        self.flow.sell('approve',id=self.order)

    def pg(self,action,member=2,**data):
        return process(self.db,member,action,data,gateway=self.gateway)

    def prepare(self):
        return self.pg('prepare',id=self.order,org=self.flow.buyer)

    def confirm(self,payment,key='pg-test-1'):
        return self.pg('confirm',orderId=payment['orderId'],paymentKey=key,amount=payment['amount'])

    def test_prepare_capture_and_retry(self):
        p=self.prepare()
        self.assertEqual(self.prepare()['orderId'],p['orderId'])
        self.assertEqual(self.flow.sell('dashboard')['재고'][0]['qty'],0)
        self.assertEqual(self.confirm(p)['state'],'PAID')
        self.confirm(p)
        ledger=self.flow.buy('dashboard')['정산원장']
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='PG 테스트 결제'),18000)

    def test_modified_amount_and_cross_account_rejected(self):
        p=self.prepare()
        with self.assertRaises(ValueError):self.pg('confirm',orderId=p['orderId'],paymentKey='x',amount=1)
        with self.assertRaises(ValueError):self.pg('prepare',member=1,id=self.order,org=self.flow.buyer)
        with self.assertRaises(ValueError):self.flow.buy('pay',id=self.order)
        self.assertEqual(self.gateway.requests,[])

    def test_timeout_after_remote_commit_recovers_by_lookup(self):
        p=self.prepare()
        self.gateway.timeout_once=True
        with self.assertRaises(GatewayError):self.confirm(p)
        self.assertEqual(self.flow.buy('dashboard')['거래'][0]['state'],'PAYMENT_PENDING')
        self.assertEqual(self.pg('sync',id=self.order)['state'],'PAID')
        self.assertEqual(len(self.flow.buy('dashboard')['정산원장']),1)

    def test_sync_retries_authorization_when_connection_failed_before_capture(self):
        p=self.prepare()
        original=self.gateway.request
        def unavailable(method,path,body=None,request_id=None):
            if method=='POST':raise GatewayError()
            return original(method,path,body,request_id)
        with patch.object(self.gateway,'request',side_effect=unavailable):
            with self.assertRaises(GatewayError):self.confirm(p)
        self.assertEqual(self.gateway.payments,{})
        self.assertEqual(self.pg('sync',id=self.order)['state'],'PAID')
        self.assertEqual(len(self.flow.buy('dashboard')['정산원장']),1)

    def test_cancel_and_repeated_sync_does_not_refund_twice(self):
        p=self.prepare();self.confirm(p)
        result=self.pg('cancel',id=self.order)
        self.assertEqual(result['state'],'CANCELLED')
        self.pg('sync',id=self.order)
        self.assertEqual(self.flow.sell('dashboard')['재고'][0]['qty'],2000)
        ledger=self.flow.buy('dashboard')['정산원장']
        self.assertEqual(sum(r['amount'] for r in ledger),0)
        self.assertEqual(len(ledger),2)

    def test_release_unconfirmed_reservation_and_prepare_new_attempt(self):
        p=self.prepare()
        self.pg('release',id=self.order)
        self.assertEqual(self.flow.sell('dashboard')['재고'][0]['qty'],2000)
        self.assertNotEqual(self.prepare()['orderId'],p['orderId'])

    def test_partial_refund_and_settlement(self):
        p=self.prepare();self.confirm(p)
        self.flow.sell('ship',id=self.order)
        shipment=self.flow.buy('dashboard')['출고'][0]['id']
        self.flow.buy('receive',id=self.order,shipment=shipment,place=self.flow.dest,qty=1000)
        self.flow.invoice(self.order,1)
        claim=self.flow.buy('requestChange',id=self.order,kind='SHORTAGE',qty=1000,reason='부족')['id']
        self.flow.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='합의')
        with self.assertRaises(ValueError):self.flow.buy('settle',id=self.order)
        self.pg('refund',id=self.order)
        self.flow.buy('settle',id=self.order)
        ledger=self.flow.buy('dashboard')['정산원장']
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='PG 테스트 환불'),-9000)
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='PG 정산 예정'),9000)

    def test_webhook_requires_token_and_requeries_provider(self):
        p=self.prepare();self.confirm(p)
        event={'eventType':'PAYMENT_STATUS_CHANGED','data':{'orderId':p['orderId'],'paymentKey':'pg-test-1'}}
        with self.assertRaises(ValueError):self.pg('webhook',member=0,**event)
        before=len(self.gateway.requests)
        self.pg('webhook',member=0,hookToken='x'*40,**event)
        self.assertGreater(len(self.gateway.requests),before)
        self.assertEqual(len(self.flow.buy('dashboard')['정산원장']),1)

    def test_provider_payload_mismatch_is_not_accepted(self):
        p=self.prepare()
        self.gateway.payments['bad']={'paymentKey':'bad','orderId':'another-order','totalAmount':18000,'balanceAmount':18000,'currency':'KRW','status':'DONE'}
        with self.assertRaises(ValueError):self.confirm(p,'bad')
        self.assertEqual(self.flow.buy('dashboard')['거래'][0]['state'],'PAYMENT_PENDING')


    def test_cancel_claim_requires_pg_refund_after_supplier_agreement(self):
        p=self.prepare();self.confirm(p)
        claim=self.flow.buy('requestChange',id=self.order,kind='CANCEL',reason='취소 요청')['id']
        self.flow.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='취소 합의')
        self.pg('cancel',id=self.order)
        self.assertEqual(self.flow.buy('dashboard')['거래'][0]['state'],'CANCELLED')

    def test_unknown_refund_result_is_recovered_without_second_cancel(self):
        p=self.prepare();self.confirm(p)
        self.gateway.refund_timeout=True
        with self.assertRaises(GatewayError):self.pg('cancel',id=self.order)
        self.pg('cancel',id=self.order)
        cancellation_posts=[r for r in self.gateway.requests if r[0]=='POST' and r[1].endswith('/cancel')]
        self.assertEqual(len(cancellation_posts),1)
        self.assertEqual(self.flow.sell('dashboard')['재고'][0]['qty'],2000)

    def test_full_return_records_refund_before_zero_settlement(self):
        p=self.prepare();self.confirm(p)
        self.flow.sell('ship',id=self.order)
        shipment=self.flow.buy('dashboard')['출고'][0]['id']
        self.flow.buy('receive',id=self.order,shipment=shipment,place=self.flow.dest,qty=2000)
        claim=self.flow.buy('requestChange',id=self.order,kind='RETURN',qty=2000,reason='전량 반품')['id']
        self.flow.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='반품 수령 확인')
        self.assertEqual(self.pg('refund',id=self.order)['state'],'REFUNDED')
        self.flow.buy('settle',id=self.order)
        ledger=self.flow.buy('dashboard')['정산원장']
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='PG 테스트 환불'),-18000)
        self.assertFalse(any(r['kind']=='모의 환불' for r in ledger))

    def test_live_keys_cannot_enable_checkout(self):
        with patch.dict(os.environ,SMARTNF_TOSS_CLIENT_KEY='live_gck_example'):
            self.assertFalse(config()['configured'])
            with self.assertRaises(ValueError):self.prepare()
        self.assertNotIn('secret',str(config()).lower())


if __name__=='__main__':
    unittest.main()
