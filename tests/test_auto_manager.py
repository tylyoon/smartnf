import unittest,tempfile,sys,datetime as dt,pathlib,json,os
from unittest.mock import patch
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools/price_sources'))
import scheduled_prices as m
from product_quantity import parse
import grounded_price_search as grounding
class AutoTests(unittest.TestCase):
 def test_volume_and_mass_parse_without_density(self):
  self.assertEqual(parse('우유 900ml x 2팩')[:2],(1800,'ml'));self.assertEqual(parse('식용유 1L')[:2],(1000,'ml'));self.assertEqual(parse('마요네즈 500g')[:2],(500,'g'));self.assertIsNone(parse('100g당 3000원 500g 포장'));self.assertIsNone(parse('우유 900ml/1L'))
 def test_ml_analysis_export_and_cached_price_change(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);p=dict(provider='OASIS',name='우유 900ml',merchant='오아시스',price=2700,url='https://www.oasis.co.kr/product/detail/1',conditions='일반 표시가',delivery='미확인');stamp='2026-11-16T13:00:00+09:00';m.store(c,'우유','OASIS',[p],stamp)
   calls=[]
   def ai(rows):calls.append(rows);return [dict(id=r['id'],sameFood=True,amount=900,unit='ml',evidence='900ml',searchName='우유',priceClass='BASE',conditionsEvidence='일반 표시가') for r in rows]
   m.analyze(c,'2026-11-16',ai);r=c.execute('SELECT * FROM measures').fetchone();self.assertEqual(r['unit'],'ml');self.assertEqual(c.execute('SELECT grams FROM analysis').fetchone()[0],'');p['price']=2800;m.store(c,'우유','OASIS',[p],stamp);m.analyze(c,'2026-11-16',ai);self.assertEqual(len(calls),1);m.export(c,d,stamp);self.assertIn('#SmartNF-ScheduledPrices-v2',(pathlib.Path(d)/'scheduled.tsv').read_text());c.close()
 def test_research_is_bounded_and_no_invented_prices(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);day='2026-11-16';epoch=dt.datetime(2026,11,16,13,tzinfo=m.KST).timestamp()
   for p in m.PROVIDERS:c.execute('INSERT INTO jobs(day,query,provider,state) VALUES(?,?,?,"DONE")',(day,'후추',p))
   c.commit();calls=[]
   def ai(rows):calls.append(rows);return [dict(id=r['id'],searchNames=['블랙페퍼','흑후추']) for r in rows]
   m.manage_missing(c,day,['후추'],epoch,ai);self.assertEqual(c.execute('SELECT round FROM research').fetchone()[0],1);self.assertEqual(c.execute('SELECT count(*) FROM offers').fetchone()[0],0)
   m.manage_missing(c,day,['후추'],epoch+1801,ai);self.assertEqual(len(calls),1) # initial retry jobs still pending
   c.execute('UPDATE jobs SET state="DONE"');c.commit();m.manage_missing(c,day,['후추'],epoch+1801,ai);self.assertEqual(len(calls),2);c.execute('UPDATE jobs SET state="DONE"');c.commit();m.manage_missing(c,day,['후추'],epoch+4000,ai);self.assertEqual(len(calls),2);c.close()
 def test_unrelated_prepared_food_cannot_override_guards(self):self.assertTrue(m.hard_conflict('마요네즈','마요네즈빵 500g'))
 def test_grounding_disabled_and_metadata_required(self):
  with patch.dict(os.environ,{'SMARTNF_GROUNDING_ENABLED':'false'}):self.assertEqual(grounding.search('마요네즈')['status'],'DISABLED')
  r=grounding.decode({'candidates':[{'content':{'parts':[{'text':'가격 3000원'}]}}]});self.assertEqual(r['status'],'UNVERIFIED')
  r=grounding.decode({'candidates':[{'content':{'parts':[{'text':'참고가격'}]},'groundingMetadata':{'groundingChunks':[{'web':{'uri':'https://example.com/product','title':'출처'}}],'groundingSupports':[{'groundingChunkIndices':[0]}],'webSearchQueries':['마요네즈500g']}}]});self.assertEqual(r['status'],'GROUNDED');self.assertEqual(r['sources'][0]['url'],'https://example.com/product')
 def test_catalog_classifies_once_and_requires_grounded_name(self):
  with tempfile.TemporaryDirectory() as d:
   path=pathlib.Path(d)/'champrice.tsv';path.write_text('#SmartNF-ChamPrice-v1\n#updatedAt\t2026-11-16T00:00:00Z\n#source\thttps://www.data.go.kr/data/15083256/fileData.do\n#sha256\ttest\nname\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount\n오뚜기 마요네즈(500g)\t2026-11-01\t7000\t6000\t8000\t2\n',encoding='utf-8');c=m.connect(d);calls=[]
   def ai(rows):calls.append(rows);return [dict(id=r['id'],canonicalIngredient='마요네즈',confidence='HIGH') for r in rows]
   m.classify_catalog(c,d,'2026-11-16',ai);self.assertEqual(c.execute('SELECT state FROM catalog').fetchone()[0],'VALIDATED');m.classify_catalog(c,d,'2026-11-16',ai);self.assertEqual(len(calls),1);c.close()
if __name__=='__main__':unittest.main()
