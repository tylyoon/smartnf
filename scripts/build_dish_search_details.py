"""Copy public source provenance for the dish detail filter; never infer recipes."""
import json
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'src/main/resources/static/js/data'
nut=base/'food-nutrition'
m=json.loads((nut/'manifest.json').read_text(encoding='utf-8'))
rows={}
for path in sorted((nut/m['version']).glob('mfds_dishes-*.json')):
    chunk=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(chunk,dict): continue
    for key,r in chunk.items():
        meta=r.get('source_metadata',{})
        rows[key]=' · '.join(str(meta[x]) for x in ('식품기원명','데이터생성방법명') if meta.get(x))
(base/'dish-search-details.json').write_text(json.dumps({'nutrition_version':m['version'],'details':rows},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(len(rows),'source detail labels')
