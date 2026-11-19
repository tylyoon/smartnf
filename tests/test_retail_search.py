import importlib.util, unittest, json
from pathlib import Path
s=importlib.util.spec_from_file_location('retail_search',Path(__file__).resolve().parents[1]/'tools/price_sources/retail_search.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class RetailTests(unittest.TestCase):
 def test_homeplus_null_payload_is_diagnosed_without_attribute_error(self):
  for value in [None, {'dataList':None}]:
   with self.assertRaisesRegex(ValueError,'SOURCE_EMPTY_DATA'):
    m.parse('HOMEPLUS',json.dumps({'returnStatus':200,'data':value}))
 def test_homeplus_malformed_shape_is_not_no_results(self):
  for value in [None,[],{'returnStatus':200,'data':[]},{'returnStatus':200,'data':{'dataList':{}}}]:
   with self.assertRaisesRegex(ValueError,'SOURCE_INVALID_RESPONSE'):m.parse('HOMEPLUS',json.dumps(value))
 def test_homeplus_actual_empty_list_and_null_rows(self):
  for rows in [[],[None]]:
   self.assertEqual(m.parse('HOMEPLUS',json.dumps({'returnStatus':200,'data':{'dataList':rows}})),[])

 def test_enuri_requires_stock_currency_and_nonexpired(self):
  def raw(**change):
   p={'@type':'Product','sku':'123','name':'스파게티 500g','url':'https://www.enuri.com/detail.jsp?modelno=123','offers':dict(priceCurrency='KRW',lowPrice=1390,availability='https://schema.org/InStock',**change)}
   return '<script type="application/ld+json">'+json.dumps({'itemListElement':[{'item':p}]})+'</script>'
  self.assertEqual(m.parse('ENURI',raw())[0]['price'],1390)
  self.assertEqual(m.parse('ENURI',raw(priceValidUntil='2001-01-01')),[])
  self.assertEqual(m.parse('ENURI',raw()).__len__(),1)
 def test_oasis_normal_not_coupon_or_unit_price(self):
  raw='<div class="wrapBox"><div class="wrapInfo"><a class="listTit" href="/product/detail/123?categoryId=">양파 1kg</a><span class="info_cpPrice">쿠폰적용가 900원</span><span class="price_discount"><b>1,500</b>원</span><span class="price_original"><b>2000</b></span><div>100g당 150원</div></div></div>'
  p=m.parse('OASIS',raw)[0];self.assertEqual(p['price'],1500);self.assertIn('900원',p['conditions'])
  self.assertEqual(m.parse('OASIS',raw.replace('<div class="wrapBox">','<div class="wrapBox"><div class="img_soldOut">품절</div>')),[])
 def test_danawa_own_card_pack_not_unit_or_ad(self):
  raw='<div class="flex py-6"><a class="font-bold" href="https://prod.danawa.com/info/?pcode=123">양파 10kg</a><a href="https://prod.danawa.com/info/?pcode=123">172원/100g</a><a href="https://prod.danawa.com/info/?pcode=123"><span class="text-px16">17,190원</span></a></div>'
  self.assertEqual(m.parse('DANAWA',raw)[0]['price'],17190)
 def test_exact_hosts_only_and_no_credentials(self):
  for url in ['http://www.oasis.co.kr/product/detail/1','https://www.oasis.co.kr.evil.test/product/detail/1','https://evil@www.oasis.co.kr/product/detail/1','https://www.oasis.co.kr/product/detail/1#bad']:
   self.assertFalse(m.allowed('OASIS',url))
 def test_missing_structure_never_fabricates_price(self):
  for p in m.SOURCES:
   if p=='HOMEPLUS':
    with self.assertRaisesRegex(ValueError,'SOURCE_INVALID_RESPONSE'):m.parse(p,'<html>차단 또는 구조 변경</html>')
   else:self.assertEqual(m.parse(p,'<html>차단 또는 구조 변경</html>'),[])
 def test_emart_uses_display_not_marketing_or_shipping(self):
  p={'itemName':'양파 1kg','itemId':'123','itemUrl':'https://emart.ssg.com/item/itemView.ssg?itemId=123','salestrNo':'2037','priceInfo':{'rawPrimaryPrice':'3000','isVisiblePrice':True},'reactingDetail':{'mkt_info':{'lwst_sellprc':100}},'shippingCostInfo':[{'text':'4만↑무료배송'}]}
  def raw():return '<script id="__NEXT_DATA__" type="application/json">'+json.dumps({'products':[p]})+'</script>'
  result=m.parse('EMART',raw())[0];self.assertEqual(result['price'],3000);self.assertIn('2037',result['conditions']);p['soldOutMessage']='품절';self.assertEqual(m.parse('EMART',raw()),[])
 def test_lotte_uses_general_price_not_discount_in_title(self):
  p={'retailerProductId':'OS123','name':'[농할할인가 4496원] 양파 3kg','available':True,'price':{'current':{'amount':'5620','currency':'KRW'},'unit':{'current':{'amount':'188'}}},'offers':[{'description':'농할20%'}]}
  def raw():return '<script>window.__INITIAL_STATE__='+json.dumps({'products':[p]})+';</script>'
  result=m.parse('LOTTE',raw())[0];self.assertEqual(result['price'],5620);self.assertIn('농할20%',result['conditions']);p['available']=False;self.assertEqual(m.parse('LOTTE',raw()),[])
 def test_homeplus_general_discount_card_and_stock_are_separate(self):
  p={'itemNo':'123','itemNm':'양파 3kg','storeId':37,'storeType':'HYPER','salePrice':9980,'dcPrice':4990,'dcType':'ITEM_DISCOUNT_PRICE','soldOutYn':'N','itemSoldOutYn':'N','docDispYn':'Y'}
  def raw():return json.dumps({'returnStatus':200,'data':{'dataList':[p]}})
  self.assertEqual(m.parse('HOMEPLUS',raw())[0]['price'],4990)
  p['dcType']='CARD_DISCOUNT_PRICE';self.assertEqual(m.parse('HOMEPLUS',raw())[0]['price'],9980)
  p['dcType']='ITEM_DISCOUNT_PRICE';p['eventInfo']={'eventEndDt':'2001-01-01 00:00:00 Asia/Seoul'};self.assertEqual(m.parse('HOMEPLUS',raw())[0]['price'],9980)
  p['soldOutYn']='Y';self.assertEqual(m.parse('HOMEPLUS',raw()),[])
if __name__=='__main__':unittest.main()
