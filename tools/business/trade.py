"""Transactional SmartNF trading workspace. Integer quantities use the SKU's base unit."""
import hashlib
import json
import os
import sqlite3
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path
from trade_common import code, require, num, field, day, first, rows, move
import trade_operations as operations
import trade_quotes
import trade_payments

SCHEMA = """
CREATE TABLE IF NOT EXISTS org(id TEXT PRIMARY KEY,name TEXT);
CREATE TABLE IF NOT EXISTS staff(org TEXT,member INTEGER,role TEXT,PRIMARY KEY(org,member));
CREATE TABLE IF NOT EXISTS place(id TEXT PRIMARY KEY,org TEXT,name TEXT,zone TEXT);
CREATE TABLE IF NOT EXISTS sku(id TEXT PRIMARY KEY,product TEXT,seller TEXT,name TEXT,origin TEXT,unit TEXT,pack INTEGER,price INTEGER,barcode TEXT,allergens TEXT,protein INTEGER,sodium INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS seller_barcode ON sku(seller,barcode) WHERE barcode!='';
CREATE TABLE IF NOT EXISTS lot(id TEXT PRIMARY KEY,sku TEXT,producer_lot TEXT,expires TEXT,blocked INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS stock(org TEXT,place TEXT,lot TEXT,qty INTEGER CHECK(qty>=0),PRIMARY KEY(org,place,lot));
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,po TEXT,buyer TEXT,seller TEXT,sku TEXT,qty INTEGER,price INTEGER,state TEXT,paid INTEGER DEFAULT 0,received INTEGER DEFAULT 0,billed INTEGER,doc TEXT);
CREATE TABLE IF NOT EXISTS movement(id TEXT PRIMARY KEY,org TEXT,place TEXT,lot TEXT,qty INTEGER,reason TEXT,ref TEXT,day TEXT);
CREATE TABLE IF NOT EXISTS shipment(id TEXT PRIMARY KEY,ord TEXT,lot TEXT,qty INTEGER,received INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,ord TEXT,kind TEXT,amount INTEGER);
CREATE TABLE IF NOT EXISTS campaign(id TEXT PRIMARY KEY,seller TEXT,sku TEXT,target INTEGER,capacity INTEGER,deadline TEXT,delivery TEXT,state TEXT);
CREATE TABLE IF NOT EXISTS pledge(campaign TEXT,buyer TEXT,qty INTEGER,PRIMARY KEY(campaign,buyer));
CREATE TABLE IF NOT EXISTS offer(id TEXT PRIMARY KEY,seller TEXT,buyer TEXT,sku TEXT,price INTEGER,until_day TEXT);
CREATE TABLE IF NOT EXISTS sub(id TEXT PRIMARY KEY,buyer TEXT,oldsku TEXT,newsku TEXT,allergens TEXT,state TEXT);
CREATE TABLE IF NOT EXISTS policy(id TEXT PRIMARY KEY,org TEXT,kind TEXT,expires TEXT,reference TEXT);
CREATE TABLE IF NOT EXISTS audit(member INTEGER,org TEXT,action TEXT,result TEXT,at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS replay(member INTEGER,token TEXT,digest TEXT,result TEXT,PRIMARY KEY(member,token));
CREATE TABLE IF NOT EXISTS erp(record TEXT PRIMARY KEY,payload TEXT);
"""


def order(db,buyer,sku,qty,price,delivery="",region=""):
    require(buyer!=sku['seller'],'다른 판매업체를 선택하세요.')
    require(0<qty<=10**8 and qty*price//sku['pack']<=10**12,'주문 수량과 금액 범위를 확인하세요.')
    oid=code('ORD')
    db.execute('INSERT INTO orders(id,po,buyer,seller,sku,qty,price,state) VALUES(?,?,?,?,?,?,?,?)',
               (oid,code('PO'),buyer,sku['seller'],sku['id'],qty,price,'REQUESTED'))
    operations.snapshot(db,oid,sku,delivery,region)
    operations.notify(db,sku['seller'],oid,'새 발주가 도착했습니다.')
    operations.notify(db,buyer,oid,'발주 요청을 등록했습니다.')
    return oid


def transact(db,m,op,d):
    today=date.today().isoformat()
    if op=='organizations':
        return rows(db,'SELECT o.*,s.role FROM org o JOIN staff s ON o.id=s.org WHERE member=?',(m,))
    if op=='register':
        name=field(d,'name')
        existing=rows(db,'SELECT o.id,o.name FROM org o JOIN staff s ON o.id=s.org WHERE s.member=?',(m,))
        duplicates=[r['id'] for r in existing if r['name'].strip().casefold()==name.casefold()]
        require(not duplicates,'이미 등록된 업체입니다. 작업 업체에서 관리번호를 선택하세요. '+' / '.join(duplicates))
        org=code('B')
        db.execute('INSERT INTO org VALUES(?,?)',(org,name))
        db.execute('INSERT INTO staff VALUES(?,?,?)',(org,m,'ADMIN'))
        return {'id':org}
    org=field(d,'org')
    role=first(db,'SELECT role FROM staff WHERE member=? AND org=?',(m,org))[0]
    def allow(*roles):
        require(role=='ADMIN' or role in roles,'담당자 권한을 확인하세요.')
    def sku(k='sku'):
        return first(db,'SELECT * FROM sku WHERE id=?',(field(d,k),))
    if op=='deleteOrg':
        allow()
        require(field(d,'confirmedOrg')==org,'삭제할 업체 관리번호를 확인하세요.')
        links=db.execute('''SELECT 1 FROM place WHERE org=:o
            UNION ALL SELECT 1 FROM sku WHERE seller=:o
            UNION ALL SELECT 1 FROM orders WHERE buyer=:o OR seller=:o
            UNION ALL SELECT 1 FROM offer WHERE buyer=:o OR seller=:o
            UNION ALL SELECT 1 FROM stock WHERE org=:o
            UNION ALL SELECT 1 FROM movement WHERE org=:o
            UNION ALL SELECT 1 FROM campaign WHERE seller=:o
            UNION ALL SELECT 1 FROM pledge WHERE buyer=:o
            UNION ALL SELECT 1 FROM sub WHERE buyer=:o
            UNION ALL SELECT 1 FROM policy WHERE org=:o
            UNION ALL SELECT 1 FROM staff WHERE org=:o AND member<>:member LIMIT 1''',
            {'o':org,'member':m}).fetchone()
        require(links is None,'창고·업무 자료 또는 다른 담당자가 연결된 업체는 삭제할 수 없습니다.')
        require(not any(db.execute(sql,(org,org) if sql.count('?')==2 else (org,)).fetchone() for sql in (
            'SELECT 1 FROM partner WHERE owner=? OR partner=?',
            'SELECT 1 FROM rfq WHERE buyer=? OR seller=?',
            'SELECT 1 FROM budget WHERE org=?')),'거래처·견적 요청·예산 자료가 연결된 업체입니다.')
        db.execute('DELETE FROM staff WHERE org=?',(org,))
        db.execute('DELETE FROM org WHERE id=?',(org,))
        return {'삭제한 업체 관리번호':org}
    if op=='dashboard':
        return operations.dashboard(db,m,org)
    extra=operations.operation(db,m,org,role,op,d,order)
    if extra is not None:
        return extra
    if op=='staff':
        allow();r=field(d,'role')
        require(r in ('BUY','SELL','STORE','FINANCE'),'직무를 확인하세요.')
        db.execute('INSERT INTO staff VALUES(?,?,?)',(org,num(d,'member'),r))
    elif op=='warehouse':
        allow('STORE');wid=code('WH')
        db.execute('INSERT INTO place VALUES(?,?,?,?)',(wid,org,field(d,'name'),field(d,'zone')))
        return {'id':wid}
    elif op=='catalog':
        allow('SELL');sid=code('S');unit=field(d,'unit')
        require(unit in ('g','ml','ea'),'단위를 확인하세요.')
        product=d.get('product') or code('P')
        if d.get('product'):first(db,'SELECT id FROM sku WHERE seller=? AND product=?',(org,product))
        db.execute('INSERT INTO sku VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(sid,product,org,field(d,'name'),field(d,'origin'),unit,num(d,'pack'),num(d,'price'),str(d.get('barcode','')).strip(),field(d,'allergens'),num(d,'protein',0),num(d,'sodium',0)))
        operations.set_catalog_terms(db,sid,d)
        return {'id':sid,'product':product}
    elif op=='stock':
        allow('STORE');s=sku();require(s['seller']==org,'판매업체 상품을 선택하세요.')
        lot=code('LOT');db.execute('INSERT INTO lot VALUES(?,?,?,?,0)',(lot,s['id'],field(d,'producerLot'),day(d,'expires')))
        move(db,org,field(d,'place'),lot,num(d,'qty'),'입고','')
        return {'lot':lot}
    elif op in ('use','transfer','discard'):
        allow('STORE');lot=field(d,'lot');l=first(db,'SELECT * FROM lot WHERE id=?',(lot,))
        if op=='use':require(not l['blocked'] and l['expires']>=today,'회수 또는 기한 경과 로트입니다.')
        qty=num(d,'qty');ref=field(d,'reference')
        move(db,org,field(d,'place'),lot,-qty,op,ref)
        if op=='transfer':require(d['toPlace']!=d['place'],'서로 다른 창고를 선택하세요.')
        if op=='transfer':move(db,org,field(d,'toPlace'),lot,qty,op,ref)
    elif op=='plan':
        s=sku();people=num(d,'people');need=people*num(d,'perPerson');due=day(d,'delivery')
        require(due>=today,'사용일을 확인하세요.')
        available=rows(db,'SELECT s.lot,s.qty,l.expires FROM stock s JOIN lot l ON l.id=s.lot WHERE s.org=? AND l.sku=? AND l.expires>=? AND l.blocked=0 AND s.qty>0 ORDER BY l.expires',(org,s['id'],due))
        short=max(0,need-sum(x['qty'] for x in available));packs=(short+s['pack']-1)//s['pack']
        return {'필요량':need,'단위':s['unit'],'기한순 사용 로트':available,'추가 필요량':short,'발주 포장수':packs,'발주금액':packs*s['price'],'표시단가 기준 1인분 예상원가':round(need*s['price']/s['pack']/people,2)}
    elif op in ('substitute','acceptSub'):
        allow('BUY')
        if op=='substitute':
            old,new=sku('oldSku'),sku('newSku')
            require(old['unit']==new['unit'],'동일 단위 상품을 선택하세요.')
            key=code('SUB');avoid={a.strip() for a in field(d,'avoid').split(',')}
            labels={a.strip() for a in new['allergens'].split(',')}
            status='REVIEW' if '미확인' in labels or avoid&labels-{'없음'} else 'PROPOSED'
            db.execute('INSERT INTO sub VALUES(?,?,?,?,?,?)',(key,org,old['id'],new['id'],new['allergens'],status))
            return {'id':key,'상태':status,'새 상품 알레르기 표시':new['allergens'],'동일 100단위당 단백질 변화(g)':new['protein']-old['protein'],'나트륨 변화(mg)':new['sodium']-old['sodium'],'100단위당 가격 변화':round(100*(new['price']/new['pack']-old['price']/old['pack']),2)}
        require(db.execute("UPDATE sub SET state='APPROVED' WHERE id=? AND buyer=? AND state='PROPOSED'",(field(d,'id'),org)).rowcount==1,'승인 가능한 대체안을 선택하세요.')
    elif op=='quote':
        allow('SELL');s=sku();require(s['seller']==org,'판매자 SKU를 확인하세요.')
        buyer=field(d,'buyer');first(db,'SELECT id FROM org WHERE id=?',(buyer,))
        key=code('Q');db.execute('INSERT INTO offer VALUES(?,?,?,?,?,?)',(key,org,buyer,s['id'],num(d,'price'),day(d,'until')))
        require(day(d,'until')>=today,'견적 유효일을 확인하세요.')
        trade_quotes.activate(db,key)
        operations.notify(db,buyer,key,'새 견적이 도착했습니다.')
        return {'id':key}
    elif op=='order':
        allow('BUY');s=sku();price=s['price']
        if d.get('quote'):
            price=first(db,"SELECT o.price FROM offer o JOIN quote_meta m ON m.quote=o.id WHERE o.id=? AND o.buyer=? AND o.sku=? AND o.until_day>=? AND m.state='ACTIVE'",(d['quote'],org,s['id'],today))[0]
        delivery,region=operations.validate_delivery(d,operations.terms(db,s['id']))
        link=db.execute('SELECT * FROM offer_request WHERE offer=?',(d.get('quote',''),)).fetchone()
        if link:
            require(not link['ord'],'이미 발주한 견적입니다.')
            first(db,"SELECT id FROM rfq WHERE id=? AND buyer=? AND state='OPEN'",(link['rfq'],org))
        oid=order(db,org,s,num(d,'packs',hi=10**8//s['pack'])*s['pack'],price,delivery,region)
        if link:
            db.execute('UPDATE offer_request SET ord=? WHERE offer=?',(oid,d['quote']))
            db.execute("UPDATE rfq SET state='ORDERED' WHERE id=?",(link['rfq'],))
        return {'id':oid}
    elif op in ('approve','pay','ship','receive','invoice','settle','cancel','erp'):
        oid=field(d,'id');o=first(db,'SELECT * FROM orders WHERE id=? AND (buyer=? OR seller=?)',(oid,org,org))
        s=operations.order_sku(db,o)
        terms=first(db,'SELECT * FROM order_terms WHERE id=?',(o['id'],))
        total=o['price']*o['qty']//s['pack']+terms['shipping']
        is_pg=trade_payments.guard(db,oid,op)
        if op!='erp':
            require(not db.execute("SELECT 1 FROM claim WHERE ord=? AND state='OPEN'",(oid,)).fetchone(),'처리 중인 변경·검수 문제 요청을 먼저 해결하세요.')
        def gate(side,states,*roles):
            allow(*roles);require(o[side]==org and o['state'] in states,'거래 당사자와 처리 단계를 확인하세요.')
        def state(v):db.execute('UPDATE orders SET state=? WHERE id=?',(v,oid))
        def entry(kind,v):db.execute('INSERT INTO ledger VALUES(?,?,?,?)',(code('TX'),oid,kind,v))
        if op=='approve':
            gate('seller',['REQUESTED'],'SELL');state('APPROVED')
        elif op=='pay':
            gate('buyer',['APPROVED'],'BUY','FINANCE')
            require(not terms['due_day'] or terms['due_day']>=today,'희망 납기가 지났습니다. 판매자와 납기를 확인하세요.')
            lots=rows(db,'SELECT s.*,l.expires FROM stock s JOIN lot l ON l.id=s.lot WHERE s.org=? AND l.sku=? AND l.blocked=0 AND l.expires>=? AND s.qty>0 ORDER BY l.expires',(o['seller'],s['id'],max(today,terms['due_day'])))
            remaining=o['qty']
            for r in lots:
                n=min(remaining,r['qty']);move(db,o['seller'],r['place'],r['lot'],-n,'예약',oid);remaining-=n
                if not remaining:break
            require(remaining==0,'예약 가능한 재고가 부족합니다.')
            entry('모의 결제',total);db.execute("UPDATE orders SET state='PAID',paid=? WHERE id=?",(total,oid))
        elif op=='cancel':
            gate('buyer',['REQUESTED','APPROVED','PAID'],'BUY','FINANCE')
            for r in rows(db,"SELECT * FROM movement WHERE ref=? AND reason='예약'",(oid,)):move(db,o['seller'],r['place'],r['lot'],-r['qty'],'예약 해제',oid)
            if o['paid']:entry('모의 환불',-o['paid'])
            state('CANCELLED')
        elif op=='ship':
            gate('seller',['PAID'],'STORE')
            for r in rows(db,"SELECT m.*,l.blocked,l.expires FROM movement m JOIN lot l ON l.id=m.lot WHERE ref=? AND reason='예약'",(oid,)):
                require(not r['blocked'] and r['expires']>=today,'출고 금지 로트입니다.')
                db.execute('INSERT INTO shipment VALUES(?,?,?,?,0)',(code('OUT'),oid,r['lot'],-r['qty']))
            state('SHIPPED')
        elif op=='receive':
            gate('buyer',['SHIPPED','PARTIAL'],'STORE')
            require(not terms['receipt_closed'],'검수 마감된 주문입니다.')
            r=first(db,'SELECT * FROM shipment WHERE id=? AND ord=?',(field(d,'shipment'),oid))
            n=num(d,'qty');require(n<=r['qty']-r['received'],'미수령 수량을 초과했습니다.')
            move(db,org,field(d,'place'),r['lot'],n,'검수 입고',oid)
            db.execute('UPDATE shipment SET received=received+? WHERE id=?',(n,r['id']))
            db.execute('UPDATE orders SET received=received+?,state=? WHERE id=?',(n,'RECEIVED' if n+o['received']==o['qty'] else 'PARTIAL',oid))
        elif op=='invoice':
            gate('buyer',['PARTIAL','RECEIVED'],'FINANCE')
            from documents import handle
            doc=handle(Path(os.getenv('SMARTNF_DOCUMENT_DIR','data/business-documents')),m,'get',{'id':field(d,'doc')})
            require(doc['state'] in ('APPROVED','SENT'),'승인한 거래명세서를 선택하세요.')
            items=[r for r in doc['rows'] if r['sku']==s['id']]
            require(items,'명세서에 주문 SKU가 없습니다.')
            from decimal import Decimal, ROUND_HALF_UP
            require(len(items)==len(doc['rows']),'단일 발주 전용 명세서를 선택하세요.')
            require(not db.execute('SELECT 1 FROM orders WHERE doc=? AND id<>?',(doc['id'],oid)).fetchone(),'이미 연결된 명세서입니다.')
            raw_quantity=sum(Decimal(str(r['qty'])) for r in items)*s['pack']
            require(raw_quantity.is_finite() and raw_quantity==raw_quantity.to_integral_value() and 0<raw_quantity<=10**8,
                    '명세서 포장 수를 상품 기본 단위 수량으로 정확히 환산할 수 있어야 합니다.')
            billed=int(raw_quantity)
            expected=(Decimal(billed)*o['price']/s['pack']).quantize(Decimal('1'),rounding=ROUND_HALF_UP)
            require(sum(Decimal(str(r['total'])) for r in items)==expected,'세금 포함 청구금액과 발주금액이 다릅니다.')
            db.execute('UPDATE orders SET billed=?,doc=? WHERE id=?',(billed,doc['id'],oid))
            return {'발주량':o['qty'],'검수량':o['received'],'청구량':billed,'청구 차이':billed-o['received']}
        elif op=='settle':
            gate('buyer',['PARTIAL','RECEIVED'],'FINANCE')
            require(o['received']==o['billed'],'검수량과 승인 청구량을 먼저 대조하세요.')
            require(o['state']=='RECEIVED' or terms['receipt_closed'],'일부 입고는 부족분 또는 반품 처리 합의 후 정산하세요.')
            accepted=(o['received']*o['price']+s['pack']//2)//s['pack']+(terms['shipping'] if o['received'] else 0)
            if is_pg:
                payment=trade_payments.latest(db,oid)
                require(payment['refunded']==total-accepted,'PG 검수 차액 환불을 먼저 완료하세요.')
            elif total>accepted:
                entry('부족분 모의 환불',accepted-total)
            fee=accepted*int(os.getenv('SMARTNF_TEST_FEE_BPS','0'))//10000
            require(0<=fee<=accepted,'수수료 설정을 확인하세요.')
            entry('PG 테스트 수수료' if is_pg else '중개 수수료',fee)
            entry('PG 정산 예정' if is_pg else '모의 지급',accepted-fee);state('SETTLED')
        else:
            gate('buyer',['SETTLED'],'FINANCE')
            data=json.dumps(dict(o),sort_keys=True)
            db.execute('INSERT OR IGNORE INTO erp VALUES(?,?)',(oid,data))
            require(first(db,'SELECT payload FROM erp WHERE record=?',(oid,))[0]==data,'ERP 값이 일치하지 않습니다.')
            return {'모의 ERP 대조 완료':oid}
    elif op=='campaign':
        allow('SELL');s=sku();require(s['seller']==org,'판매자 SKU를 확인하세요.')
        goal,cap=num(d,'target'),num(d,'capacity');end,due=day(d,'deadline'),day(d,'delivery')
        require(goal<=cap and today<=end<=due,'목표·예약 한도·출하일을 확인하세요.')
        key=code('GRP');db.execute('INSERT INTO campaign VALUES(?,?,?,?,?,?,?,?)',(key,org,s['id'],goal,cap,end,due,'OPEN'))
        return {'id':key}
    elif op in ('pledge','close'):
        k=field(d,'id');g=first(db,"SELECT * FROM campaign WHERE id=? AND state='OPEN'",(k,))
        if op=='pledge':
            allow('BUY');require(g['seller']!=org and today<=g['deadline'],'예약 기간·구매 업체를 확인하세요.')
            db.execute('INSERT OR REPLACE INTO pledge VALUES(?,?,?)',(k,org,num(d,'qty')))
            require(first(db,'SELECT sum(qty) FROM pledge WHERE campaign=?',(k,))[0]<=g['capacity'],'예약 한도 초과')
        else:
            allow('SELL');require(g['seller']==org,'판매자만 확정할 수 있습니다.')
            parts=rows(db,'SELECT * FROM pledge WHERE campaign=?',(k,));total=sum(x['qty'] for x in parts)
            require(all(r['qty']<=10**8 for r in parts),'수량을 확인하세요.')
            require(total>=g['target'] or today>=g['deadline'],'마감일까지 모집 중입니다.')
            success=total>=g['target'];s=first(db,'SELECT * FROM sku WHERE id=?',(g['sku'],))
            if success:
                
                for r in parts:order(db,r['buyer'],s,r['qty']*s['pack'],s['price'],g['delivery'])
            db.execute('UPDATE campaign SET state=? WHERE id=?',('CONFIRMED' if success else 'UNMET',k))
    elif op=='recall':
        allow('STORE');lot=field(d,'lot')
        first(db,'SELECT l.id FROM lot l JOIN sku s ON s.id=l.sku WHERE l.id=? AND s.seller=?',(lot,org))
        db.execute('UPDATE lot SET blocked=1 WHERE id=?',(lot,))
        return {'잔여재고':rows(db,'SELECT org,place,qty FROM stock WHERE lot=?',(lot,)),'납품·사용':rows(db,"SELECT org,reason,qty,ref,day FROM movement WHERE lot=? AND reason IN ('검수 입고','use')",(lot,))}
    elif op=='insurance':
        allow();db.execute('INSERT INTO policy VALUES(?,?,?,?,?)',(code('INS'),org,field(d,'kind'),day(d,'expires'),field(d,'reference')))
    else:raise ValueError('지원하지 않는 작업입니다.')
    return {'처리':'완료'}


def process(path,m,op,d):
    require(isinstance(d,dict),'요청 형식을 확인하세요.')
    path.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(path,timeout=10);db.row_factory=sqlite3.Row
    try:
        db.executescript(SCHEMA+operations.SCHEMA+trade_quotes.SCHEMA+trade_payments.SCHEMA);db.execute('BEGIN IMMEDIATE')
        operations.migrate(db)
        trade_quotes.migrate(db)
        reading=op in ('dashboard','organizations','plan','notifications','report','reportExcel')
        if op not in ('organizations','register'):
            first(db,'SELECT role FROM staff WHERE member=? AND org=?',(m,field(d,'org')))
        if not reading:
            token=field(d,'requestId');digest=hashlib.sha256(json.dumps([op,d],sort_keys=True).encode()).hexdigest()
            old=db.execute('SELECT digest,result FROM replay WHERE member=? AND token=?',(m,token)).fetchone()
            if old:
                require(old[0]==digest,'요청 번호가 다른 작업에서 사용됐습니다.')
                return json.loads(old[1])
        result=transact(db,m,op,d)
        if op in ('approve','pay','ship','receive','invoice','settle','cancel','erp'):
            order_row=first(db,'SELECT * FROM orders WHERE id=?',(d['id'],))
            messages={'approve':'판매자가 발주를 승인했습니다.','pay':'모의 결제와 재고 예약이 완료됐습니다.',
                'ship':'상품이 출고됐습니다.','receive':'도착 수량 검수가 등록됐습니다.','invoice':'승인 명세서 대조가 완료됐습니다.',
                'settle':'모의 정산이 완료됐습니다.','cancel':'주문이 취소됐습니다.','erp':'모의 ERP 대조가 완료됐습니다.'}
            for target in (order_row['buyer'],order_row['seller']):
                operations.notify(db,target,d['id'],messages[op])
            db.execute('UPDATE order_terms SET updated=? WHERE id=?',(operations.now(),d['id']))
        if op=='recall':
            affected=rows(db,'SELECT DISTINCT org FROM stock WHERE lot=?',(d['lot'],))
            for target in affected:operations.notify(db,target['org'],d['lot'],'보유 로트에 회수 차단이 등록됐습니다.')
        if not reading:
            encoded=json.dumps(result,ensure_ascii=False)
            db.execute('INSERT INTO replay VALUES(?,?,?,?)',(m,token,digest,encoded))
            db.execute('INSERT INTO audit(member,org,action,result) VALUES(?,?,?,?)',(m,d.get('org',''),op,encoded))
        db.commit();return result
    finally:db.close()


if __name__=='__main__':
    try:
        result=process(Path(os.getenv('SMARTNF_TRADE_DB','data/business/trade.sqlite')),int(sys.argv[1]),sys.argv[2],json.load(sys.stdin))
    except sqlite3.IntegrityError:
        result={'error':'이미 등록된 담당자 또는 바코드가 있습니다. 입력값을 확인하세요.'}
    except sqlite3.OperationalError:
        result={'error':'거래 저장소 연결 또는 다른 작업의 처리 상태를 확인하고 잠시 후 다시 시도하세요.'}
    except (ValueError,KeyError,ArithmeticError,TypeError) as exc:
        result={'error':str(exc)[:250]}
    print(json.dumps(result,ensure_ascii=False))
