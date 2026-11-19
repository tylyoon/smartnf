"""On-demand public search-page adapters. Standard library only; no login or block bypass.
Transient candidates, never survey reference prices. Prices can change at checkout.
"""
import argparse, datetime, html, json, re, sys, urllib.error, urllib.parse, urllib.request
from html.parser import HTMLParser

SOURCES = {
    'DANAWA': 'https://search.danawa.com/dsearch.php?query=',
    'ENURI': 'https://price.enuri.com/search?keyword=',
    'OASIS': 'https://www.oasis.co.kr/product/search?keyword=',
    'EMART': 'https://emart.ssg.com/search.ssg?query=',
    'LOTTE': 'https://lottemartzetta.com/search?q=',
    'HOMEPLUS': 'https://mfront.homeplus.co.kr/totalsearch/total/search.json?keyword=',
}
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c, Node): yield from c.walk()
    def text(self):
        return ''.join(c.text() if isinstance(c, Node) else c for c in self.children)
    def hasclass(self, cls): return cls in self.attrs.get('class','').split()
class Tree(HTMLParser):
    def __init__(self, raw):
        super().__init__(convert_charrefs=True); self.root=Node(); self.stack=[self.root]; self.feed(raw)
    def handle_starttag(self, tag, attrs):
        n=Node(tag,attrs,self.stack[-1]); self.stack[-1].children.append(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID:self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag: del self.stack[i:]; break
    def handle_data(self, data): self.stack[-1].children.append(data)
def clean(s): return ' '.join(html.unescape(str(s)).split())
def price(s):
    s=str(s).replace(',','').strip()
    if not s.isdigit() or not 0<int(s)<=100_000_000: raise ValueError('invalid price')
    return int(s)
def allowed(provider,url):
    try:
        p=urllib.parse.urlsplit(url)
        if p.scheme!='https' or p.username or p.password or p.port not in (None,443) or p.fragment:return False
        q=urllib.parse.parse_qs(p.query)
        return ((provider=='DANAWA' and p.hostname=='prod.danawa.com' and p.path=='/info/' and q.get('pcode',[''])[0].isdigit()) or
                (provider=='ENURI' and p.hostname=='www.enuri.com' and p.path=='/detail.jsp' and q.get('modelno',[''])[0].isdigit()) or
                (provider=='HOMEPLUS' and p.hostname=='mfront.homeplus.co.kr' and p.path=='/item' and q.get('itemNo',[''])[0].isdigit() and q.get('storeType',[''])[0] in ('HYPER','EXPRESS')) or
                (provider=='EMART' and p.hostname=='emart.ssg.com' and p.path=='/item/itemView.ssg' and q.get('itemId',[''])[0].isdigit()) or
                (provider=='LOTTE' and p.hostname=='lottemartzetta.com' and re.fullmatch(r'/products/[A-Za-z0-9]+/details',p.path) is not None) or
                (provider=='OASIS' and p.hostname=='www.oasis.co.kr' and re.fullmatch(r'/product/detail/\d+',p.path) is not None))
    except (ValueError,TypeError): return False
def candidate(provider,id,name,value,url,conditions):
    name=clean(name)
    if not name or len(name)>300 or not allowed(provider,url): raise ValueError('invalid product')
    return dict(provider=provider,id=str(id),name=name,price=price(value),url=url,merchant={'DANAWA':'다나와 비교 판매처','ENURI':'에누리 비교 판매처','OASIS':'오아시스마켓','EMART':'이마트몰','LOTTE':'롯데마트 제타','HOMEPLUS':'홈플러스'}[provider],delivery='미확인 · 배송지·합배송·무료배송 기준을 판매처에서 확인',conditions=conditions)
def parse(provider,raw):
    out=[]
    if provider=='HOMEPLUS':
        try:data=json.loads(raw)
        except (ValueError,TypeError):raise ValueError('SOURCE_INVALID_RESPONSE') from None
        if not isinstance(data,dict):raise ValueError('SOURCE_INVALID_RESPONSE')
        if data.get('returnStatus')!=200:raise ValueError('SOURCE_STATUS_ERROR')
        payload=data.get('data')
        if payload is None:raise ValueError('SOURCE_EMPTY_DATA')
        if not isinstance(payload,dict):raise ValueError('SOURCE_INVALID_RESPONSE')
        rows=payload.get('dataList')
        if rows is None:raise ValueError('SOURCE_EMPTY_DATA')
        if not isinstance(rows,list):raise ValueError('SOURCE_INVALID_RESPONSE')
        now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
        for p in rows:
            if not isinstance(p,dict):continue
            if p.get('soldOutYn')!='N' or p.get('itemSoldOutYn')!='N' or p.get('docDispYn')!='Y':continue
            event=p.get('eventInfo')
            if event is not None and not isinstance(event,dict):continue
            end=(event or {}).get('eventEndDt') or ''
            general=p.get('dcType')=='ITEM_DISCOUNT_PRICE' and (not end or end[:19]>=now)
            value=p.get('dcPrice') if general else p.get('salePrice')
            cond='배송지 미설정 조회 점포번호 '+str(p.get('storeId','미확인'))+' · '+('일반 상품할인 표시가' if general else '기본 판매 표시가 · 카드/쿠폰할인 미적용')+' · '+clean(' / '.join(p.get('deliveryLabelList') or []))+' · 행사종료 '+str(end or '미확인')+' · 점포·배송지·옵션 확인 필요'
            url='https://mfront.homeplus.co.kr/item?'+urllib.parse.urlencode({'itemNo':str(p.get('itemNo','')),'storeType':p.get('storeType','')})
            try:out.append(candidate(provider,p.get('itemNo',''),p.get('itemNm',''),value,url,cond))
            except ValueError:continue
        return list({p['url']:p for p in out}.values())[:100]
    tree=Tree(raw).root
    if provider=='ENURI':
        for n in tree.walk():
            if n.tag!='script' or n.attrs.get('type')!='application/ld+json':continue
            try: data=json.loads(n.text())
            except (ValueError,TypeError):continue
            if not isinstance(data,dict):continue
            for row in data.get('itemListElement',[]):
                p=row.get('item',{}); offer=p.get('offers',{})
                if not isinstance(offer,dict) or offer.get('priceCurrency')!='KRW' or 'InStock' not in str(offer.get('availability','')):continue
                until=offer.get('priceValidUntil','')
                if until and until<datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat():continue
                try:out.append(candidate(provider,p.get('sku',''),p.get('name',''),offer.get('lowPrice',offer.get('price','')),p.get('url',''),'비교 최저 표시가 · 판매처·쿠폰·옵션·배송비 확인 필요'))
                except ValueError:continue
    elif provider=='OASIS':
        for card in tree.walk():
            if not card.hasclass('wrapInfo'):continue
            ancestor=card
            while ancestor.parent and not ancestor.hasclass('wrapBox'):ancestor=ancestor.parent
            if any(n.hasclass('img_soldOut') for n in ancestor.walk()):continue
            link=next((n for n in card.walk() if n.tag=='a' and n.hasclass('listTit')),None)
            amount=next((n for n in card.walk() if n.hasclass('price_discount')),None)
            if link is None or amount is None:continue
            # Normal sale price only; never substitute coupon or 100g unit price.
            value=next((n.text() for n in amount.walk() if n.tag=='b'),'')
            url=urllib.parse.urljoin('https://www.oasis.co.kr',link.attrs.get('href',''))
            detail=next((n.text() for n in card.walk() if n.hasclass('info_cpPrice')),'')
            try:out.append(candidate(provider,urllib.parse.urlsplit(url).path.split('/')[-1],link.text(),value,url,'일반 판매 표시가 · '+clean(detail)+' · 쿠폰 자격·상품 옵션·배송지 확인 필요'))
            except ValueError:continue
    elif provider in ('EMART','LOTTE'):
        def objects(data):
            if isinstance(data,dict):
                yield data
                for v in data.values():yield from objects(v)
            elif isinstance(data,list):
                for v in data:yield from objects(v)
        for n in tree.walk():
            if n.tag!='script':continue
            raw=n.text()
            try:
                if provider=='EMART' and n.attrs.get('id')=='__NEXT_DATA__':data=json.loads(raw)
                elif provider=='LOTTE' and raw.startswith('window.__INITIAL_STATE__='):data=json.JSONDecoder().raw_decode(raw[len('window.__INITIAL_STATE__='):])[0]
                else:continue
            except (ValueError,TypeError):continue
            for p in objects(data):
                try:
                    if provider=='EMART':
                        if not all(k in p for k in ('itemName','itemId','itemUrl','priceInfo')):continue
                        info=p['priceInfo']
                        if p.get('soldOutMessage') or info.get('isVisiblePrice') is not True:continue
                        value=info.get('rawPrimaryPrice','')
                        cond='배송지 미설정 조회 매장번호 '+str(p.get('salestrNo','미확인'))+' · '+clean(info.get('primaryPriceA11y','표시가격'))+' · '+clean(info.get('couponText',''))+' · '+clean(' / '.join(x.get('text','') for x in p.get('shippingCostInfo',[])))+' · 배송지·옵션·카드조건 확인 필요'
                        out.append(candidate(provider,p['itemId'],p['itemName'],value,p['itemUrl'],cond))
                    else:
                        if not all(k in p for k in ('retailerProductId','name','price','available')) or p['available'] is not True:continue
                        offer=p['price'].get('current',{})
                        if offer.get('currency')!='KRW':continue
                        url='https://lottemartzetta.com/products/'+p['retailerProductId']+'/details'
                        cond='배송지 미설정 기본 점포 기준 일반 판매 표시가 · '+clean(' / '.join(x.get('description','') for x in p.get('offers',[])))+' · 상품명 할인 안내와 현재가는 다를 수 있음 · 실제 배송지·쿠폰·할인조건 확인 필요'
                        out.append(candidate(provider,p['retailerProductId'],p['name'],offer.get('amount',''),url,cond))
                except (ValueError,TypeError,KeyError):continue
    elif provider=='DANAWA':
        # Bind displayed pack price to its own product link, not a neighboring unit price/ad.
        for link in tree.walk():
            if link.tag!='a':continue
            url=link.attrs.get('href','')
            if not allowed(provider,url):continue
            values=[n for n in link.walk() if n.tag=='span' and n.hasclass('text-px16') and re.fullmatch(r'[\d,]+원',clean(n.text()))]
            if len(values)!=1:continue
            id=urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)['pcode'][0]
            card=link
            while card.parent and not (card.tag=='div' and card.hasclass('py-6')):card=card.parent
            names=[n for n in card.walk() if n.tag=='a' and n.attrs.get('href')==url and n.hasclass('font-bold') and not any(c.tag=='span' for c in n.walk() if c is not n)]
            if not names:continue
            try:out.append(candidate(provider,id,names[0].text(),clean(values[0].text())[:-1],url,'가격비교 최저 표시가 · 판매처·카드·쿠폰·배송 조건 확인 필요'))
            except ValueError:continue
    seen=set(); unique=[]
    for p in out:
        if p['id'] and p['id'] not in seen: unique.append(p);seen.add(p['id'])
    return unique[:100]
class Redirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        # Search-page redirects only, no arbitrary location fetches.
        p=urllib.parse.urlsplit(newurl)
        if p.scheme!='https' or p.hostname not in {'search.danawa.com','www.enuri.com','price.enuri.com','www.oasis.co.kr','emart.ssg.com','lottemartzetta.com','mfront.homeplus.co.kr'}:raise ValueError('unexpected redirect')
        return super().redirect_request(req,fp,code,msg,headers,newurl)
def search(provider,query):
    if provider not in SOURCES or not 1<=len(query.strip())<=100 or any(ord(c)<32 for c in query):raise ValueError('invalid query')
    req=urllib.request.Request(SOURCES[provider]+urllib.parse.quote(query.strip()),headers={'User-Agent':'SmartNF-ProductLookup/1.0','Accept':'application/json' if provider=='HOMEPLUS' else 'text/html'})
    with urllib.request.build_opener(Redirects()).open(req,timeout=18) as r:
        if r.status!=200:raise ValueError('http status')
        raw=r.read(3_000_001)
        if len(raw)>3_000_000:raise ValueError('response size')
        charset=r.headers.get_content_charset() or 'utf-8'
    products=parse(provider,raw.decode(charset,errors='replace'))
    for product in products:product['sourceVerified']=provider in ('HOMEPLUS','OASIS','LOTTE')
    return products
def main():
    a=argparse.ArgumentParser();a.add_argument('provider',choices=SOURCES);a.add_argument('query');a.add_argument('--check',action='store_true');args=a.parse_args()
    try:
        products=search(args.provider,args.query)
        if not products:print('가격이 포함된 상품 응답을 확인하지 못했습니다.',file=sys.stderr);return 5
        if args.check:
            print(json.dumps({'provider':args.provider,'count':len(products),'sample':[{k:p[k] for k in ('name','price','url')} for p in products[:2]]},ensure_ascii=False));return 0
        now=datetime.datetime.now(datetime.timezone.utc).isoformat()
        for p in products:
            fields=[p['id'],p['name'],p['merchant'],str(p['price']),p['url'],p['delivery'],now,p['conditions']]
            print('\t'.join(urllib.parse.quote(v,safe='') for v in fields))
        return 0
    except urllib.error.HTTPError as e:
        print('접근 제한 HTTP '+str(e.code)+' · 자동 재시도하지 않습니다.',file=sys.stderr);return 4
    except Exception:
        print('판매처 연결·응답 확인 실패',file=sys.stderr);return 4
if __name__=='__main__':sys.exit(main())
