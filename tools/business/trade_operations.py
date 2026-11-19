"""Business terms, partner records, requests, notifications and performance reports."""
import csv
import io
import json
import base64
import trade_quotes
import trade_payments
from datetime import date, datetime, timezone, timedelta
from trade_common import code, require, num, field, day, first, rows, move

SCHEMA = """
CREATE TABLE IF NOT EXISTS business_schema(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS catalog_terms(sku TEXT PRIMARY KEY,active INTEGER DEFAULT 1,min_packs INTEGER DEFAULT 1,shipping INTEGER DEFAULT 0,region TEXT DEFAULT '',lead_days INTEGER DEFAULT 0,tax_note TEXT DEFAULT '표시가격에 세금 포함');
CREATE TABLE IF NOT EXISTS order_terms(id TEXT PRIMARY KEY,name TEXT,origin TEXT,unit TEXT,pack INTEGER,shipping INTEGER,region TEXT,due_day TEXT,tax_note TEXT,created TEXT,updated TEXT,receipt_closed INTEGER DEFAULT 0,min_packs INTEGER DEFAULT 1,lead_days INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS partner(owner TEXT,partner TEXT,kind TEXT,contact TEXT,phone TEXT,address TEXT,terms TEXT,note TEXT,PRIMARY KEY(owner,partner));
CREATE TABLE IF NOT EXISTS rfq(id TEXT PRIMARY KEY,buyer TEXT,seller TEXT,name TEXT,spec TEXT,unit TEXT,qty INTEGER,delivery TEXT,region TEXT,note TEXT,state TEXT,created TEXT);
CREATE TABLE IF NOT EXISTS offer_request(offer TEXT PRIMARY KEY,rfq TEXT,ord TEXT);
CREATE TABLE IF NOT EXISTS claim(id TEXT PRIMARY KEY,ord TEXT,requester TEXT,kind TEXT,qty INTEGER,packs INTEGER,reason TEXT,state TEXT,created TEXT,resolution TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS notice(id INTEGER PRIMARY KEY AUTOINCREMENT,org TEXT,ref TEXT,message TEXT,at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notice_read(notice INTEGER,member INTEGER,PRIMARY KEY(notice,member));
CREATE TABLE IF NOT EXISTS budget(org TEXT,start TEXT,end TEXT,amount INTEGER,PRIMARY KEY(org,start,end));
"""


def now():
    return datetime.now(timezone(timedelta(hours=9))).isoformat()


def optional(d, key, limit=1000):
    value=str(d.get(key,'')).strip()
    require(len(value)<=limit,key+' 입력이 너무 깁니다.')
    return value


def notify(db, org, ref, message):
    db.execute('INSERT INTO notice(org,ref,message) VALUES(?,?,?)',(org,ref,message))


def migrate(db):
    if db.execute('SELECT 1 FROM business_schema WHERE version=1').fetchone():
        return
    db.execute('INSERT OR IGNORE INTO catalog_terms(sku) SELECT id FROM sku')
    db.execute('''INSERT OR IGNORE INTO order_terms(id,name,origin,unit,pack,shipping,region,due_day,tax_note,created,updated)
        SELECT o.id,s.name,s.origin,s.unit,s.pack,0,'','','표시가격에 세금 포함',
        COALESCE((SELECT datetime(at,'+9 hours') FROM audit WHERE action='order' AND json_extract(result,'$.id')=o.id ORDER BY at LIMIT 1),'0001-01-01'),
        COALESCE((SELECT datetime(at,'+9 hours') FROM audit WHERE action='order' AND json_extract(result,'$.id')=o.id ORDER BY at LIMIT 1),'0001-01-01')
        FROM orders o JOIN sku s ON s.id=o.sku''')
    db.execute('INSERT INTO business_schema VALUES(1)')


def terms(db, sku):
    return first(db,'SELECT * FROM catalog_terms WHERE sku=?',(sku,))


def snapshot(db, oid, sku, delivery='', region=''):
    t=terms(db,sku['id'])
    require(t['active'],'판매 중지 상품입니다.')
    order=first(db,'SELECT qty FROM orders WHERE id=?',(oid,))
    require(order['qty']%sku['pack']==0 and order['qty']//sku['pack']>=t['min_packs'],'최소 주문 포장 수를 확인하세요.')
    db.execute('''INSERT INTO order_terms(id,name,origin,unit,pack,shipping,region,due_day,tax_note,created,updated,min_packs,lead_days)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''',(oid,sku['name'],sku['origin'],sku['unit'],sku['pack'],t['shipping'],region or t['region'],delivery,t['tax_note'],now(),now(),t['min_packs'],t['lead_days']))


def order_sku(db, order):
    s=dict(first(db,'SELECT * FROM sku WHERE id=?',(order['sku'],)))
    t=first(db,'SELECT * FROM order_terms WHERE id=?',(order['id'],))
    for key in ('name','origin','unit','pack'):s[key]=t[key]
    return s


def orders(db, org):
    return rows(db,'''SELECT o.*,t.name,t.origin,t.unit,t.pack,t.shipping,t.region,t.due_day,t.tax_note,t.created,t.updated,t.receipt_closed,t.min_packs,t.lead_days,
        (SELECT p.state FROM pg_payment p WHERE p.ord=o.id ORDER BY p.created DESC LIMIT 1) pg_state,
        (SELECT p.refunded FROM pg_payment p WHERE p.ord=o.id ORDER BY p.created DESC LIMIT 1) pg_refunded,
        b.name buyerName,v.name sellerName,EXISTS(SELECT 1 FROM erp e WHERE e.record=o.id) erp_verified FROM orders o JOIN order_terms t ON t.id=o.id
        JOIN org b ON b.id=o.buyer JOIN org v ON v.id=o.seller
        WHERE o.buyer=? OR o.seller=? ORDER BY t.created DESC''',(org,org))


def notifications(db, member, org):
    return {'notifications':rows(db,'''SELECT n.*,CASE WHEN r.notice IS NULL THEN 0 ELSE 1 END isRead
        FROM notice n LEFT JOIN notice_read r ON r.notice=n.id AND r.member=?
        WHERE n.org=? ORDER BY isRead,n.id DESC LIMIT 100''',(member,org)),
        'unread':first(db,'''SELECT count(*) FROM notice n WHERE n.org=? AND NOT EXISTS
        (SELECT 1 FROM notice_read r WHERE r.notice=n.id AND r.member=?)''',(org,member))[0]}


def dashboard(db, member, org):
    return {'업체':rows(db,'SELECT * FROM org ORDER BY name'),
        '상품':rows(db,'SELECT s.*,t.active,t.min_packs,t.shipping,t.region,t.lead_days,t.tax_note,o.name sellerName FROM sku s JOIN catalog_terms t ON t.sku=s.id JOIN org o ON o.id=s.seller ORDER BY s.name'),
        '창고':rows(db,'SELECT * FROM place WHERE org=?',(org,)),
        '재고':rows(db,'''SELECT s.*,l.sku,l.expires,l.blocked,l.producer_lot,k.name,k.unit,k.pack,p.name placeName
            FROM stock s JOIN lot l ON l.id=s.lot JOIN sku k ON k.id=l.sku JOIN place p ON p.id=s.place WHERE s.org=?''',(org,)),
        '견적':trade_quotes.quote_rows(db,org),
        '가격협의':rows(db,'SELECT p.* FROM price_request p JOIN offer o ON o.id=p.quote WHERE o.buyer=? OR o.seller=?',(org,org)),
        '거래':orders(db,org),
        '출고':rows(db,'SELECT s.*,t.name,t.unit,t.pack FROM shipment s JOIN orders o ON o.id=s.ord JOIN order_terms t ON t.id=o.id WHERE o.buyer=? OR o.seller=?',(org,org)),
        '예약모집':rows(db,'SELECT * FROM campaign'),
        '대체안':rows(db,'SELECT * FROM sub WHERE buyer=?',(org,)),
        '정산원장':rows(db,'SELECT l.* FROM ledger l JOIN orders o ON o.id=l.ord WHERE o.buyer=? OR o.seller=?',(org,org)),
        'PG 결제':[trade_payments.safe_view(db,p) for p in rows(db,'SELECT p.* FROM pg_payment p JOIN orders o ON o.id=p.ord WHERE o.buyer=? OR o.seller=?',(org,org))],
        '보험':rows(db,'SELECT * FROM policy WHERE org=?',(org,)),
        '거래처':rows(db,'SELECT p.*,o.name FROM partner p JOIN org o ON o.id=p.partner WHERE owner=?',(org,)),
        '견적요청':rows(db,'SELECT * FROM rfq WHERE buyer=? OR seller=? ORDER BY created DESC',(org,org)),
        '변경요청':rows(db,'SELECT c.* FROM claim c JOIN orders o ON o.id=c.ord WHERE o.buyer=? OR o.seller=? ORDER BY c.created DESC',(org,org)),
        **notifications(db,member,org)}


def validate_delivery(d, terms):
    from datetime import timedelta
    delivery=optional(d,'delivery',10)
    region=optional(d,'region',200)
    if terms['region']:
        require(region==terms['region'],'배송 가능 지역을 확인하고 동일하게 입력하세요.')
    if delivery:
        require(date.fromisoformat(delivery)>=date.today()+timedelta(days=terms['lead_days']),'납품 준비 기간보다 이른 날짜입니다.')
    return delivery,region


def set_catalog_terms(db, sku, d):
    active=num(d,'active',0,1) if 'active' in d else 1
    minimum=num(d,'min_packs') if d.get('min_packs') else 1
    shipping=num(d,'shipping',0) if d.get('shipping') else 0
    lead=num(d,'lead_days',0,365) if d.get('lead_days') else 0
    db.execute('''INSERT INTO catalog_terms VALUES(?,?,?,?,?,?,?) ON CONFLICT(sku) DO UPDATE SET
        active=excluded.active,min_packs=excluded.min_packs,shipping=excluded.shipping,region=excluded.region,
        lead_days=excluded.lead_days,tax_note=excluded.tax_note''',
        (sku,active,minimum,shipping,optional(d,'region',200),lead,optional(d,'tax_note',200) or '표시가격에 세금 포함'))


def operation(db, member, org, role, op, d, create_order):
    def allow(*roles):
        require(role=='ADMIN' or role in roles,'담당자 권한을 확인하세요.')
    quote_result=trade_quotes.operation(db,org,role,op,d,notify,now)
    if quote_result is not None:return quote_result
    if op=='notifications':return notifications(db,member,org)
    if op=='readNotice':
        notice=num(d,'id')
        first(db,'SELECT id FROM notice WHERE id=? AND org=?',(notice,org))
        db.execute('INSERT OR IGNORE INTO notice_read VALUES(?,?)',(notice,member))
    elif op=='partner':
        allow('BUY','SELL')
        target=field(d,'partner')
        first(db,'SELECT id FROM org WHERE id=?',(target,))
        require(target!=org,'다른 업체를 선택하세요.')
        kind=field(d,'kind');require(kind in ('CUSTOMER','SUPPLIER','BOTH'),'거래처 구분을 확인하세요.')
        values=[optional(d,k) for k in ('contact','phone','address','terms','note')]
        db.execute('''INSERT INTO partner VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(owner,partner) DO UPDATE SET
            kind=excluded.kind,contact=excluded.contact,phone=excluded.phone,address=excluded.address,terms=excluded.terms,note=excluded.note''',(org,target,kind,*values))
    elif op=='catalogEdit':
        allow('SELL');sid=field(d,'sku')
        s=first(db,'SELECT * FROM sku WHERE id=? AND seller=?',(sid,org))
        require(field(d,'unit')==s['unit'] and num(d,'pack')==s['pack'],'포장 규격 변경은 새 SKU로 등록하세요. 기존 재고 단위가 연결돼 있습니다.')
        db.execute('UPDATE sku SET name=?,origin=?,price=?,barcode=?,allergens=?,protein=?,sodium=? WHERE id=?',
            (field(d,'name'),field(d,'origin'),num(d,'price'),optional(d,'barcode',200),field(d,'allergens'),num(d,'protein',0),num(d,'sodium',0),sid))
        set_catalog_terms(db,sid,d)
    elif op=='rfq':
        allow('BUY');seller=field(d,'seller')
        first(db,'SELECT id FROM org WHERE id=?',(seller,));require(seller!=org,'공급업체를 선택하세요.')
        unit=field(d,'unit');require(unit in ('g','ml','ea'),'단위를 확인하세요.')
        due=day(d,'delivery');require(due>=date.today().isoformat(),'희망 납기를 확인하세요.')
        key=code('RFQ')
        db.execute('INSERT INTO rfq VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(key,org,seller,field(d,'name'),field(d,'spec'),unit,num(d,'qty'),due,optional(d,'region',200),optional(d,'note'),'OPEN',now()))
        notify(db,seller,key,'새 식재료 견적 요청이 도착했습니다.')
        return {'id':key}
    elif op=='quoteRfq':
        allow('SELL')
        request=first(db,"SELECT * FROM rfq WHERE id=? AND seller=? AND state='OPEN'",(field(d,'rfq'),org))
        s=first(db,'SELECT * FROM sku WHERE id=? AND seller=?',(field(d,'sku'),org))
        require(s['unit']==request['unit'],'요청과 상품의 단위를 확인하세요.')
        require(terms(db,s['id'])['active'],'판매 중지 상품입니다.')
        until=day(d,'until');require(until>=date.today().isoformat(),'견적 유효일을 확인하세요.')
        key=code('Q')
        db.execute('INSERT INTO offer VALUES(?,?,?,?,?,?)',(key,org,request['buyer'],s['id'],num(d,'price'),until))
        db.execute('INSERT INTO offer_request(offer,rfq) VALUES(?,?)',(key,request['id']))
        previous=db.execute("SELECT r.offer FROM offer_request r JOIN quote_meta m ON m.quote=r.offer WHERE r.rfq=? AND m.state='ACTIVE' ORDER BY r.rowid DESC LIMIT 1",(request['id'],)).fetchone()
        trade_quotes.activate(db,key,previous[0] if previous else None)
        notify(db,request['buyer'],key,'요청한 식재료의 견적이 도착했습니다. 규격과 가격을 확인하세요.')
        return {'id':key,'요청량':request['qty'],'기본 단위':s['unit'],'제안 포장수':(request['qty']+s['pack']-1)//s['pack']}
    elif op=='editOrder':
        allow('BUY')
        o=first(db,"SELECT * FROM orders WHERE id=? AND buyer=? AND state='REQUESTED'",(field(d,'id'),org))
        require(not db.execute("SELECT 1 FROM claim WHERE ord=? AND state='OPEN'",(o['id'],)).fetchone(),'열린 변경 요청을 먼저 처리하세요.')
        s=order_sku(db,o);minimum=first(db,'SELECT min_packs FROM order_terms WHERE id=?',(o['id'],))[0];packs=num(d,'packs')
        require(packs>=minimum and packs*s['pack']<=10**8 and packs*o['price']<=10**12,'최소 주문 포장 수와 수량 범위를 확인하세요.')
        db.execute('UPDATE orders SET qty=? WHERE id=?',(packs*s['pack'],o['id']))
        notify(db,o['seller'],o['id'],'승인 대기 발주 수량이 변경됐습니다.')
    elif op=='requestChange':
        allow('BUY')
        o=first(db,"SELECT * FROM orders WHERE id=? AND buyer=? AND state NOT IN ('SETTLED','CANCELLED')",(field(d,'id'),org))
        trade_payments.guard(db,o['id'],'requestChange')
        kind=field(d,'kind');require(kind in ('CHANGE','CANCEL','SHORTAGE','DAMAGE','RETURN'),'요청 종류를 확인하세요.')
        require(not db.execute("SELECT 1 FROM claim WHERE ord=? AND state='OPEN'",(o['id'],)).fetchone(),'기존 요청을 먼저 처리하세요.')
        qty=num(d,'qty',0) if d.get('qty') else 0
        packs=num(d,'packs',0) if d.get('packs') else 0
        if kind=='CHANGE':require(o['state']=='APPROVED' and packs>0,'결제 전 승인 발주만 수량 변경을 요청할 수 있습니다.')
        if kind=='CANCEL':require(o['state'] in ('REQUESTED','APPROVED','PAID'),'출고 후에는 반품을 요청하세요.')
        if kind=='SHORTAGE':require(o['state']=='PARTIAL' and qty==o['qty']-o['received'],'미입고 수량을 정확히 입력하세요.')
        if kind in ('RETURN','DAMAGE'):require(o['state'] in ('PARTIAL','RECEIVED') and 0<qty<=o['received'],'검수한 수량 이내로 입력하세요.')
        key=code('CLM')
        db.execute('INSERT INTO claim(id,ord,requester,kind,qty,packs,reason,state,created) VALUES(?,?,?,?,?,?,?,\'OPEN\',?)',
            (key,o['id'],org,kind,qty,packs,field(d,'reason'),now()))
        notify(db,o['seller'],o['id'],'구매자가 변경·취소 또는 검수 문제 처리를 요청했습니다.')
        return {'id':key}
    elif op=='resolveClaim':
        allow('SELL')
        c=first(db,"SELECT c.* FROM claim c JOIN orders o ON o.id=c.ord WHERE c.id=? AND o.seller=? AND c.state='OPEN'",(field(d,'id'),org))
        o=first(db,'SELECT * FROM orders WHERE id=?',(c['ord'],))
        decision=field(d,'decision');require(decision in ('ACCEPT','REJECT'),'처리 결과를 확인하세요.')
        resolution=field(d,'resolution')
        if decision=='ACCEPT':
            if c['kind']=='CANCEL':
                require(o['state'] in ('REQUESTED','APPROVED','PAID'),'현재 주문 단계에서는 취소할 수 없습니다.')
                is_pg=trade_payments.guard(db,o['id'],'resolveClaim')
                if is_pg:
                    notify(db,o['buyer'],o['id'],'취소 합의가 완료됐습니다. PG 전액 취소를 진행하세요.')
                else:
                    for r in rows(db,"SELECT * FROM movement WHERE ref=? AND reason='예약'",(o['id'],)):
                        move(db,org,r['place'],r['lot'],-r['qty'],'예약 해제',o['id'])
                    if o['paid']:db.execute('INSERT INTO ledger VALUES(?,?,?,?)',(code('TX'),o['id'],'모의 환불',-o['paid']))
                    db.execute("UPDATE orders SET state='CANCELLED' WHERE id=?",(o['id'],))
            elif c['kind']=='CHANGE':
                require(o['state']=='APPROVED','결제 전 발주만 변경할 수 있습니다.')
                s=order_sku(db,o);require(c['packs']>=first(db,'SELECT min_packs FROM order_terms WHERE id=?',(o['id'],))[0] and c['packs']*s['pack']<=10**8 and c['packs']*o['price']<=10**12,'최소 주문량과 수량 범위를 확인하세요.')
                db.execute("UPDATE orders SET qty=?,state='APPROVED' WHERE id=?",(c['packs']*s['pack'],o['id']))
            elif c['kind']=='SHORTAGE':
                require(c['qty']==o['qty']-o['received'],'미입고 수량이 변경됐습니다.')
                db.execute('UPDATE order_terms SET receipt_closed=1 WHERE id=?',(o['id'],))
            else:
                require(c['qty']<=o['received'],'반품 수량을 확인하세요.')
                remaining=c['qty']
                # Only stock received for this order may be returned. Consumption can make it unavailable.
                receipts=rows(db,"SELECT * FROM movement WHERE ref=? AND reason='검수 입고'",(o['id'],))
                for r in receipts:
                    held=db.execute('SELECT qty FROM stock WHERE org=? AND place=? AND lot=?',(o['buyer'],r['place'],r['lot'])).fetchone()
                    n=min(remaining,held[0] if held else 0)
                    if n:
                        move(db,o['buyer'],r['place'],r['lot'],-n,'반품',o['id'])
                        place=code('WH');db.execute('INSERT INTO place VALUES(?,?,?,?)',(place,org,'반품 격리','판매 금지'))
                        lot=code('LOT');source=first(db,'SELECT * FROM lot WHERE id=?',(r['lot'],))
                        db.execute('INSERT INTO lot VALUES(?,?,?,?,1)',(lot,source['sku'],'반품 '+source['producer_lot'],source['expires']))
                        move(db,org,place,lot,n,'반품 격리',o['id']);remaining-=n
                    if not remaining:break
                require(remaining==0,'사용·이동된 재고는 원래 입고창고로 이동한 뒤 반품하세요.')
                accepted=o['received']-c['qty']
                db.execute("UPDATE orders SET received=?,billed=?,doc=NULL,state='PARTIAL' WHERE id=?",(accepted,0 if accepted==0 else None,o['id']))
                db.execute('UPDATE order_terms SET receipt_closed=1 WHERE id=?',(o['id'],))
        db.execute('UPDATE claim SET state=?,resolution=? WHERE id=?',(decision,resolution,c['id']))
        notify(db,o['buyer'],o['id'],'변경·검수 문제 요청의 처리 결과가 등록됐습니다.')
    elif op=='budget':
        allow('BUY','FINANCE');start,end=day(d,'start'),day(d,'end');require(start<=end,'기간을 확인하세요.')
        db.execute('INSERT OR REPLACE INTO budget VALUES(?,?,?,?)',(org,start,end,num(d,'amount',0)))
    elif op in ('report','reportExcel'):
        result=report(db,org,d)
        if op=='report':return result
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Font, PatternFill
        except ImportError:
            raise ValueError('엑셀 내보내기 준비가 필요합니다. 서버의 tools/business/requirements.txt를 설치하세요.') from None
        workbook=Workbook()
        for index,(title,records) in enumerate((('기간 합계',result['집계']),('거래처 상품별',result['거래처·상품별']),('거래 상세',result['내역']),('기간 예산',[result['예산']]))):
            sheet=workbook.active if index==0 else workbook.create_sheet()
            sheet.title=title
            columns=list(records[0]) if records else ['조회 결과']
            sheet.append(columns)
            for row in records:
                sheet.append([row.get(k) for k in columns])
            for cell in sheet[1]:
                cell.font=Font(bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='146D51')
            for row in sheet.iter_rows(min_row=2):
                for cell in row:
                    if isinstance(cell.value,str):cell.data_type='s'
                    elif isinstance(cell.value,(int,float)):cell.number_format='#,##0'
            sheet.freeze_panes='A2';sheet.auto_filter.ref=sheet.dimensions
            for column in sheet.columns:
                letter=column[0].column_letter
                sheet.column_dimensions[letter].width=min(45,max(14,max(len(str(c.value or '')) for c in column)*1.6))
        output=io.BytesIO();workbook.save(output)
        return {'content':base64.b64encode(output.getvalue()).decode(),'filename':'SmartNF_거래실적_'+d['start']+'_'+d['end']+'.xlsx'}
    else:
        return None
    return {'처리':'완료'}


def report(db,org,d):
    start,end=day(d,'start'),day(d,'end');require(start<=end,'조회 기간을 확인하세요.')
    side=d.get('side','ALL');require(side in ('BUY','SELL','ALL'),'조회 구분을 확인하세요.')
    items=[]
    for o in orders(db,org):
        if not start<=o['created'][:10]<=end:continue
        direction='BUY' if o['buyer']==org else 'SELL'
        partner=o['seller'] if direction=='BUY' else o['buyer']
        if side!='ALL' and direction!=side:continue
        if d.get('partner') and d['partner']!=partner:continue
        if d.get('sku') and d['sku']!=o['sku']:continue
        cancelled=o['state']=='CANCELLED'
        gross=o['qty']*o['price']//o['pack']+o['shipping']
        checked=(o['received']*o['price']+o['pack']//2)//o['pack']+(o['shipping'] if o['received'] else 0)
        ledger=rows(db,'SELECT kind,amount FROM ledger WHERE ord=?',(o['id'],))
        settled=sum(r['amount'] for r in ledger if r['kind'] in ('모의 지급','중개 수수료'))
        items.append({'주문번호':o['id'],'구분':'구매' if direction=='BUY' else '판매','등록일':o['created'][:10],
            '거래처':o['sellerName'] if direction=='BUY' else o['buyerName'],'상품':o['name'],'거래처번호':partner,'상품번호':o['sku'],
            '주문수량':o['qty'],'검수수량':o['received'],'단위':o['unit'],'상태':o['state'],
            '주문금액':0 if cancelled else gross,'검수금액':0 if cancelled else checked,'정산금액':settled,
            'PG정산예정금액':sum(r['amount'] for r in ledger if r['kind']=='PG 정산 예정'),
            '수수료':sum(r['amount'] for r in ledger if r['kind'] in ('중개 수수료','PG 테스트 수수료')),
            '순결제금액':sum(r['amount'] for r in ledger if r['kind'] in ('모의 결제','모의 환불','부족분 모의 환불','PG 테스트 결제','PG 테스트 환불'))})
    summaries=[]
    for label in ('구매','판매'):
        subset=[i for i in items if i['구분']==label]
        summaries.append({'구분':label,'주문건수':len(subset),'취소건수':sum(i['상태']=='CANCELLED' for i in subset),
            **{k:sum(i[k] for i in subset) for k in ('주문금액','검수금액','정산금액','PG정산예정금액','수수료','순결제금액')}})
    period_spent=sum((o['received']*o['price']+o['pack']//2)//o['pack']+(o['shipping'] if o['received'] else 0)
        for o in orders(db,org) if o['buyer']==org and start<=o['created'][:10]<=end and o['state']!='CANCELLED')
    b=db.execute('SELECT amount FROM budget WHERE org=? AND start=? AND end=?',(org,start,end)).fetchone()
    budget_result={'기간 시작':start,'기간 종료':end,'기간 예산':b[0] if b else None,
        '전체 검수 기준 구매지출':period_spent,'조회 조건 검수금액':summaries[0]['검수금액'],'예산 잔액':b[0]-period_spent if b else None}
    grouped={}
    for item in items:
        key=(item['구분'],item['거래처번호'],item['상품번호'])
        if key not in grouped:
            grouped[key]={'구분':key[0],'거래처':item['거래처'],'상품':item['상품'],'거래처번호':key[1],'상품번호':key[2],'주문건수':0,'주문금액':0,'검수금액':0,'정산금액':0}
        grouped[key]['주문건수']+=1
        for amount in ('주문금액','검수금액','정산금액'):
            grouped[key][amount]+=item[amount]
    output=io.StringIO();writer=csv.writer(output)
    headers=list(items[0]) if items else ['주문번호','구분','등록일','거래처','상품','주문금액','검수금액','정산금액']
    writer.writerow(headers)
    for item in items:
        writer.writerow(["'"+str(item[k]) if isinstance(item[k],str) and item[k].lstrip().startswith(('=','+','-','@')) else item[k] for k in headers])
    return {'집계':summaries,'거래처·상품별':list(grouped.values()),'예산':budget_result,'내역':items,'csv':'\ufeff'+output.getvalue(),
        '기준':'주문 등록일 기준 기간 집계 · 가격·규격·배송비는 주문 당시 값 · PG는 테스트 결제이며 공급자 정산 예정액·회계 이익은 별도'}
