"""Official public CSV -> atomic reference snapshot. Python standard library only."""
import argparse, csv, datetime as dt, decimal, hashlib, io, json, os, pathlib, re, statistics
import urllib.request, urllib.parse, tempfile

ORIGIN = 'https://www.data.go.kr'
DATASET = ORIGIN + '/data/15083256/fileData.do'

def request(path, fields=None, limit=40_000_000):
    data = urllib.parse.urlencode(fields).encode() if fields is not None else None
    with urllib.request.urlopen(urllib.request.Request(path, data=data, headers={'User-Agent':'SmartNF-PriceReference/1.0'}), timeout=25) as response:
        body = response.read(limit + 1)
    if len(body) > limit:
        raise ValueError('공공데이터 응답 크기 제한 초과')
    return body

def snapshot(raw):
    try: text = raw.decode('utf-8-sig')
    except UnicodeDecodeError: text = raw.decode('cp949')
    rows = csv.DictReader(io.StringIO(text))
    if not {'상품명','조사일','판매가격','판매업소'}.issubset(rows.fieldnames or []):
        raise ValueError('CSV 필수 열 변경: 기존 가격 유지')
    # One latest survey per product; one observation per store.
    products = {}
    for row in rows:
        name, day, store = (row[k].strip() for k in ('상품명','조사일','판매업소'))
        day = dt.date.fromisoformat(day).isoformat()
        if dt.date.fromisoformat(day) > dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date(): raise ValueError('미래 조사일')
        value = decimal.Decimal(row['판매가격'].replace(',','').strip())
        if not value.is_finite() or value <= 0 or value > 100_000_000 or not name or not store: continue
        if len(name)>300 or any(c in name for c in '\t\n\r'): raise ValueError('상품명 형식 변경')
        if name not in products or day > products[name][0]: products[name] = (day,{})
        if day == products[name][0]: products[name][1][store] = value
    if not products: raise ValueError('유효한 조사 자료 없음')
    out = ['#SmartNF-ChamPrice-v1', '#updatedAt\t'+dt.datetime.now(dt.timezone.utc).isoformat(), '#source\t'+DATASET, '#sha256\t'+hashlib.sha256(raw).hexdigest()]
    out.append('name\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount')
    for name, (day, stores) in sorted(products.items()):
        values = list(stores.values())
        out.append('\t'.join(map(str,(name,day,statistics.median(values),min(values),max(values),len(values)))))
    return ('\n'.join(out)+'\n').encode()

def atomic_write(path, body):
    path = pathlib.Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.price-')
    try:
        with os.fdopen(fd,'wb') as f: f.write(body)
        os.replace(temp,path)
    finally:
        if os.path.exists(temp): os.unlink(temp)

def refresh(output):
    metadata = json.loads(request(ORIGIN+'/catalog/15083256/fileData.json', limit=2_000_000))
    if metadata.get('license',{}).get('name')!='이용허락범위 제한 없음' or metadata.get('isAccessibleForFree') is not True:
        raise ValueError('공식 이용허락 조건 변경: 기존 가격 유지')
    # Metadata is only an update hint, never a source of price observations.
    signature = hashlib.sha256(json.dumps(metadata,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    marker = pathlib.Path(str(output)+'.meta')
    if pathlib.Path(output).is_file() and marker.exists() and marker.read_text()==signature:
        return '새 CSV 없음'
    page = request(DATASET, limit=3_000_000).decode('utf-8')
    match = re.search(r"fn_fileDataDown\('15083256',\s*'([^']+)',\s*'([^']*)',\s*'([^']+)',\s*'([^']+)'\)",page)
    if not match: raise ValueError('공식 다운로드 화면 형식 변경: 기존 가격 유지')
    detail, attachment, part, history = match.groups()
    result = json.loads(request(ORIGIN+'/tcs/dss/selectFileDataDownload.do', {'publicDataPk':'15083256','publicDataDetailPk':detail,'atchFileId':attachment,'fileDetailSn':part,'publicDataHistSn':history,'publicDataTyCode':'PR0051'},limit=2_000_000))
    if result.get('status') is not True: raise ValueError('공식 파일 다운로드 확인 실패')
    attachment, part = result['atchFileId'],str(result['fileDetailSn'])
    # Do not solve or bypass a download challenge.
    check = json.loads(request(ORIGIN+'/cmm/cmm/check-limit.json',{'atchFileId':attachment,'fileDetailSn':part},limit=100_000))
    if check.get('needCaptcha') is not False: raise ValueError('다운로드 확인 절차 필요: 기존 가격 유지')
    url = ORIGIN+'/cmm/cmm/fileDownload.do?'+urllib.parse.urlencode({'atchFileId':attachment,'fileDetailSn':part})
    raw = request(url)
    body = snapshot(raw)
    target = pathlib.Path(output)
    if target.exists():
        def latest(b): return max(line.split('\t')[1] for line in b.decode().splitlines()[5:] if line)
        if latest(body)<latest(target.read_bytes()): raise ValueError('과거 조사 자료로 교체하지 않습니다')
    atomic_write(output,body); atomic_write(marker,signature.encode())
    return '참가격 새 조사 자료 반영 완료'

def main():
    p=argparse.ArgumentParser();p.add_argument('--csv');p.add_argument('--refresh',action='store_true');p.add_argument('--output',default='data/price-reference/champrice.tsv');a=p.parse_args()
    if a.csv: atomic_write(a.output,snapshot(pathlib.Path(a.csv).read_bytes()));print('참가격 CSV 반영 완료')
    elif a.refresh: print(refresh(a.output))
    else: p.error('--csv 또는 --refresh 필요')

if __name__=='__main__': main()
