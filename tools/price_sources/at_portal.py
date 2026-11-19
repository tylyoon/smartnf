"""aT data.go.kr daily retail surveys. Standard library; never logs credentials."""
import argparse, datetime as dt, decimal, hashlib, json, os, pathlib, re, statistics, sys, time, urllib.parse
from champrice import request, atomic_write
DOC='https://www.data.go.kr/data/15156057/openapi.do'
ENDPOINT='https://apis.data.go.kr/B552845/perDay/price'
KEY='SMARTNF_DATA_GO_KR_SERVICE_KEY'

def credential(env_file='.env.local'):
    value=os.environ.get(KEY,'').strip()
    if not value:
        file=pathlib.Path(env_file)
        if file.is_file():
            found=[]
            for line in file.read_text(encoding='utf-8-sig').splitlines():
                line=line.strip()
                if line.startswith('export '):line=line[7:].strip()
                if line.startswith(KEY+'='):found.append(line.split('=',1)[1].strip())
            if len(found)>1:raise ValueError('인증키 설정 중복: 하나만 남겨주세요')
            if found:value=found[0]
    if len(value)>1 and value[0]==value[-1] and value[0] in "\"'":value=value[1:-1]
    # Accept either portal key representation, encode exactly once in urlencode.
    if re.search(r'%[0-9a-fA-F]{2}',value):value=urllib.parse.unquote(value)
    if not value or any(c.isspace() for c in value):raise ValueError('공공데이터포털 인증키가 없거나 형식이 잘못되었습니다')
    return value

def unpack(payload):
    root=payload.get('response',payload)
    header=root.get('header',{})
    if str(header.get('resultCode')) not in ('00','000','0'):
        raise ValueError('공공데이터포털 응답 실패: 인증·활용승인·호출한도를 확인하세요')
    body=root.get('body',{})
    items=body.get('items') or {}
    items=items.get('item',[]) if isinstance(items,dict) else items
    if isinstance(items,dict):items=[items]
    if not isinstance(items,list):raise ValueError('공공데이터포털 항목 형식 변경')
    return items,int(body.get('totalCount',0))

def normalize(items,day):
    groups={}
    for r in items:
        if str(r.get('se_cd','')).zfill(2)!='01' or r.get('se_nm')!='소매':raise ValueError('소매 조사자료 검증 실패')
        stamp=str(r.get('exmn_ymd','')).replace('-','')
        date=dt.datetime.strptime(stamp,'%Y%m%d').date()
        if not 0<=(day-date).days<=7:raise ValueError('조사일 범위 검증 실패')
        raw=str(r.get('exmn_dd_prc','')).replace(',','').strip()
        if not re.fullmatch(r'\d+(?:\.\d+)?',raw):continue
        price=decimal.Decimal(raw)
        if not 0<price<=100_000_000:continue
        name=str(r.get('item_nm','')).strip();unit=str(r.get('unit','')).strip();size=str(r.get('unit_sz','')).strip()
        if not name or not unit:raise ValueError('품목·단위 누락')
        # The explicit kg conversion field is used only when the original unit is mass.
        # Never infer egg/ml counts as grams.
        if unit.lower() in ('kg','g','킬로그램','그램') and re.fullmatch(r'\d+(?:\.\d+)?',size):unit=size+unit
        elif size and not re.search(r'\d',unit):unit=size+unit
        variant=' · '.join(str(r.get(k,'')).strip() for k in ('vrty_nm','grd_nm'))
        label=f'{name}({unit}) · {variant} · 전국 소매 조사 중앙값'
        if len(label)>300 or any(c in label for c in '\t\r\n'):raise ValueError('품목 문자열 검증 실패')
        market=(str(r.get('sgg_cd','')),str(r.get('mrkt_cd','')))
        if not all(market):raise ValueError('조사 시장 식별값 누락')
        # Codes keep separate varieties/grades from silently merging.
        key=(str(r.get('item_cd','')),str(r.get('vrty_cd','')),str(r.get('grd_cd','')),label)
        if key not in groups or date>groups[key][0]:groups[key]=(date,{})
        if date==groups[key][0]:
            old=groups[key][1].get(market)
            if old is not None and old!=price:raise ValueError('동일 시장·조사일 가격 충돌')
            groups[key][1][market]=price
    rows=[]
    for key,(date,markets) in groups.items():
        values=list(markets.values())
        rows.append((key[-1],date.isoformat(),str(statistics.median(values)),str(min(values)),str(max(values)),str(len(values))))
    return sorted(rows)

def collect(key,day,pairs,fetch=request):
    all_items=[];digest=hashlib.sha256();started=time.monotonic()
    for category,item in pairs:
        for page in range(1,31):
            if time.monotonic()-started>780:raise ValueError('전체 수집 제한시간 초과: 기존 자료 유지')
            params={'serviceKey':key,'returnType':'JSON','pageNo':page,'numOfRows':1000,
             'cond[exmn_ymd::LTE]':day.strftime('%Y%m%d'),'cond[exmn_ymd::GTE]':(day-dt.timedelta(days=7)).strftime('%Y%m%d'),
             'cond[se_cd::EQ]':'01','cond[ctgry_cd::EQ]':category,'cond[item_cd::EQ]':item}
            raw=fetch(ENDPOINT+'?'+urllib.parse.urlencode(params),limit=6_000_000)
            digest.update(raw);items,total=unpack(json.loads(raw))
            if any(str(r.get('ctgry_cd'))!=category or str(r.get('item_cd'))!=item for r in items):raise ValueError('요청 품목과 응답 품목 불일치')
            all_items.extend(items)
            if page*1000>=total:break
            if not items:raise ValueError('페이지 누락')
        else:raise ValueError('페이지 제한 초과')
    rows=normalize(all_items,day)
    if not rows:raise ValueError('유효한 소매 조사자료 없음: 기존 자료 유지')
    lines=['#SmartNF-ChamPrice-v1','#updatedAt\t'+dt.datetime.now(dt.timezone.utc).isoformat(),'#source\t'+DOC,'#sha256\t'+digest.hexdigest(),'name\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount']
    return ('\n'.join(lines+['\t'.join(r) for r in rows])+'\n').encode(),len(rows)

def setup_launcher(path='run_local.sh'):
    file=pathlib.Path(path)
    if not file.exists():return 'run_local.sh 없음: 수정하지 않았습니다'
    raw=file.read_bytes();text=raw.decode('utf-8-sig');marker=KEY+'=*)'
    if marker in text:return '실행 스크립트 설정 이미 반영됨'
    # Older allowlist loader rejects unknown entries. Only patch its exact known case.
    if '지원하지 않는 설정 줄' in text:
        needle='        DB_URL=*)'
        if needle not in text or 'case "$task_line" in' not in text:raise ValueError('실행 스크립트 형식 확인 필요: 자동 변경 중단')
        backup=pathlib.Path(str(file)+'.before-at-portal')
        if backup.exists():raise ValueError('실행 스크립트 백업이 이미 있어 자동 변경 중단')
        backup.write_bytes(raw)
        newline='\r\n' if '\r\n' in text else '\n'
        text=text.replace(needle,'        '+marker+' ;;'+newline+needle,1)
        file.write_bytes(text.encode('utf-8'));return '실행 스크립트 허용 항목 추가 완료 (원본 .before-at-portal 백업)'
    return '별도 허용목록이 없어 실행 스크립트를 변경하지 않았습니다'

def main():
    p=argparse.ArgumentParser();p.add_argument('--refresh',action='store_true');p.add_argument('--setup',action='store_true');p.add_argument('--check',action='store_true');p.add_argument('--output',default='data/price-reference/kamis.tsv');p.add_argument('--env-file',default='.env.local');a=p.parse_args()
    try:
        if a.setup:print(setup_launcher())
        if a.check:credential(a.env_file);print('공공데이터포털 인증키 설정 확인 완료 (키 값 비표시)')
        if a.refresh:
            pairs=[tuple(line.split('\t')[:2]) for line in pathlib.Path(__file__).with_name('at_items.tsv').read_text(encoding='utf8').splitlines() if line and not line.startswith('#')]
            day=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date()
            body,count=collect(credential(a.env_file),day,pairs)
            target=pathlib.Path(a.output)
            if target.exists():
                def latest(b):return max(line.split('\t')[1] for line in b.decode().splitlines()[5:] if line)
                if latest(body)<latest(target.read_bytes()):raise ValueError('이전 조사일 자료로 교체하지 않습니다')
            atomic_write(target,body);print(f'공공데이터포털 소매 조사가격 반영 완료: {count}개 규격')
        if not (a.refresh or a.setup or a.check):p.error('--setup, --check 또는 --refresh를 지정하세요')
    except ValueError as e:print(str(e),file=sys.stderr);sys.exit(1)
    except Exception:
        # Transport errors can contain key-bearing URLs. Never print the exception.
        print('공공데이터포털 수신 실패: 인증·네트워크·응답 형식을 확인하세요. 기존 자료 유지',file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
