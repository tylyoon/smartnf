"""Rebuild meal reference data from the public nutrition manifest (no separate food list)."""
import hashlib,json,pathlib
from decimal import Decimal, ROUND_HALF_UP
root=pathlib.Path(__file__).resolve().parents[1]
base=root/'src/main/resources/static/js/data/food-nutrition'
m=json.loads((base/'manifest.json').read_text(encoding='utf-8'));version=base/m['version']
def read(name):
    data=(version/name).read_bytes()
    expected=m['files_sha256'].get(name) or m['files_sha256'].get(m['version']+'/'+name)
    if not expected or hashlib.sha256(data).hexdigest()!=expected: raise ValueError('Source checksum mismatch: '+name)
    return json.loads(data)
keys=['energy','protein','carbohydrate','fat','sodium','sugars','fiber','saturated_fat']
rows=[];seen=set()
for source,meta in m['sources'].items():
    index=read(meta['index']);assert len(index)==meta['count']
    chunks={}
    for item in index:
        assert item['id'] not in seen;seen.add(item['id'])
        if item['chunk'] not in chunks: chunks[item['chunk']]=read(item['chunk'])
        food=chunks[item['chunk']][item['id']]
        assert food['name']==item['name'] and food['basis_raw']==item['basis']
        values=[]
        for k in keys:
            n=food['nutrients'].get(k,{})
            expected_unit='kcal' if k=='energy' else 'mg' if k=='sodium' else 'g'
            assert n.get('unit',expected_unit)==expected_unit
            # Match the existing DECIMAL(14,5) snapshot precision, removing binary float tails.
            values.append(format(Decimal(str(n['value'])).quantize(Decimal('0.00001'),rounding=ROUND_HALF_UP).normalize(),'f') if n.get('status')=='numeric' and n.get('value') is not None else '')
        fields=[item['id'],item['name'],m['version'],meta['publisher'],item['basis'],item['group'],*values]
        assert all(not any(c in f for c in '\t\n\r') for f in fields)
        rows.append('\t'.join(fields))
output=base/'meal-references.tsv';output.write_text('\n'.join(rows)+'\n',encoding='utf-8')
print(f'{len(rows)} references generated from {m["version"]}')
