import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
SPEC=importlib.util.spec_from_file_location('collector',Path(__file__).resolve().parents[1]/'rpa/product_pipeline/collect.py')
c=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(c)
class CollectTests(unittest.TestCase):
 def job(self):return dict(sourceType='CRAWL',provider='HOMEPLUS',url='https://m.my.homeplus.co.kr/leaflet',branch='금천점',conditions='회원 조건 원문 확인',validFrom='2026-11-12',validTo='2026-11-18')
 def test_korean_numbers(self):
  self.assertEqual(c.normalize('양파 삼킬로그램 사천구백구십원'),'양파 3kg 4990원')
  self.assertEqual(c.normalize('이점오킬로그램'),'2.5kg')
 def test_simple_candidate(self):
  rows=c.candidates(self.job(),'양파 3kg 4990원');self.assertEqual(rows[0]['grams'],3000);self.assertEqual(rows[0]['price'],4990);self.assertFalse(rows[0]['confirmed'])
 def test_ambiguous_not_guessed(self):
  rows=c.candidates(self.job(),'양파 3kg 9980원에서 4990원 할인');self.assertIsNone(rows[0]['price'])
  rows=c.candidates(self.job(),'고기 100g 1380원');self.assertIsNone(rows[0]['grams']);self.assertIsNone(rows[0]['price'])
 def test_html_ignores_script(self):
  t=c.Text();t.feed('<script>fake 1원</script><img alt="양파 3kg 4990원">');self.assertNotIn('fake',''.join(t.parts));self.assertIn('양파',''.join(t.parts))
 def test_online_fail_closed(self):
  with self.assertRaises(ValueError):c.permitted(self.job())
  with patch.object(c,'fetch',return_value=b'<html>not robots</html>'):
   with self.assertRaises(ValueError):c.permitted(dict(self.job(),collectionPermitted=True))
  with patch.object(c,'fetch',return_value=b'User-agent: *\nDisallow: /'):
   with self.assertRaises(ValueError):c.permitted(dict(self.job(),collectionPermitted=True))
 def test_partial_failure_recovery(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'flyer.txt').write_text('양파 3kg 4990원',encoding='utf-8');m=root/'jobs.json';out=root/'out.json';m.write_text(json.dumps({'jobs':[dict(self.job(),input='flyer.txt'),dict(self.job(),input='missing.txt')]}))
   payload=c.run(m,out);self.assertEqual(len(payload['offers']),1);self.assertEqual(payload['runs'][1]['status'],'FAILED')
   (root/'missing.txt').write_text('감자 1kg 3000원',encoding='utf-8');payload=c.run(m,out);self.assertEqual(len(payload['offers']),2);self.assertTrue(all(x['status']=='REVIEW_REQUIRED' for x in payload['runs']))
 def test_no_arbitrary_host(self):
  self.assertFalse(c.official('HOMEPLUS','https://m.my.homeplus.co.kr.evil.example/'))
  self.assertFalse(c.official('HOMEPLUS','https://m.my.homeplus.co.kr@evil.example/'))
 def test_ocr_uses_argument_array(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'image.png').write_bytes(b'image')
   with patch.object(c.subprocess,'run') as proc:
    proc.return_value.stdout='양파 3kg 4990원'.encode();text=c.local(dict(self.job(),sourceType='OCR',input='image.png'),root)
    self.assertIn('양파',text);self.assertIsInstance(proc.call_args.args[0],list);self.assertEqual(proc.call_args.kwargs['timeout'],45)
if __name__=='__main__':unittest.main()
