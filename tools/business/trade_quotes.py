"""Versioned supplier quotes and buyer price negotiations."""
from trade_common import code, require, field, num, day, first, rows
from datetime import date

SCHEMA = """
CREATE TABLE IF NOT EXISTS quote_meta(quote TEXT PRIMARY KEY,version INTEGER,state TEXT,supersedes TEXT);
CREATE TABLE IF NOT EXISTS price_request(id TEXT PRIMARY KEY,quote TEXT,buyer TEXT,price INTEGER,reason TEXT,state TEXT,response TEXT,created TEXT);
"""


def migrate(db):
    db.execute("INSERT OR IGNORE INTO quote_meta SELECT id,1,'ACTIVE','' FROM offer")
    # Earlier versions could leave multiple proposals on one request.
    db.execute("""UPDATE quote_meta SET state='SUPERSEDED' WHERE state='ACTIVE' AND quote IN(
        SELECT r.offer FROM offer_request r JOIN offer o ON o.id=r.offer
        WHERE r.ord IS NULL AND o.rowid < (
            SELECT max(o2.rowid) FROM offer_request r2 JOIN offer o2 ON o2.id=r2.offer WHERE r2.rfq=r.rfq))""")


def activate(db, quote, old=None):
    version=1
    if old:
        version=first(db,'SELECT version FROM quote_meta WHERE quote=?',(old,))[0]+1
        db.execute("UPDATE quote_meta SET state='SUPERSEDED' WHERE quote=?",(old,))
        db.execute("UPDATE price_request SET state='RESPONDED',response=? WHERE quote=? AND state='REQUESTED'",(quote,old))
    db.execute("INSERT OR REPLACE INTO quote_meta VALUES(?,?,'ACTIVE',?)",(quote,version,old or ''))


def quote_rows(db,org):
    return rows(db,'''SELECT o.*,r.rfq,r.ord,m.version,m.state quoteState,m.supersedes,s.name,
        b.name buyerName,v.name sellerName,s.pack,s.unit FROM offer o
        JOIN quote_meta m ON m.quote=o.id JOIN sku s ON s.id=o.sku
        JOIN org b ON b.id=o.buyer JOIN org v ON v.id=o.seller
        LEFT JOIN offer_request r ON r.offer=o.id
        WHERE o.buyer=? OR o.seller=? ORDER BY o.rowid DESC''',(org,org))


def operation(db,org,role,op,d,notify,now):
    if op not in ('priceRequest','reviseQuote','rejectPrice'):
        return None
    required='BUY' if op=='priceRequest' else 'SELL'
    require(role in ('ADMIN',required),'담당자 권한을 확인하세요.')
    if op=='rejectPrice':
        request=first(db,"SELECT p.* FROM price_request p JOIN offer o ON o.id=p.quote WHERE p.id=? AND o.seller=? AND p.state='REQUESTED'",(field(d,'id'),org))
        db.execute("UPDATE price_request SET state='REJECTED',response=? WHERE id=?",(field(d,'reason'),request['id']))
        notify(db,request['buyer'],request['quote'],'희망단가 요청의 회신이 도착했습니다.')
        return {'처리':'완료'}
    quote=first(db,"SELECT o.* FROM offer o JOIN quote_meta m ON m.quote=o.id WHERE o.id=? AND m.state='ACTIVE'",(field(d,'quote'),))
    require(quote['buyer' if required=='BUY' else 'seller']==org,'견적 당사자를 확인하세요.')
    link=db.execute('SELECT * FROM offer_request WHERE offer=?',(quote['id'],)).fetchone()
    if link:
        first(db,"SELECT id FROM rfq WHERE id=? AND state='OPEN'",(link['rfq'],))
    if op=='priceRequest':
        require(quote['until_day']>=date.today().isoformat(),'유효기간이 지난 견적입니다.')
        require(not db.execute("SELECT 1 FROM price_request WHERE quote=? AND state='REQUESTED'",(quote['id'],)).fetchone(),'기존 희망단가 요청의 회신을 확인하세요.')
        key=code('NEG')
        db.execute("INSERT INTO price_request VALUES(?,?,?,?,?,'REQUESTED','',?)",(key,quote['id'],org,num(d,'price'),field(d,'reason'),now()))
        notify(db,quote['seller'],quote['id'],'구매자의 희망단가 요청이 도착했습니다.')
        return {'id':key}
    until=day(d,'until')
    require(until>=date.today().isoformat(),'견적 유효일을 확인하세요.')
    key=code('Q')
    db.execute('INSERT INTO offer VALUES(?,?,?,?,?,?)',(key,org,quote['buyer'],quote['sku'],num(d,'price'),until))
    if link:db.execute('INSERT INTO offer_request(offer,rfq) VALUES(?,?)',(key,link['rfq']))
    activate(db,key,quote['id'])
    notify(db,quote['buyer'],key,'변경된 견적이 도착했습니다. 새 단가와 유효일을 확인하세요.')
    return {'id':key,'이전 견적':quote['id'],'견적 버전':first(db,'SELECT version FROM quote_meta WHERE quote=?',(key,))[0]}
