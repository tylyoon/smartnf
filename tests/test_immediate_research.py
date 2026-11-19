import unittest,tempfile,sys,io,json,contextlib,urllib.error
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/price_sources'))
import scheduled_prices as m
class ImmediateResearchTests(unittest.TestCase):
 def product(self,name='정제염 1kg'):
  return dict(provider='HOMEPLUS',name=name,price=2000,url='https://mfront.homeplus.co.kr/item?itemNo=123&storeType=HYPER',merchant='홈플러스',conditions='일반 표시가',delivery='미확인',sourceVerified=True)
 def ai(self,rows):
  return [dict(id=r['id'],searchNames=['소금']) for r in rows] if rows[0].get('task')=='RESEARCH' else []
 def run_collect(self,d,lookup,ai=None,query='정제염'):
  output=io.StringIO()
  with contextlib.redirect_stdout(output):m.collect_now(d,[query],['HOMEPLUS'],lookup=lookup,generate=ai or self.ai)
  return json.loads(output.getvalue().splitlines()[-1])
 def test_empty_response_uses_ai_term_literal_and_original_food_filter(self):
  with tempfile.TemporaryDirectory() as d:
   def retailer(provider,q):
    if q=='정제염':raise ValueError('SOURCE_EMPTY_DATA')
    return [self.product(),self.product('천일염 1kg'),self.product('소금우유 과자 50g')]
   # Default lookup must bypass aliases only for proposed term, retaining original query on storage.
   with patch.object(m,'retail_search',side_effect=retailer) as retail:
    result=self.run_collect(d,m.fetch)
   self.assertEqual([r.args[1] for r in retail.call_args_list],['정제염','소금']);self.assertEqual(result['saved'],1);self.assertEqual(result['searchTerm'],'소금')
   c=m.connect(d);self.assertEqual(c.execute('SELECT query FROM offers').fetchone()[0],'정제염');self.assertEqual(c.execute('SELECT count(*) FROM jobs').fetchone()[0],0);self.assertEqual(c.execute('SELECT state FROM immediate_research').fetchone()[0],'DONE');c.close()
 def test_original_alias_name_can_be_used_as_literal_term(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);term,reason=m.immediate_search_term(c,m.now().date().isoformat(),'소금','HOMEPLUS',self.ai,80);self.assertEqual(term,'소금');c.close()
 def test_unrelated_fallback_not_saved(self):
  with tempfile.TemporaryDirectory() as d:
   def lookup(p,q):
    if q=='정제염':return []
    return [self.product('천일염 1kg')]
   result=self.run_collect(d,lookup);self.assertEqual(result['message'],'NO_RELEVANT_PRODUCTS');self.assertEqual(result['saved'],0)
 def test_http403_never_triggers_research_or_retry(self):
  with tempfile.TemporaryDirectory() as d:
   calls=[]
   def lookup(p,q):raise urllib.error.HTTPError('https://example.invalid',403,'Forbidden',None,None)
   def ai(rows):calls.append(rows);return []
   result=self.run_collect(d,lookup,ai);self.assertEqual(result['message'],'HTTP_403');self.assertEqual(calls,[])
 def test_fallback403_sets_day_block(self):
  with tempfile.TemporaryDirectory() as d:
   calls=[]
   def lookup(p,q):
    calls.append(q)
    if q=='정제염':return []
    raise urllib.error.HTTPError('https://example.invalid',403,'Forbidden',None,None)
   self.run_collect(d,lookup);result=self.run_collect(d,lookup);self.assertEqual(result['message'],'DISABLED');self.assertEqual(len(calls),4) # initial + blocked Homeplus retry + independent Oasis/Lotte
 def test_daily_limit_and_backoff_prevent_calls(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);day=m.now().date().isoformat();calls=[]
   def ai(rows):calls.append(rows);return []
   self.assertEqual(m.immediate_search_term(c,day,'정제염','HOMEPLUS',ai,0)[1],'GEMINI_DAILY_LIMIT')
   c.execute('INSERT INTO jobs(day,query,provider,state,next_at) VALUES(?,"","GEMINI","FAILED",?)',(day,m.time.time()+1800));c.commit()
   self.assertEqual(m.immediate_search_term(c,day,'정제염','HOMEPLUS',ai,80)[1],'GEMINI_BACKOFF');self.assertEqual(calls,[]);c.close()
 def test_research_error_visible_and_cooldown_applies(self):
  with tempfile.TemporaryDirectory() as d:
   def ai(rows):raise RuntimeError('GEMINI_HTTP_503')
   result=self.run_collect(d,lambda p,q:[],ai);self.assertEqual(result['researchMessage'],'GEMINI_HTTP_503')
   result=self.run_collect(d,lambda p,q:[],ai);self.assertEqual(result['researchMessage'],'RESEARCH_BACKOFF')
 def test_successful_initial_collection_does_not_request_research(self):
  with tempfile.TemporaryDirectory() as d:
   tasks=[]
   def ai(rows):tasks.extend(r.get('task','ANALYZE') for r in rows);return []
   self.run_collect(d,lambda p,q:[self.product()],ai);self.assertNotIn('RESEARCH',tasks)
 def test_bad_term_cannot_become_search_or_price(self):
  with tempfile.TemporaryDirectory() as d:
   def ai(rows):return [dict(id=r['id'],searchNames=['https://bad.example','정제염'],price=1) for r in rows]
   result=self.run_collect(d,lambda p,q:[],ai);self.assertEqual(result['researchMessage'],'NO_ALTERNATIVE_TERM');self.assertEqual(result['saved'],0)
 def test_two_round_limit_and_scheduled_jobs_unchanged(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);day=m.now().date().isoformat()
   c.execute('INSERT INTO jobs(day,query,provider,state,attempts,next_at,message) VALUES(?,?,?,"PENDING",1,42,"keep")',(day,'정제염','HOMEPLUS'));c.commit()
   before=tuple(c.execute('SELECT * FROM jobs').fetchone())
   m.immediate_search_term(c,day,'정제염','HOMEPLUS',self.ai,80)
   self.assertEqual(tuple(c.execute('SELECT * FROM jobs').fetchone()),before)
   c.execute('UPDATE immediate_research SET round=2,next_at=0');c.commit()
   self.assertEqual(m.immediate_search_term(c,day,'정제염','HOMEPLUS',self.ai,80)[1],'RESEARCH_BACKOFF');c.close()
 def test_second_proposal_used_before_other_retailers(self):
  with tempfile.TemporaryDirectory() as d:
   calls=[]
   def ai(rows):return [dict(id=r['id'],searchNames=['정제소금','소금']) for r in rows] if rows[0].get('task')=='RESEARCH' else []
   def lookup(p,q):
    calls.append((p,q))
    return [self.product()] if q=='소금' else []
   result=self.run_collect(d,lookup,ai)
   self.assertEqual(calls,[('HOMEPLUS','정제염'),('HOMEPLUS','정제소금'),('HOMEPLUS','소금')]);self.assertEqual(result['saved'],1)
   c=m.connect(d);self.assertEqual(c.execute('SELECT sum(saved) FROM collection_runs').fetchone()[0],1);c.close()
 def test_other_retailer_success_has_real_provider_and_receipt(self):
  with tempfile.TemporaryDirectory() as d:
   def lookup(p,q):
    if p=='OASIS':return [{**self.product(), 'provider':'OASIS','url':'https://www.oasis.co.kr/product/detail/123'}]
    return []
   result=self.run_collect(d,lookup)
   self.assertEqual(result['savedProvider'],'OASIS');self.assertEqual(result['saved'],1)
   c=m.connect(d);self.assertEqual(c.execute('SELECT provider FROM offers').fetchone()[0],'OASIS');self.assertEqual(c.execute('SELECT count(*) FROM offer_price_checks').fetchone()[0],1);self.assertEqual(c.execute('SELECT sum(saved) FROM collection_runs').fetchone()[0],1);self.assertEqual(c.execute('SELECT count(*) FROM jobs').fetchone()[0],0);c.close()
 def test_blocked_fallback_is_skipped_and_lotte_attempted(self):
  with tempfile.TemporaryDirectory() as d:
   c=m.connect(d);day=m.now().date().isoformat();c.execute('INSERT INTO blocks VALUES(?,?,?)',(day,'OASIS','HTTP403'));c.commit();c.close();calls=[]
   def lookup(p,q):
    calls.append(p)
    return [{**self.product(), 'provider':'LOTTE','url':'https://lottemartzetta.com/products/123'}] if p=='LOTTE' else []
   result=self.run_collect(d,lookup);self.assertNotIn('OASIS',calls);self.assertEqual(result['savedProvider'],'LOTTE');self.assertTrue(any(a['state']=='SKIPPED' for a in result['attempts']))
 def test_unrelated_results_across_all_sources_never_become_reference(self):
  with tempfile.TemporaryDirectory() as d:
   def lookup(p,q):return [{**self.product('천일염 1kg'),'provider':p}] if q=='소금' else []
   result=self.run_collect(d,lookup);self.assertEqual(result['saved'],0);self.assertEqual(len(result['attempts']),3)
   c=m.connect(d);self.assertEqual(c.execute('SELECT count(*) FROM offers').fetchone()[0],0);self.assertEqual(c.execute('SELECT count(*) FROM offer_price_checks').fetchone()[0],0);c.close()
 def test_search_proposals_deduplicated_and_limited(self):
  with tempfile.TemporaryDirectory() as d:
   def ai(rows):return [dict(id=r['id'],searchNames=['소금','소금','다른검색']) for r in rows]
   c=m.connect(d);terms,_=m.immediate_search_terms(c,m.now().date().isoformat(),'정제염','HOMEPLUS',ai,80);self.assertEqual(terms,['소금']);c.close()
if __name__=='__main__':unittest.main()


