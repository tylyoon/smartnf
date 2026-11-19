"""Shared, auditable family safeguards around Gemini semantic matches."""
import pathlib,re
ROWS=[]
for line in pathlib.Path(__file__).with_name('ingredient_categories.tsv').read_text(encoding='utf-8').splitlines():
    if not line or line.startswith('#'):continue
    fields=line.split('\t');ROWS.append(dict(zip(('key','aliases','search','accept','reject','spec'),fields)))
def rule(query):
    q=query.split(',')[0].strip()
    for r in ROWS:
        if any(q==a or q.startswith(a+' ') for a in r['aliases'].split('|')):return r
    return None
def search_name(query):
    r=rule(query);return r['search'] if r else query.split(',')[0].strip()
def compatible(query,name):
    r=rule(query)
    if not r:return None
    if not re.search(r['accept'],name,re.I) or re.search(r['reject'],name,re.I):return False
    for term in ('무염','가염','흑후추','백후추','저지방','식물성','동물성','양지','설도','등심','불고기','국거리','미국산','호주산','한우'):
        if term in query and term not in name:return False
    return True
def specification(query):
    r=rule(query)
    if not r:return ''
    if r['key']=='BEEF' and any(t in query for t in ('양지','설도','등심','불고기','국거리')):return ''
    return r['spec']
