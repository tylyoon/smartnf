"""Shared validation and inventory movement for business transactions."""
import uuid
from datetime import date

def code(prefix):
    return prefix+'-'+uuid.uuid4().hex[:16].upper()


def require(condition, message):
    if not condition:
        raise ValueError(message)


FIELD_NAMES = {
    'org':'소속 업체','name':'이름','qty':'수량','pack':'포장당 수량','packs':'포장 수','price':'가격',
    'confirmedOrg':'삭제할 업체 관리번호','sku':'상품','id':'대상 번호','place':'창고','role':'직무',
    'member':'회원 번호','shipping':'배송비','min_packs':'최소 주문 포장 수','lead_days':'납품 준비 기간',
    'start':'시작일','end':'종료일','delivery':'희망 납기','expires':'소비기한','deadline':'마감일'
}


def num(d,k,lo=1,hi=10**8):
    try:
        n=int(str(d[k]))
    except (KeyError,ValueError,TypeError):
        raise ValueError(FIELD_NAMES.get(k,k)+'에 정수를 입력하세요.') from None
    require(lo<=n<=hi,FIELD_NAMES.get(k,k)+' 범위를 확인하세요.')
    return n


def field(d,k):
    v=str(d.get(k,'')).strip()
    require(0<len(v)<=200,FIELD_NAMES.get(k,k)+' 값을 확인하세요.')
    return v


def day(d,k):
    try:
        return date.fromisoformat(field(d,k)).isoformat()
    except ValueError:
        raise ValueError(FIELD_NAMES.get(k,k)+'을 YYYY-MM-DD 형식으로 입력하세요.') from None


def first(db, sql, args):
    r=db.execute(sql,args).fetchone()
    require(r is not None,'자료 또는 접근 권한을 확인하세요.')
    return r


def rows(db,sql,args=()):
    return [dict(r) for r in db.execute(sql,args)]


def move(db,org,place,lot,qty,reason,ref):
    first(db,'SELECT id FROM place WHERE org=? AND id=?',(org,place))
    db.execute('INSERT OR IGNORE INTO stock VALUES(?,?,?,0)',(org,place,lot))
    updated=db.execute('UPDATE stock SET qty=qty+? WHERE org=? AND place=? AND lot=? AND qty+?>=0',(qty,org,place,lot,qty))
    require(updated.rowcount==1,'가용 재고가 부족합니다.')
    db.execute('INSERT INTO movement VALUES(?,?,?,?,?,?,?,?)',(code('IN' if qty>0 else 'OUT'),org,place,lot,qty,reason,ref,date.today().isoformat()))


