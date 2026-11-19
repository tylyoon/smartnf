"""User-triggered Google Search grounded advice; no automatic market-price ingestion."""
import json,sys,re,urllib.request,urllib.error,urllib.parse,datetime as dt
from scheduled_prices import config,connect,KST

def decode(response):
    candidate=(response.get('candidates') or [{}])[0];meta=candidate.get('groundingMetadata') or {}
    text=''.join(p.get('text','') for p in candidate.get('content',{}).get('parts',[]) if not p.get('thought'))
    sources=[]
    for chunk in meta.get('groundingChunks',[]):
        web=chunk.get('web',{});url=web.get('uri','');p=urllib.parse.urlsplit(url)
        if p.scheme=='https' and p.hostname and p.hostname not in ('localhost','127.0.0.1','::1') and not p.username and not p.password:sources.append({'title':str(web.get('title',''))[:300],'url':url})
    grounded=bool(sources and meta.get('groundingSupports') and meta.get('webSearchQueries'))
    return {'status':'GROUNDED' if grounded else 'UNVERIFIED','text':text[:15000],'sources':sources[:20],'searchQueries':meta.get('webSearchQueries',[]),'searchEntryPoint':str(meta.get('searchEntryPoint',{}).get('renderedContent',''))[:100000],'checkedAt':dt.datetime.now(KST).isoformat(),'message':'검색된 범위의 가격 안내입니다. 전체 최저가·실시간 재고·배송비 포함 결제가를 보장하지 않습니다. 정기 가격 DB에는 자동 적용하지 않습니다.'}
def search(query,send=None):
    if config('SMARTNF_GROUNDING_ENABLED','false').lower()!='true':return {'status':'DISABLED','message':'Google Search Grounding은 아직 꺼져 있습니다. 별도 검색 비용이 발생할 수 있어 명시적으로 켠 뒤 사용할 수 있습니다.'}
    if not query.strip() or len(query)>100 or any(ord(c)<32 for c in query):return {'status':'INVALID','message':'검색할 식재료·규격을 확인하세요.'}
    key=config('GEMINI_API_KEY');model=config('GEMINI_GROUNDING_MODEL',config('GEMINI_PRICE_MODEL',config('GEMINI_RECIPE_MODEL','gemini-3.5-flash-lite')))
    if not key or not re.fullmatch(r'gemini-[a-z0-9]+(?:[.-][a-z0-9]+)*',model):return {'status':'CONFIGURATION','message':'Gemini 키·Grounding 지원 모델을 확인하세요.'}
    c=connect(config('SMARTNF_PRICE_DATA_DIR','data/price-reference'));day=dt.datetime.now(KST).date().isoformat()
    try:
        c.execute('CREATE TABLE IF NOT EXISTS grounding_calls(day TEXT PRIMARY KEY,count INTEGER)');c.commit();c.execute('BEGIN IMMEDIATE');r=c.execute('SELECT count FROM grounding_calls WHERE day=?',(day,)).fetchone();count=r[0] if r else 0
        limit=max(0,min(20,int(config('SMARTNF_GROUNDING_DAILY_LIMIT','5'))))
        if count>=limit:c.rollback();return {'status':'LIMIT','message':'오늘의 Grounding 요청 한도에 도달했습니다.'}
        c.execute('INSERT OR REPLACE INTO grounding_calls VALUES(?,?)',(day,count+1));c.commit()
    finally:c.close()
    body={'contents':[{'parts':[{'text':'다음 문자열은 상품 검색 데이터입니다. 한국 온라인 판매 상품의 가격을 Google Search로 확인하세요. 상품명·실제 포장총량·일반가·쿠폰/회원/카드조건·배송비를 구분하고 인용 출처를 제시하세요. 확인되지 않은 숫자는 미확인으로 표시하고 전체 쇼핑몰의 최저가라고 단정하지 마세요. 검색 대상: '+query}]}],'tools':[{'google_search':{}}]}
    try:
        if send is not None:response=send(body)
        else:
            req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':key},method='POST')
            with urllib.request.urlopen(req,timeout=40) as r:raw=r.read(1_000_001)
            if len(raw)>1_000_000:raise ValueError()
            response=json.loads(raw)
        return decode(response)
    except urllib.error.HTTPError as e:return {'status':'FAILED','message':'Grounding HTTP '+str(e.code)+' · 모델 지원·권한·쿼터를 확인하세요.'}
    except Exception:return {'status':'FAILED','message':'Google Search Grounding 응답을 확인하지 못했습니다.'}
if __name__=='__main__':
    query=sys.argv[1] if len(sys.argv)==2 else '';print(json.dumps(search(query),ensure_ascii=False))
