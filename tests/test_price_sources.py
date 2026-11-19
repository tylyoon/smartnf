import sys,pathlib,unittest,datetime as dt,tempfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools/price_sources'))
import champrice,kamis
class Sources(unittest.TestCase):
 def test_latest_store_median(self):
  raw='상품명,조사일,판매가격,판매업소\n양파(1kg),2026-10-09,900,A\n양파(1kg),2026-10-23,2000,A\n양파(1kg),2026-10-23,4000,B\n'.encode('cp949')
  self.assertIn('양파(1kg)\t2026-10-23\t3000\t2000\t4000\t2',champrice.snapshot(raw).decode())
 def test_bad_csv_does_not_replace(self):
  with tempfile.TemporaryDirectory() as d:
   path=pathlib.Path(d)/'snapshot';path.write_bytes(b'old')
   with self.assertRaises(ValueError):champrice.atomic_write(path,champrice.snapshot(b'bad'))
   self.assertEqual(path.read_bytes(),b'old')
 def test_kamis_dates_and_retail(self):
  p={'condition':[{'p_product_cls_code':'01'}],'data':{'error_code':'000','item':[{'item_name':'양파','unit':'1kg','rank':'상품','kind_name':'일반','day1':'11/13','dpr1':'3,000'}]}}
  self.assertEqual(kamis.normalize(p,dt.date(2026,11,16))[0][1],'2026-11-13')
  p['condition'][0]['p_product_cls_code']='02'
  with self.assertRaises(ValueError):kamis.normalize(p,dt.date(2026,11,16))
 def test_no_fabricated_day_or_price(self):
  p={'condition':[{'p_product_cls_code':'01'}],'data':{'error_code':'000','item':[{'item_name':'양파','unit':'1kg','day1':'','dpr1':'3000'}]}}
  with self.assertRaises(ValueError):kamis.normalize(p,dt.date(2026,11,16))
  p['data']['error_code']='001'
  with self.assertRaises(ValueError):kamis.normalize(p,dt.date(2026,11,16))
if __name__=='__main__':unittest.main()
