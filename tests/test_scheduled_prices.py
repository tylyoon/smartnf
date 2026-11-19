import sys,unittest,tempfile,datetime as dt,json,sqlite3
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/price_sources'))
import scheduled_prices as m
class ScheduleTests(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.dir=self.tmp.name;self.surveys=[];self.lookups=[];self.ai=[]
 def tearDown(self):self.tmp.cleanup()
 def at(self,h,minute=0):return dt.datetime(2026,11,16,h,minute,tzinfo=m.KST)
 def product(self,p='OASIS',price=3000,name='양파 500g x 3봉'):
  urls={'OASIS':'https://www.oasis.co.kr/product/detail/1','DANAWA':'https://prod.danawa.com/info/?pcode=1','ENURI':'https://www.enuri.com/detail.jsp?modelno=1','EMART':'https://emart.ssg.com/item/itemView.ssg?itemId=1','LOTTE':'https://lottemartzetta.com/products/OS1/details','HOMEPLUS':'https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER','KAKAO':'https://shoppinghow.kakao.com/go.daum?x=1'}
  return dict(provider=p,url=urls[p],name=name,merchant=p,price=price,conditions='일반 표시가',delivery='미확인')
 def lookup(self,p,q):self.lookups.append((p,q));return [self.product(p)]
 def generate(self,rows):
  self.ai.append(rows);return [dict(id=r['id'],confidence='LOW') if r.get('task') else dict(id=r['id'],sameFood=True,grams=float(m.mass(r['name'])[0]),evidence=m.mass(r['name'])[1]) for r in rows]
 def tick(self,at):m.tick(self.dir,['양파, 생것'],at,self.lookup,self.generate,self.surveys.append)
 def test_10am_stagger_and_no_duplicate(self):
  self.tick(self.at(9,59));self.assertEqual(self.surveys,[])
  self.tick(self.at(10));self.tick(self.at(10));self.assertEqual(self.surveys,['KAMIS']);self.assertEqual(self.lookups,[])
  self.tick(self.at(10,10));self.assertEqual(self.surveys,['KAMIS','CHAMPRICE']);self.assertEqual(self.lookups,[])
  self.tick(self.at(10,20));self.tick(self.at(10,21));self.tick(self.at(10,22));self.assertEqual(len(self.lookups),7);self.assertNotIn('GEMINI',[p for p,q in self.lookups])
  c=m.connect(self.dir);self.assertEqual({r[0] for r in c.execute('SELECT mode FROM collection_runs')},{'SCHEDULED'});c.close()
 def test_late_start_catches_up_and_restart_skips_done(self):
  for _ in range(6):self.tick(self.at(13))
  self.assertEqual(self.surveys,['KAMIS','CHAMPRICE']);self.assertEqual(len(self.lookups),7)
  c=m.connect(self.dir);self.assertEqual(c.execute('SELECT count(*) FROM jobs WHERE state="DONE"').fetchone()[0],10);c.close()
 def test_price_only_changes_reuse_analysis_and_keep_history(self):
  c=m.connect(self.dir);p=self.product();m.store(c,'양파, 생것','OASIS',[p],self.at(11).isoformat());m.analyze(c,'2026-11-16',self.generate)
  p['price']=4000;m.store(c,'양파, 생것','OASIS',[p],self.at(12).isoformat());m.analyze(c,'2026-11-16',self.generate)
  self.assertEqual(len(self.ai),1);self.assertEqual(c.execute('SELECT count(*) FROM history').fetchone()[0],2);self.assertEqual(c.execute('SELECT state FROM analysis').fetchone()[0],'VALIDATED');c.close()
 def test_hallucinated_mass_and_wrong_food_never_validated(self):
  c=m.connect(self.dir);m.store(c,'양파, 생것','OASIS',[self.product()],self.at(11).isoformat())
  m.analyze(c,'2026-11-16',lambda rows:[dict(id=r['id'],sameFood=True,grams=999,evidence='500g x 3봉') for r in rows]);self.assertEqual(c.execute('SELECT state FROM analysis').fetchone()[0],'REVIEW');c.close()
  self.assertFalse(m.same_food('양파, 생것','양파 소스 500g'));self.assertIsNone(m.mass('올리브유 500mL'));self.assertIsNone(m.mass('양파 1kg/3kg'));self.assertIsNone(m.mass('양파 500g 이상'))
 def test_comparison_options_need_review(self):
  c=m.connect(self.dir);m.store(c,'양파, 생것','DANAWA',[self.product('DANAWA')],self.at(11).isoformat());m.analyze(c,'2026-11-16',self.generate);self.assertEqual(c.execute('SELECT state FROM analysis').fetchone()[0],'REVIEW');c.close()
 def test_daily_ai_limit_and_failure_preserves_original_price(self):
  c=m.connect(self.dir);m.store(c,'양파, 생것','OASIS',[self.product()],self.at(11).isoformat());m.analyze(c,'2026-11-16',self.generate,limit=0);self.assertEqual(self.ai,[])
  def bad(rows):raise RuntimeError('secret-key-should-not-leak')
  m.analyze(c,'2026-11-16',bad);self.assertEqual(c.execute('SELECT message FROM analysis').fetchone()[0],'GEMINI_FAILURE');self.assertEqual(c.execute('SELECT price FROM offers').fetchone()[0],'3000');c.close()
 def test_other_process_lease_is_not_deleted(self):
  c=m.connect(self.dir);expiry=self.at(12).timestamp();c.execute('INSERT INTO lease VALUES(1,?)',(expiry,));c.commit();c.close();self.tick(self.at(11));c=m.connect(self.dir);self.assertEqual(c.execute('SELECT until_at FROM lease').fetchone()[0],expiry);self.assertEqual(self.surveys,[]);c.close()
 def test_failed_provider_retries_after_backoff_without_erasing_offers(self):
  c=m.connect(self.dir);m.store(c,'양파, 생것','OASIS',[self.product()],self.at(11).isoformat());c.close()
  def bad(p,q):raise RuntimeError('network')
  for _ in range(3):m.tick(self.dir,['양파, 생것'],self.at(13),bad,self.generate,self.surveys.append)
  c=m.connect(self.dir);self.assertEqual(c.execute('SELECT price FROM offers').fetchone()[0],'3000');self.assertGreater(c.execute('SELECT count(*) FROM jobs WHERE state="FAILED"').fetchone()[0],0);c.close()
 def test_alias_and_discount_classification_need_original_evidence(self):
  c=m.connect(self.dir);p=self.product();m.store(c,'양파, 생것','OASIS',[p],self.at(11).isoformat())
  def ai(rows):return [dict(id=r['id'],sameFood=True,grams=1500,evidence='500g x 3봉',searchName='양파',priceClass='BASE',conditionsEvidence='일반 표시가') for r in rows]
  m.analyze(c,'2026-11-16',ai);r=c.execute('SELECT * FROM suggestions').fetchone();self.assertEqual(r['search_name'],'양파');self.assertEqual(r['price_class'],'BASE');c.close()
 def test_http_block_stops_the_provider_for_today(self):
  import urllib.error
  def blocked(p,q):raise urllib.error.HTTPError('https://example.invalid',429,'rate limit',None,None)
  for _ in range(3):m.tick(self.dir,['양파, 생것'],self.at(13),blocked,self.generate,self.surveys.append)
  c=m.connect(self.dir);self.assertGreater(c.execute('SELECT count(*) FROM blocks').fetchone()[0],0);c.close()
if __name__=='__main__':unittest.main()
