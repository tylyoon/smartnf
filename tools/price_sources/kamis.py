"""KAMIS official retail survey importer. Requires the operator's issued credentials."""
import argparse,datetime as dt,decimal,hashlib,json,os,pathlib,re,sys,urllib.parse
from champrice import request, atomic_write
DOC='https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=1'

def normalize(payload,requested):
    data=payload.get('data',{})
    if not isinstance(data,dict) or str(data.get('error_code'))!='000': raise ValueError('KAMIS 인증·데이터 응답 확인 실패')
    # Source must echo the requested retail channel; never silently accept wholesale defaults.
    condition=payload.get('condition',[])
    if isinstance(condition,dict): condition=[condition]
    echoed=[str(c.get(k,'')) for c in condition if isinstance(c,dict) for k in ('p_product_cls_code','p_productclscode','product_cls_code') if k in c]
    if not echoed or any(v!='01' for v in echoed): raise ValueError('KAMIS 소매 구분을 검증할 수 없어 반영하지 않습니다')
    items=data.get('item',[])
    if isinstance(items,dict):items=[items]
    out=[]
    for r in items:
        value=str(r.get('dpr1','')).replace(',','').strip()
        if not re.fullmatch(r'\d+(?:\.\d+)?',value):continue
        price=decimal.Decimal(value)
        if price<=0 or price>100_000_000:continue
        stamp=str(r.get('day1','')).strip()
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}',stamp):day=dt.date.fromisoformat(stamp)
        elif re.fullmatch(r'\d{2}/\d{2}',stamp):
            day=dt.date.fromisoformat(str(requested.year)+'-'+stamp.replace('/','-'))
            if day>requested:day=day.replace(year=day.year-1)
        else:raise ValueError('KAMIS 실제 조사일 형식 확인 필요')
        if day>requested or (requested-day).days>14:raise ValueError('KAMIS 조사일 범위 확인 필요')
        item=str(r.get('item_name','')).strip();unit=str(r.get('unit','')).strip()
        kind=str(r.get('kind_name','')).strip();rank=str(r.get('rank','')).strip()
        if not item or not unit:raise ValueError('KAMIS 품목·조사단위 없음')
        name=f'{item}({unit}) · {kind} · {rank} · 전국 소매'
        if any(c in name for c in '\t\r\n'):raise ValueError('KAMIS 문자열 형식 변경')
        out.append((name,day.isoformat(),str(price),str(price),str(price),'1'))
    return out

def main():
    # Prefer the portal only when its own credential is configured; keys are not interchangeable.
    from at_portal import KEY, main as portal_main
    env=pathlib.Path('.env.local')
    configured=bool(os.getenv(KEY)) or (env.is_file() and any(line.strip().removeprefix('export ').startswith(KEY+'=') for line in env.read_text(encoding='utf-8-sig').splitlines()))
    if configured and '--json' not in sys.argv:
        portal_main();return
    p=argparse.ArgumentParser();p.add_argument('--refresh',action='store_true');p.add_argument('--json',nargs='+');p.add_argument('--day',default=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat());p.add_argument('--output',default='data/price-reference/kamis.tsv');a=p.parse_args();day=dt.date.fromisoformat(a.day)
    try:
        if a.json:raws=[pathlib.Path(f).read_bytes() for f in a.json]
        else:
            key=os.getenv('SMARTNF_KAMIS_CERT_KEY','');identity=os.getenv('SMARTNF_KAMIS_CERT_ID','')
            if not key or not identity:
                print('KAMIS 인증정보 없음: 참가격·기존 KAMIS 자료 유지');return
            raws=[]
            for category in ('100','200','300','400','500','600'):
                query=urllib.parse.urlencode({'action':'dailyPriceByCategoryList','p_cert_key':key,'p_cert_id':identity,'p_returntype':'json','p_product_cls_code':'01','p_item_category_code':category,'p_country_code':'','p_regday':day.isoformat(),'p_convert_kg_yn':'N'})
                raws.append(request('https://www.kamis.or.kr/service/price/xml.do?'+query,limit=3_000_000))
        rows=[row for raw in raws for row in normalize(json.loads(raw),day)]
        if not rows:raise ValueError('KAMIS 유효한 소매가격 없음')
        lines=['#SmartNF-ChamPrice-v1','#updatedAt\t'+dt.datetime.now(dt.timezone.utc).isoformat(),'#source\t'+DOC,'#sha256\t'+hashlib.sha256(b''.join(raws)).hexdigest(),'name\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount']
        lines+=['\t'.join(r) for r in sorted(set(rows))];atomic_write(a.output,('\n'.join(lines)+'\n').encode());print('KAMIS 소매 조사 자료 반영 완료')
    except Exception:
        # Never print a request URI/exception that may contain a credential.
        print('KAMIS 수집·검증 실패: 인증·응답 형식을 확인하세요. 기존 자료 유지',file=sys.stderr);sys.exit(1)

if __name__=='__main__':main()
