import base64
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from decimal import Decimal
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'tools/business'))
from documents import handle
from trade import process


class TradeFlow(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        env = patch.dict(os.environ, SMARTNF_DOCUMENT_DIR=temp.name)
        env.start()
        self.addCleanup(env.stop)
        self.seller = self.call(1, 'register', name='산지')['id']
        self.buyer = self.call(2, 'register', name='급식소')['id']
        self.sku = self.sell('catalog', name='양송이', origin='국내', unit='g', pack=1000, price=9000,
                             allergens='없음', protein=3, sodium=5)['id']
        self.out = self.sell('warehouse', name='산지', zone='냉장')['id']
        self.dest = self.buy('warehouse', name='주방', zone='냉장')['id']

    def call(self, actor, op, **data):
        data.setdefault('requestId', str(uuid.uuid4()))
        return process(self.root/'trade.db', actor, op, data)

    def sell(self, op, **data):
        return self.call(1, op, org=self.seller, **data)

    def buy(self, op, **data):
        return self.call(2, op, org=self.buyer, **data)

    def stock(self):
        return self.sell('stock', sku=self.sku, place=self.out, producerLot='A', expires='2099-01-01', qty=2000)['lot']

    def test_purchase_to_settlement(self):
        oid=self.buy('order',sku=self.sku,packs=2)['id']
        self.sell('approve',id=oid)
        with self.assertRaises(ValueError):self.buy('pay',id=oid)
        self.stock()
        self.buy('pay',id=oid,requestId='p1')
        self.buy('pay',id=oid,requestId='p1')
        self.sell('ship',id=oid)
        shipment=self.buy('dashboard')['출고'][0]['id']
        self.buy('receive',id=oid,shipment=shipment,place=self.dest,qty=2000)
        def invoice(price):
            doc=handle(self.root,2,'upload',dict(name='invoice.txt',content=base64.b64encode(str(price).encode()).decode()))['id']
            handle(self.root,2,'approve',dict(id=doc,version=1,rows=[dict(supplier='산지',item='양송이',sku=self.sku,line=1,qty=2,unitPrice=price,tax=0,total=price*2)]))
            return self.buy('invoice',id=oid,doc=doc)
        with self.assertRaises(ValueError):invoice(1)
        self.assertEqual(invoice(9000)['청구 차이'],0)
        self.buy('settle',id=oid)
        self.assertEqual(self.buy('erp',id=oid)['모의 ERP 대조 완료'],oid)
        self.assertEqual(sum(r['amount'] for r in self.buy('dashboard')['정산원장'] if r['kind']=='모의 지급'),18000)

    def test_duplicate_and_unused_org(self):
        with self.assertRaises(ValueError):self.call(1,'register',name=' 산지 ')
        with self.assertRaises(ValueError):self.sell('deleteOrg',confirmedOrg=self.seller)
        empty=self.call(1,'register',name='빈 업체')['id']
        with self.assertRaises(ValueError):self.call(2,'deleteOrg',org=empty,confirmedOrg=empty)
        with self.assertRaises(ValueError):self.call(1,'deleteOrg',org=empty,confirmedOrg=self.seller)
        self.call(1,'deleteOrg',org=empty,confirmedOrg=empty)
        self.assertEqual([o['id'] for o in self.call(1,'organizations')],[self.seller])


    def invoice(self, oid, packs, price=9000):
        name=uuid.uuid4().hex+'.txt'
        doc=handle(self.root,2,'upload',dict(name=name,content=base64.b64encode(name.encode()).decode()))['id']
        handle(self.root,2,'approve',dict(id=doc,version=1,rows=[dict(supplier='산지',item='양송이',sku=self.sku,line=1,qty=packs,unitPrice=price,tax=0,total=str(Decimal(str(price))*Decimal(str(packs))))]))
        return self.buy('invoice',id=oid,doc=doc)

    def paid_order(self, packs=2):
        self.stock()
        oid=self.buy('order',sku=self.sku,packs=packs)['id']
        self.sell('approve',id=oid)
        self.buy('pay',id=oid)
        return oid

    def test_terms_snapshot_and_reports(self):
        self.sell('catalogEdit',sku=self.sku,name='양송이',origin='국내',unit='g',pack=1000,price=9000,
                  allergens='없음',protein=3,sodium=5,shipping=3000,region='서울',min_packs=2,lead_days=1)
        with self.assertRaises(ValueError):self.buy('order',sku=self.sku,packs=1,region='서울')
        with self.assertRaises(ValueError):self.buy('order',sku=self.sku,packs=2,region='부산')
        oid=self.buy('order',sku=self.sku,packs=2,region='서울',delivery='2090-01-01')['id']
        self.sell('catalogEdit',sku=self.sku,name='새 이름',origin='국내',unit='g',pack=1000,price=20000,
                  allergens='없음',protein=3,sodium=5,active=0)
        o=self.buy('dashboard')['거래'][0]
        self.assertEqual((o['name'],o['price'],o['shipping']),('양송이',9000,3000))
        with self.assertRaises(ValueError):self.buy('order',sku=self.sku,packs=2)
        self.buy('partner',partner=self.seller,kind='SUPPLIER',contact='담당자',note='구매자 비공개 메모')
        self.assertEqual(self.sell('dashboard')['거래처'],[])
        report=self.buy('report',start='2000-01-01',end='2099-12-31',side='BUY',partner=self.seller)
        self.assertEqual(report['집계'][0]['주문금액'],21000)
        self.assertIn(oid,report['csv'])

    def test_rfq_notice_and_quote_once(self):
        request=self.buy('rfq',seller=self.seller,name='양송이',spec='국내산 1kg 포장',unit='g',qty=2000,
                         delivery='2090-01-01',region='',note='냉장 납품')['id']
        notice=self.sell('notifications')
        self.assertGreater(notice['unread'],0)
        self.sell('readNotice',id=notice['notifications'][0]['id'])
        self.assertEqual(self.sell('notifications')['unread'],0)
        with self.assertRaises(ValueError):self.buy('quoteRfq',rfq=request,sku=self.sku,price=8000,until='2090-01-01')
        quote=self.sell('quoteRfq',rfq=request,sku=self.sku,price=8000,until='2090-01-01')['id']
        self.buy('order',sku=self.sku,packs=2,quote=quote)
        with self.assertRaises(ValueError):self.buy('order',sku=self.sku,packs=2,quote=quote)
        self.assertEqual(self.buy('dashboard')['거래'][0]['price'],8000)

    def test_hold_partial_receipt_refund(self):
        oid=self.paid_order()
        self.sell('ship',id=oid)
        shipment=self.buy('dashboard')['출고'][0]['id']
        self.buy('receive',id=oid,shipment=shipment,place=self.dest,qty=1000)
        self.invoice(oid,1)
        with self.assertRaises(ValueError):self.buy('settle',id=oid)
        claim=self.buy('requestChange',id=oid,kind='SHORTAGE',qty=1000,reason='1포장 부족')['id']
        with self.assertRaises(ValueError):self.buy('settle',id=oid)
        self.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='부족분 환불 합의')
        self.buy('settle',id=oid)
        ledger=self.buy('dashboard')['정산원장']
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='부족분 모의 환불'),-9000)
        self.assertEqual(sum(r['amount'] for r in ledger if r['kind']=='모의 지급'),9000)

    def test_return_and_changed_quantity(self):
        oid=self.buy('order',sku=self.sku,packs=1)['id']
        self.buy('editOrder',id=oid,packs=2)
        self.sell('approve',id=oid)
        request=self.buy('requestChange',id=oid,kind='CHANGE',packs=1,reason='식수 감소')['id']
        self.sell('resolveClaim',id=request,decision='ACCEPT',resolution='1포장으로 변경')
        self.stock()
        self.buy('pay',id=oid)
        self.sell('ship',id=oid)
        shipment=self.buy('dashboard')['출고'][0]['id']
        self.buy('receive',id=oid,shipment=shipment,place=self.dest,qty=1000)
        claim=self.buy('requestChange',id=oid,kind='RETURN',qty=1000,reason='전량 반품 합의')['id']
        self.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='반품 수령 확인')
        self.buy('settle',id=oid)
        self.assertEqual(self.buy('dashboard')['거래'][0]['received'],0)
        self.assertTrue(any(r['blocked'] and r['qty']==1000 for r in self.sell('dashboard')['재고']))
        self.assertEqual(sum(r['amount'] for r in self.buy('dashboard')['정산원장'] if '환불' in r['kind']),-9000)

    def test_cancel_release_and_revoke_replay(self):
        oid=self.paid_order()
        request=self.buy('requestChange',id=oid,kind='CANCEL',reason='일정 취소')['id']
        self.sell('resolveClaim',id=request,decision='ACCEPT',resolution='취소 동의')
        self.assertEqual(self.sell('dashboard')['재고'][0]['qty'],2000)
        self.assertEqual(self.buy('dashboard')['거래'][0]['state'],'CANCELLED')
        with self.assertRaises(ValueError):self.call(3,'order',org=self.buyer,sku=self.sku,packs=1)


    def test_concurrent_stock_reservation(self):
        from concurrent.futures import ThreadPoolExecutor
        self.stock()
        ids=[self.buy('order',sku=self.sku,packs=2)['id'] for _ in range(2)]
        for oid in ids:self.sell('approve',id=oid)
        def pay(oid):
            try:self.buy('pay',id=oid);return True
            except ValueError:return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sum(pool.map(pay,ids)),1)
        self.assertEqual(self.sell('dashboard')['재고'][0]['qty'],0)
        self.assertEqual(len(self.buy('dashboard')['정산원장']),1)

    def test_legacy_migration_and_authority(self):
        import sqlite3
        from trade import SCHEMA
        legacy=self.root/'legacy.sqlite'
        db=sqlite3.connect(legacy)
        db.executescript(SCHEMA)
        db.execute("INSERT INTO org VALUES('old','기존업체')")
        db.execute("INSERT INTO staff VALUES('old',1,'ADMIN')")
        db.execute("INSERT INTO org VALUES('supplier','기존공급자')")
        db.execute("INSERT INTO sku VALUES('oldsku','p','supplier','기존상품','국내','ml',1000,5000,'','미확인',0,0)")
        db.execute("INSERT INTO orders(id,po,buyer,seller,sku,qty,price,state) VALUES('oldorder','po','old','supplier','oldsku',2000,5000,'REQUESTED')")
        import json
        db.execute("INSERT INTO audit(member,org,action,result,at) VALUES(1,'old','order',?,'2026-11-17 12:00:00')",(json.dumps({'id':'oldorder'}),))
        db.commit();db.close()
        result=process(legacy,1,'dashboard',{'org':'old'})
        self.assertEqual(result['거래'][0]['pack'],1000)
        self.assertEqual(result['거래'][0]['created'][:10],'2026-11-17')
        self.sell('staff',member=3,role='STORE')
        with self.assertRaises(ValueError):self.call(3,'partner',org=self.seller,partner=self.buyer,kind='CUSTOMER')
        notice=self.sell('notifications')['notifications']
        if notice:
            with self.assertRaises(ValueError):self.buy('readNotice',id=notice[0]['id'])

    def test_substitute_and_campaign_failure(self):
        another=self.sell('catalog',name='대체버섯',origin='국내',unit='g',pack=500,price=5000,allergens='우유',protein=3,sodium=8)['id']
        sub=self.buy('substitute',oldSku=self.sku,newSku=another,avoid='우유')
        self.assertEqual(sub['상태'],'REVIEW')
        with self.assertRaises(ValueError):self.buy('acceptSub',id=sub['id'])
        g=self.sell('campaign',sku=self.sku,target=2,capacity=3,deadline='2090-01-01',delivery='2090-01-02')['id']
        with self.assertRaises(ValueError):self.buy('pledge',id=g,qty=4)
        self.assertEqual(self.buy('dashboard')['거래'],[])
        with self.assertRaises(ValueError):self.sell('close',id=g)


    def test_fractional_pack_invoice(self):
        oid=self.paid_order()
        self.sell('ship',id=oid)
        shipment=self.buy('dashboard')['출고'][0]['id']
        self.buy('receive',id=oid,shipment=shipment,place=self.dest,qty=1500)
        self.invoice(oid,'1.5')
        claim=self.buy('requestChange',id=oid,kind='SHORTAGE',qty=500,reason='500g 부족')['id']
        self.sell('resolveClaim',id=claim,decision='ACCEPT',resolution='검수 수량 합의')
        self.buy('settle',id=oid)
        paid=sum(r['amount'] for r in self.buy('dashboard')['정산원장'] if r['kind']=='모의 지급')
        self.assertEqual(paid,13500)

    def test_campaign_plan_and_recall(self):
        lot=self.stock()
        campaign=self.sell('campaign',sku=self.sku,target=2,capacity=2,deadline='2090-01-01',delivery='2090-01-02')['id']
        self.buy('pledge',id=campaign,qty=2)
        self.sell('close',id=campaign)
        self.assertEqual(self.buy('dashboard')['거래'][0]['qty'],2000)
        self.assertEqual(self.sell('plan',sku=self.sku,people=30,perPerson=100,delivery='2090-01-02')['발주 포장수'],1)
        self.sell('recall',lot=lot)
        self.assertEqual(self.sell('plan',sku=self.sku,people=30,perPerson=100,delivery='2090-01-02')['발주 포장수'],3)
        with self.assertRaises(ValueError):self.call(2,'dashboard',org=self.seller)


if __name__=='__main__':
    unittest.main()
