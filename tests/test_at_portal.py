import sys,pathlib,tempfile,unittest,datetime as dt,json,os
from unittest.mock import patch
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools/price_sources'))
import at_portal as a
DAY=dt.date(2026,11,16)
def row(price='3000',market='M1',**kw):
 r=dict(se_cd='01',se_nm='소매',exmn_ymd='20261113',ctgry_cd='200',item_cd='245',item_nm='양파',unit='kg',unit_sz='1',vrty_cd='01',vrty_nm='일반',grd_cd='04',grd_nm='상품',sgg_cd='1101',mrkt_cd=market,exmn_dd_prc=price);r.update(kw);return r
def response(rows,total=None):return {'header':{'resultCode':'00'},'body':{'items':{'item':rows},'totalCount':len(rows) if total is None else total}}
class Portal(unittest.TestCase):
 def test_env_literal_not_executed(self):
  with tempfile.TemporaryDirectory() as d,patch.dict(os.environ,{},clear=True):
   p=pathlib.Path(d)/'.env.local';p.write_text("OTHER=$(touch bad)\n"+a.KEY+"='abc+/='\n")
   self.assertEqual(a.credential(p),'abc+/=')
 def test_encoded_key_once(self):
  with patch.dict(os.environ,{a.KEY:'abc%2B%2F%3D'},clear=True):self.assertEqual(a.credential(),'abc+/=')
 def test_duplicate_reject(self):
  with tempfile.TemporaryDirectory() as d,patch.dict(os.environ,{},clear=True):
   p=pathlib.Path(d)/'env';p.write_text((a.KEY+'=a\n')*2)
   with self.assertRaises(ValueError):a.credential(p)
 def test_median_latest(self):
  r=a.normalize([row(),row('5000','M2'),row('1','M3',exmn_ymd='20261112')],DAY)[0]
  self.assertEqual(r[1:],('2026-11-13','4000','3000','5000','2'));self.assertIn('양파(1kg)',r[0])
 def test_not_mass_guessed(self):self.assertIn('(10개)',a.normalize([row(unit='개',unit_sz='10',item_nm='계란')],DAY)[0][0])
 def test_wholesale_future_stale_reject(self):
  for changes in ({'se_cd':'02'},{'se_nm':'중도매'},{'exmn_ymd':'20261117'},{'exmn_ymd':'20261001'}):
   with self.assertRaises(ValueError):a.normalize([row(**changes)],DAY)
 def test_error_no_data_reject(self):
  with self.assertRaises(ValueError):a.unpack({'header':{'resultCode':'30'}})
  with self.assertRaises(ValueError):a.collect('DUMMY',DAY,[('200','245')],lambda *x,**y:json.dumps(response([])).encode())
 def test_query_scoped_and_no_double_encoding(self):
  calls=[]
  def fetch(url,**kw):calls.append(url);return json.dumps(response([row()])).encode()
  body,n=a.collect('abc+/=',DAY,[('200','245')],fetch)
  self.assertEqual(n,1);self.assertIn('serviceKey=abc%2B%2F%3D',calls[0]);self.assertIn('cond%5Bse_cd%3A%3AEQ%5D=01',calls[0]);self.assertNotIn('abc',body.decode())
 def test_wrong_item_reject(self):
  with self.assertRaises(ValueError):a.collect('DUMMY',DAY,[('100','111')],lambda *x,**y:json.dumps(response([row()])).encode())
 def test_launcher_patch_idempotent_backup(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'run_local.sh';original='case "$task_line" in\n        DB_URL=*) ;;\n        *) fail "지원하지 않는 설정 줄" ;;\nesac\n';p.write_text(original)
   a.setup_launcher(p);a.setup_launcher(p)
   self.assertEqual(p.read_text().count(a.KEY+'=*)'),1);self.assertEqual(pathlib.Path(str(p)+'.before-at-portal').read_text(),original)
 def test_no_conflicting_market_price(self):
  with self.assertRaises(ValueError):a.normalize([row(),row('4000')],DAY)
if __name__=='__main__':unittest.main()
