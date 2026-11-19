"""Toss Payments test-mode checkout and verified, recoverable payment transitions."""
import base64
import hashlib
import hmac
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import contextmanager
from pathlib import Path
from datetime import date
from trade_common import code, field, first, num, require, rows, move

SCHEMA = """
CREATE TABLE IF NOT EXISTS pg_payment(
 id TEXT PRIMARY KEY,ord TEXT,pg_order TEXT UNIQUE,customer TEXT,member INTEGER,amount INTEGER,
 state TEXT,payment_key TEXT UNIQUE,captured INTEGER DEFAULT 0,refunded INTEGER DEFAULT 0,
 released INTEGER DEFAULT 0,lease REAL DEFAULT 0,refund_target INTEGER DEFAULT 0,intent TEXT DEFAULT '',
 created REAL,updated REAL,error TEXT DEFAULT '');
CREATE UNIQUE INDEX IF NOT EXISTS pg_active_order ON pg_payment(ord)
 WHERE state IN ('PREPARED','CONFIRMING','PAID','REFUNDING','REVIEW');
"""


class GatewayError(Exception):
    def __init__(self, status=0):
        self.status=status
        super().__init__('PG 응답을 확인하지 못했습니다. 결제 상태 확인으로 재조회하세요.')


def config():
    client=os.getenv('SMARTNF_TOSS_CLIENT_KEY','')
    secret=os.getenv('SMARTNF_TOSS_SECRET_KEY','')
    ready=bool(re.fullmatch(r'test_gck_[A-Za-z0-9_-]+',client) and re.fullmatch(r'test_gsk_[A-Za-z0-9_-]+',secret))
    return {'provider':'TOSS','mode':'TEST','configured':ready,'clientKey':client if ready else '',
            'message':'테스트 결제 연결 준비 완료' if ready else '서버에 토스페이먼츠 test_gck/test_gsk 테스트 키를 설정하세요.'}


class Gateway:
    def __init__(self, timeout=15):
        require(config()['configured'],'PG 테스트 키 설정을 확인하세요.')
        self.timeout=timeout

    def request(self, method, path, body=None, request_id=None):
        headers={'Authorization':'Basic '+base64.b64encode((os.environ['SMARTNF_TOSS_SECRET_KEY']+':').encode()).decode(),
                 'Content-Type':'application/json'}
        if request_id:headers['Idempotency-Key']=request_id
        request=urllib.request.Request('https://api.tosspayments.com'+path,
            data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self,*args,**kwargs):return None
        try:
            with urllib.request.build_opener(NoRedirect()).open(request,timeout=self.timeout) as response:
                payload=response.read(1_000_001)
            require(len(payload)<=1_000_000,'PG 응답 크기를 확인하세요.')
            return json.loads(payload)
        except urllib.error.HTTPError as exc:
            raise GatewayError(exc.code) from None
        except (OSError,ValueError):
            raise GatewayError() from None


@contextmanager
def transaction(path):
    from trade import SCHEMA as CORE_SCHEMA
    import trade_operations as operations
    import trade_quotes
    path.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(path,timeout=10)
    db.row_factory=sqlite3.Row
    try:
        db.executescript(CORE_SCHEMA+operations.SCHEMA+trade_quotes.SCHEMA+SCHEMA)
        db.execute('BEGIN IMMEDIATE')
        operations.migrate(db);trade_quotes.migrate(db)
        yield db
        db.commit()
    finally:
        db.close()


def latest(db,oid):
    return db.execute('SELECT * FROM pg_payment WHERE ord=? ORDER BY created DESC LIMIT 1',(oid,)).fetchone()


def authorize(db,member,order,org=None,write=True):
    if write:
        require(org is None or org==order['buyer'],'구매 업체를 확인하세요.')
        role=first(db,'SELECT role FROM staff WHERE member=? AND org=?',(member,order['buyer']))[0]
        require(role in ('ADMIN','BUY','FINANCE'),'구매·정산 담당자 권한이 필요합니다.')
    else:
        require(org in (order['buyer'],order['seller']),'거래 당사자를 확인하세요.')
        first(db,'SELECT role FROM staff WHERE member=? AND org=?',(member,org))


def guard(db,oid,action):
    payment=latest(db,oid)
    if not payment or payment['state'] in ('RELEASED','FAILED'):
        return False
    require(payment['state'] not in ('CONFIRMING','REFUNDING','REVIEW'),'PG 처리 결과를 먼저 조회·확인하세요.')
    if action=='cancel':
        require(False,'PG 테스트 결제 취소로 처리하세요.')
    return bool(payment['captured'])


def refund_due(order,terms):
    accepted=(order['received']*order['price']+terms['pack']//2)//terms['pack']
    if order['received']:accepted+=terms['shipping']
    return order['paid']-accepted


def reserve(db,order,terms,reference,reason):
    need=order['qty']
    for stock in rows(db,'''SELECT s.* FROM stock s JOIN lot l ON l.id=s.lot
            WHERE s.org=? AND l.sku=? AND l.blocked=0 AND l.expires>=? AND s.qty>0 ORDER BY l.expires''',
            (order['seller'],order['sku'],max(date.today().isoformat(),terms['due_day']))):
        qty=min(need,stock['qty'])
        move(db,order['seller'],stock['place'],stock['lot'],-qty,reason,reference)
        need-=qty
        if not need:break
    require(need==0,'소비기한에 맞는 예약 가능 재고가 부족합니다.')


def release(db,payment,order):
    if payment['released']:return
    reason='예약' if payment['captured'] else 'PG 예약'
    reference=order['id'] if payment['captured'] else payment['pg_order']
    for row in rows(db,'SELECT * FROM movement WHERE ref=? AND reason=?',(reference,reason)):
        move(db,order['seller'],row['place'],row['lot'],-row['qty'],'PG 예약 해제',payment['pg_order'])
    db.execute('UPDATE pg_payment SET released=1 WHERE id=?',(payment['id'],))


def safe_view(db,payment):
    order=first(db,'SELECT * FROM orders WHERE id=?',(payment['ord'],))
    terms=first(db,'SELECT * FROM order_terms WHERE id=?',(payment['ord'],))
    return {'id':payment['id'],'orderId':payment['pg_order'],'org':order['buyer'],
            'order':order['id'],'name':terms['name'],'qty':order['qty'],'pack':terms['pack'],'unit':terms['unit'],
            'price':order['price'],'shipping':terms['shipping'],'amount':payment['amount'],
            'refunded':payment['refunded'],'state':payment['state'],'customerKey':payment['customer'],
            'captured':bool(payment['captured']),'orderState':order['state'],'refundDue':max(0,refund_due(order,terms)-payment['refunded']),
            'refundReady':order['billed']==order['received'] and (order['state']=='RECEIVED' or bool(terms['receipt_closed'])),
            'created':payment['created'],'message':payment['error']}


def prepare(path,member,d):
    require(config()['configured'],'PG 테스트 키 설정을 확인하세요.')
    with transaction(path) as db:
        order=first(db,'SELECT * FROM orders WHERE id=?',(field(d,'id'),))
        authorize(db,member,order,field(d,'org'))
        existing=latest(db,order['id'])
        if existing and existing['state'] in ('PREPARED','CONFIRMING','PAID','REFUNDING','REVIEW'):
            return {**safe_view(db,existing),**config()}
        require(order['state']=='APPROVED','승인 완료된 발주를 선택하세요.')
        require(not db.execute("SELECT 1 FROM claim WHERE ord=? AND state='OPEN'",(order['id'],)).fetchone(),'진행 중인 요청을 먼저 처리하세요.')
        terms=first(db,'SELECT * FROM order_terms WHERE id=?',(order['id'],))
        require(not terms['due_day'] or terms['due_day']>=date.today().isoformat(),'희망 납기가 지났습니다.')
        key=code('PAY')
        amount=order['qty']*order['price']//terms['pack']+terms['shipping']
        require(0<amount<=10**12,'PG 테스트 결제금액 범위를 확인하세요.')
        reserve(db,order,terms,key,'PG 예약')
        db.execute("""INSERT INTO pg_payment(id,ord,pg_order,customer,member,amount,state,created,updated)
            VALUES(?,?,?,?,?,?,'PREPARED',?,?)""",(key,order['id'],key,code('CUSTOMER'),member,amount,time.time(),time.time()))
        db.execute("UPDATE orders SET state='PAYMENT_PENDING' WHERE id=?",(order['id'],))
        return {**safe_view(db,first(db,'SELECT * FROM pg_payment WHERE id=?',(key,))),**config()}


def validate_remote(remote,payment):
    require(isinstance(remote,dict) and remote.get('orderId')==payment['pg_order'],'PG 주문번호 대조에 실패했습니다.')
    require(remote.get('paymentKey')==payment['payment_key'],'PG 결제 식별자 대조에 실패했습니다.')
    require(remote.get('currency')=='KRW' and type(remote.get('totalAmount')) is int and remote.get('totalAmount')==payment['amount'],'PG 결제금액·통화 대조에 실패했습니다.')
    balance=remote.get('balanceAmount')
    require(type(balance) is int and 0<=balance<=payment['amount'],'PG 환불 잔액을 확인하세요.')
    require(payment['amount']-balance>=payment['refunded'],'이전 환불보다 오래된 PG 응답입니다.')
    require(remote.get('status') in ('DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED','IN_PROGRESS','READY','WAITING_FOR_DEPOSIT'),'PG 처리 상태를 확인하세요.')
    require(remote['status']!='DONE' or balance==payment['amount'],'PG 승인 잔액이 일치하지 않습니다.')
    require(remote['status']!='CANCELED' or balance==0,'PG 취소 잔액이 일치하지 않습니다.')


def apply_remote(db,payment,remote):
    from trade_operations import notify
    order=first(db,'SELECT * FROM orders WHERE id=?',(payment['ord'],))
    state=remote['status']
    if state in ('DONE','PARTIAL_CANCELED','CANCELED'):
        if not payment['captured']:
            require(order['state']=='PAYMENT_PENDING' and not payment['released'],'예약 해제된 결제입니다. PG 내역을 수동 확인하세요.')
            db.execute("UPDATE movement SET reason='예약',ref=? WHERE ref=? AND reason='PG 예약'",(order['id'],payment['pg_order']))
            db.execute('INSERT INTO ledger VALUES(?,?,?,?)',(code('TX'),order['id'],'PG 테스트 결제',payment['amount']))
            db.execute("UPDATE orders SET state='PAID',paid=? WHERE id=?",(payment['amount'],order['id']))
            order=first(db,'SELECT * FROM orders WHERE id=?',(order['id'],))
        refunded=payment['amount']-remote['balanceAmount']
        delta=refunded-payment['refunded']
        if delta:db.execute('INSERT INTO ledger VALUES(?,?,?,?)',(code('TX'),order['id'],'PG 테스트 환불',-delta))
        local_state='PAID'
        if state=='CANCELED' and order['state'] in ('PAID','CANCELLED'):
            if order['state']=='PAID':release(db,{**dict(payment),'captured':1},order)
            db.execute("UPDATE orders SET state='CANCELLED' WHERE id=?",(order['id'],))
            local_state='CANCELLED'
        elif refunded and payment['intent']!='ADJUST':
            local_state='REVIEW'
        elif state=='CANCELED':
            local_state='REFUNDED'
        db.execute('UPDATE pg_payment SET captured=1,refunded=?,state=?,lease=0,error=?,updated=? WHERE id=?',
                   (refunded,local_state,'별도 PG 취소가 발생했습니다. 정산을 확인하세요.' if local_state=='REVIEW' else '',time.time(),payment['id']))
        if not payment['captured'] or delta:
            for org in (order['buyer'],order['seller']):
                notify(db,org,order['id'],'PG 테스트 승인·환불 결과가 확인됐습니다.')
    elif state in ('ABORTED','EXPIRED'):
        require(not payment['captured'],'승인 후 실패 상태가 전달됐습니다.')
        release(db,payment,order)
        db.execute("UPDATE orders SET state='APPROVED' WHERE id=?",(order['id'],))
        db.execute("UPDATE pg_payment SET state='FAILED',lease=0,updated=? WHERE id=?",(time.time(),payment['id']))
    else:
        db.execute("UPDATE pg_payment SET lease=0,state='CONFIRMING',error='PG 승인 결과 확인 중',updated=? WHERE id=?",(time.time(),payment['id']))


def process(path,member,action,d,gateway=None):
    require(isinstance(d,dict),'요청 형식을 확인하세요.')
    if action=='config':return config()
    if action=='prepare':return prepare(path,member,d)
    webhook=action=='webhook'
    if webhook:
        expected=os.getenv('SMARTNF_TOSS_WEBHOOK_TOKEN','')
        require(len(expected)>=32 and hmac.compare_digest(expected,str(d.get('hookToken',''))),'웹훅 인증을 확인하세요.')
        require(d.get('eventType') in ('PAYMENT_STATUS_CHANGED','CANCEL_STATUS_CHANGED'),'지원하지 않는 웹훅입니다.')
        event=d.get('data') or {}
        require(isinstance(event,dict),'웹훅 자료를 확인하세요.')
        pg_order=event.get('orderId')
    else:
        require(action in ('status','confirm','sync','cancel','refund','release'),'지원하지 않는 결제 작업입니다.')
        pg_order=d.get('orderId')
    lease_token=time.time()+60
    with transaction(path) as db:
        if pg_order:
            payment=db.execute('SELECT * FROM pg_payment WHERE pg_order=?',(pg_order,)).fetchone()
            if webhook and payment is None:return {'ignored':True}
            require(payment is not None,'PG 결제 준비 기록이 없습니다.')
        elif webhook:
            payment=db.execute('SELECT * FROM pg_payment WHERE payment_key=?',(field(event,'paymentKey'),)).fetchone()
            if payment is None:return {'ignored':True}
        else:
            payment=latest(db,field(d,'id'));require(payment is not None,'PG 결제 준비 기록이 없습니다.')
        order=first(db,'SELECT * FROM orders WHERE id=?',(payment['ord'],))
        if not webhook:authorize(db,member,order,d.get('org'),write=action!='status')
        if action=='status':return safe_view(db,payment)
        if webhook:
            require(payment['state'] not in ('FAILED','RELEASED'),'종료된 결제 요청입니다.')
            key=field(event,'paymentKey')
        else:key=d.get('paymentKey') or payment['payment_key']
        require(payment['lease']<=time.time(),'PG 응답을 확인 중입니다. 잠시 후 다시 조회하세요.')
        if action=='release' and payment['state']=='PREPARED' and not payment['payment_key']:
            release(db,payment,order)
            db.execute("UPDATE orders SET state='APPROVED' WHERE id=?",(order['id'],))
            db.execute("UPDATE pg_payment SET state='RELEASED',updated=? WHERE id=?",(time.time(),payment['id']))
            return safe_view(db,first(db,'SELECT * FROM pg_payment WHERE id=?',(payment['id'],)))
        require(payment['state'] not in ('RELEASED','FAILED'),'종료된 결제 요청입니다.')
        require(isinstance(key,str) and 0<len(key)<=200,'결제 승인 결과를 먼저 확인하세요.')
        require(not payment['payment_key'] or payment['payment_key']==key,'이미 다른 결제 식별자가 연결됐습니다.')
        if action=='confirm':
            require(num(d,'amount',hi=10**12)==payment['amount'],'주문 금액과 결제 금액이 다릅니다.')
            require(order['state'] in ('PAYMENT_PENDING','PAID'),'결제할 수 있는 주문 단계가 아닙니다.')
        target=payment['refund_target']
        intent=payment['intent']
        if action in ('cancel','refund'):
            require(payment['captured'] and order['state']!='SETTLED','승인된 미정산 PG 결제를 선택하세요.')
            require(not db.execute("SELECT 1 FROM claim WHERE ord=? AND state='OPEN'",(order['id'],)).fetchone(),'진행 중인 문제 요청을 먼저 처리하세요.')
            if action=='cancel':
                require(order['state']=='PAID','출고 전 주문만 전액 취소할 수 있습니다.')
                target=payment['amount'];intent='CANCEL_ORDER'
            else:
                terms=first(db,'SELECT * FROM order_terms WHERE id=?',(order['id'],))
                require(order['state'] in ('PARTIAL','RECEIVED') and (order['state']=='RECEIVED' or terms['receipt_closed']),'검수를 먼저 마감하세요.')
                require(order['billed']==order['received'],'승인 명세서를 먼저 대조하세요.')
                target=refund_due(order,terms);intent='ADJUST'
                require(target>=payment['refunded'],'검수 금액과 기존 환불 금액이 다릅니다.')
            if target==payment['refunded']:return safe_view(db,payment)
        db.execute('UPDATE pg_payment SET payment_key=?,lease=?,state=?,refund_target=?,intent=?,updated=? WHERE id=?',
            (key,lease_token,'REFUNDING' if action in ('cancel','refund') else 'CONFIRMING',target,intent,time.time(),payment['id']))
        payment=dict(first(db,'SELECT * FROM pg_payment WHERE id=?',(payment['id'],)))
    try:
        gateway=gateway or Gateway(timeout=5 if webhook else 15)
        endpoint='/v1/payments/'+urllib.parse.quote(key,safe='')
        if action in ('cancel','refund'):
            remote=gateway.request('GET',endpoint)
            validate_remote(remote,payment)
            actual_refund=payment['amount']-remote['balanceAmount']
            if actual_refund!=target:
                require(actual_refund==payment['refunded'],'기존 PG 환불 결과를 먼저 재조회하세요.')
                remote=gateway.request('POST',endpoint+'/cancel',
                    {'cancelReason':'SmartNF 테스트 주문 취소' if action=='cancel' else 'SmartNF 검수 수량 조정','cancelAmount':target-payment['refunded']},
                    hashlib.sha256((payment['id']+':refund:'+str(target)).encode()).hexdigest())
        elif action in ('confirm','sync') and not payment['captured']:
            try:remote=gateway.request('GET',endpoint)
            except GatewayError as exc:
                if exc.status!=404:raise
                remote={'status':'IN_PROGRESS'}
            if remote.get('status') in ('READY','IN_PROGRESS'):
                remote=gateway.request('POST','/v1/payments/confirm',
                    {'paymentKey':key,'orderId':payment['pg_order'],'amount':payment['amount']},
                    hashlib.sha256((payment['id']+':confirm').encode()).hexdigest())
        else:
            remote=gateway.request('GET',endpoint)
        validate_remote(remote,payment)
        if action in ('cancel','refund'):
            require(payment['amount']-remote['balanceAmount']==target,'PG 환불 금액이 일치하지 않습니다.')
        with transaction(path) as db:
            fresh=first(db,'SELECT * FROM pg_payment WHERE id=?',(payment['id'],))
            require(fresh['lease']==lease_token,'다른 PG 처리 결과가 먼저 반영됐습니다.')
            apply_remote(db,fresh,remote)
            return safe_view(db,first(db,'SELECT * FROM pg_payment WHERE id=?',(payment['id'],)))
    except (GatewayError,ValueError,OSError) as exc:
        with transaction(path) as db:
            db.execute("UPDATE pg_payment SET lease=0,error='PG 처리 결과 재조회 필요',updated=? WHERE id=? AND lease=?",
                       (time.time(),payment['id'],lease_token))
        if isinstance(exc,GatewayError):raise
        raise ValueError('PG 응답 대조에 실패했습니다. 결제 상태를 다시 확인하세요.') from None


if __name__=='__main__':
    try:
        result=process(Path(os.getenv('SMARTNF_TRADE_DB','data/business/trade.sqlite')),int(sys.argv[1]),sys.argv[2],json.load(sys.stdin))
    except (ValueError,KeyError,TypeError,ArithmeticError,sqlite3.Error,GatewayError) as exc:
        result={'error':str(exc)[:200]}
    print(json.dumps(result,ensure_ascii=False))
