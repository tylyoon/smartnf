import unittest,tempfile,sys,os,json,urllib.error
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/price_sources'))
import scheduled_prices as m
from product_quantity import parse
class CollectionUpdateTests(unittest.TestCase):
 def test_source_response_reasons_are_preserved(self):
  for reason in ['SOURCE_EMPTY_DATA','SOURCE_INVALID_RESPONSE','SOURCE_STATUS_ERROR']:
   self.assertEqual(m.failure_reason(ValueError(reason)),reason)

 def products(self,n=25):return [dict(provider='HOMEPLUS',url=f'https://mfront.homeplus.co.kr/item?itemNo={i}&storeType=HYPER',name=f'우유 900ML×2 브랜드{i}',merchant='홈플러스',price=2790,conditions='일반 판매가',delivery='미확인') for i in range(n)]
 def test_units(self):
  for text,amount,unit in [('우유 900ML×2',1800,'ml'),('우유 1L×2',2000,'ml'),('양파 500g×3',1500,'g'),('양파 1kg',1000,'g'),('서울우유 멸균 우유 1000ml · 10개',10000,'ml')]:
   q=parse(text);self.assertEqual(q[0],amount);self.assertEqual(q[1],unit)
  for text in ['우유 900ml/1L','우유 100ml당 500원','양파 500g + 100g']:self.assertIsNone(parse(text))
 def test_limits_dedup_relevance_and_export(self):
  with tempfile.TemporaryDirectory() as d,patch.dict(os.environ,{'SMARTNF_PRICE_PER_PROVIDER_LIMIT':'20'}):
   products=self.products();bad=dict(products[0],name='우유 치즈 900ML×2')
   with patch.object(m,'retail_search',return_value=[bad,products[0],products[0]]+products[1:]):self.assertEqual(len(m.fetch('HOMEPLUS','우유')),20)
   c=m.connect(d);self.assertEqual(m.store(c,'우유','HOMEPLUS',products,m.now().isoformat()),20)
   m.export(c,d,m.now().isoformat());self.assertEqual(len((Path(d)/'scheduled.tsv').read_text().splitlines())-2,20)
   with patch.dict(os.environ,{'SMARTNF_PRICE_PER_PROVIDER_LIMIT':'7'}):self.assertEqual(len(m.selected_products('우유','HOMEPLUS',products)),7)
   c.close()
 def test_immediate_does_not_change_schedule_and_records_block(self):
  with tempfile.TemporaryDirectory() as d:
   def blocked(p,q):raise urllib.error.HTTPError('https://example.invalid',403,'blocked',None,None)
   m.collect_now(d,['우유'],['HOMEPLUS'],lookup=blocked,generate=lambda rows:[])
   c=m.connect(d);self.assertEqual(c.execute('select count(*) from jobs').fetchone()[0],0)
   self.assertEqual(c.execute('select message from collection_runs').fetchone()[0],'HTTP_403')
   self.assertEqual(c.execute('select count(*) from offers').fetchone()[0],0)
   self.assertEqual(c.execute('select mode from collection_runs').fetchone()[0],'IMMEDIATE')
   status=json.loads((Path(d)/'scheduled-status.json').read_text());self.assertEqual(status['runTotals'][0]['mode'],'IMMEDIATE');c.close()
 def test_old_run_records_are_preserved_without_guessing_mode(self):
  import sqlite3
  with tempfile.TemporaryDirectory() as d:
   c=sqlite3.connect(Path(d)/'scheduled.sqlite')
   c.execute('CREATE TABLE collection_runs(started TEXT,finished TEXT,query TEXT,provider TEXT,state TEXT,fetched INTEGER,saved INTEGER,message TEXT)')
   c.execute("INSERT INTO collection_runs VALUES('2026-11-17','2026-11-17','우유','HOMEPLUS','DONE',17,17,'')");c.commit();c.close()
   c=m.connect(d);self.assertEqual(c.execute('SELECT mode,saved FROM collection_runs').fetchone()[:],('UNKNOWN',17))
   m.export(c,d,m.now().isoformat());status=json.loads((Path(d)/'scheduled-status.json').read_text());self.assertEqual(status['runTotals'][0]['count'],1);c.close()
 def test_explicit_counts_without_inferred_egg_weight(self):
  for name,expected in [('계란 30구',30),('계란 10개×2',20),('계란(10구) · XL10구 · 등급란',10)]:
   measure=parse(name);self.assertEqual(measure[0],expected);self.assertEqual(measure[1],'ea')
  self.assertIsNone(parse('난각번호 1번 계란'))
  self.assertIsNone(parse('계란 0.5개'))
 def test_only_source_receipts_enter_verified_sale_projection(self):
  from urllib.parse import unquote
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);p=self.products(1)[0];stamp=m.now().isoformat()
   m.store(c,'우유','HOMEPLUS',[p],stamp);m.export(c,d,stamp)
   self.assertEqual(len((Path(d)/'verified-sales.tsv').read_text().splitlines()),2)
   p['sourceVerified']=True;m.store(c,'우유','HOMEPLUS',[p],stamp);m.export(c,d,stamp)
   self.assertEqual(len((Path(d)/'verified-sales.tsv').read_text().splitlines()),3)
   p['sourceVerified']=False;m.store(c,'우유','HOMEPLUS',[p],(m.now()+m.dt.timedelta(seconds=1)).isoformat());m.export(c,d,stamp)
   self.assertEqual(len((Path(d)/'verified-sales.tsv').read_text().splitlines()),2);c.close()
 def test_invalid_limit(self):
  for value in ['0','-1','101','bad']:
   with patch.dict(os.environ,{'SMARTNF_PRICE_PER_PROVIDER_LIMIT':value}):
    with self.assertRaises(ValueError):m.collection_limit()
 def test_error_details_redact_unknown(self):
  self.assertEqual(m.failure_reason(RuntimeError('secret-key')),'RESPONSE_OR_NETWORK')
  self.assertEqual(m.failure_reason(RuntimeError('GEMINI_HTTP_429')),'GEMINI_HTTP_429')
if __name__=='__main__':unittest.main()
