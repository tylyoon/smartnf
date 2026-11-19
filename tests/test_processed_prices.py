import unittest,sys,tempfile,datetime as dt,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools/price_sources'))
import ingredient_policy as p,scheduled_prices as s
class ProcessedTests(unittest.TestCase):
 def test_families_and_wrong_processed_foods(self):
  for query,name in [('버터','서울우유 버터(450g)'),('베이컨','백설 햄스빌 베이컨(330g)'),('토마토소스','오뚜기 토마토 케찹(500g)'),('후추','오뚜기 순후추(50g)'),('생크림','매일 생크림(500ml)'),('국간장','샘표 국간장(500ml)')]:self.assertTrue(s.same_food(query,name))
  for query,name in [('버터','허니버터 아몬드(120g)'),('생크림','생크림케이크(408g)'),('국간장','양조간장(500ml)'),('소금','꽃소금(500g)'),('소고기','쇠고기카레(200g)')]:self.assertFalse(s.same_food(query,name))
 def test_policy_copies_are_identical(self):
  root=pathlib.Path(__file__).resolve().parents[1];self.assertEqual((root/'tools/price_sources/ingredient_categories.tsv').read_bytes(),(root/'src/main/resources/price-reference/ingredient_categories.tsv').read_bytes())
 def test_grade_plus_is_not_a_package_multiplier(self):
  self.assertEqual(s.mass('소(100g) · 설도 · 1++등급')[0],100);self.assertTrue(p.specification('소고기'));self.assertFalse(p.specification('소고기 양지'))
 def test_survey_rows_enter_ai_without_becoming_sale_packages(self):
  with tempfile.TemporaryDirectory() as directory:
   path=pathlib.Path(directory);at=dt.datetime(2026,11,16,11,tzinfo=s.KST)
   (path/'champrice.tsv').write_text('#SmartNF-ChamPrice-v1\n#updatedAt\t2026-11-16T00:00:00Z\n#source\thttps://www.data.go.kr/data/15083256/fileData.do\n#sha256\ttest\nname\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount\n서울우유 버터(450g)\t2026-11-01\t11580\t10000\t12000\t2\n허니버터아몬드(120g)\t2026-11-01\t6990\t6000\t7000\t2\n',encoding='utf-8')
   c=s.connect(path);s.seed_references(c,['버터'],directory,at);self.assertEqual(c.execute('SELECT count(*) FROM offers').fetchone()[0],1)
   calls=[]
   def ai(rows):
    calls.append(rows);return [dict(id=r['id'],sameFood=True,grams=450,evidence='450g',searchName='버터',priceClass='BASE',conditionsEvidence='조사 규격 가격') for r in rows]
   s.analyze(c,'2026-11-16',ai);s.export(c,directory,at.isoformat());self.assertIn('VALIDATED',(path/'reference-matches.tsv').read_text());self.assertEqual(len(calls),1)
   s.seed_references(c,['버터'],directory,at);s.analyze(c,'2026-11-16',ai);self.assertEqual(len(calls),1);c.close()
if __name__=='__main__':unittest.main()
