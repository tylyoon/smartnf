"""Offline DB -> TSV -> Java reader check. Framework annotation/receipt types are isolated.
Uses the real catalog, quantity parser and exact URL-validator source methods.
This is not a Spring Boot application/context test.
"""
from pathlib import Path
import tempfile,sys,subprocess,datetime as dt
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tools/price_sources'))
import scheduled_prices as m
with tempfile.TemporaryDirectory(prefix='smartnf-pipeline-') as temp:
 d=Path(temp);c=m.connect(d);at=m.now().isoformat()
 products=[dict(provider='HOMEPLUS',name='우유 900ML×2',merchant='홈플러스',price=2790,url=f'https://mfront.homeplus.co.kr/item?itemNo={i}&storeType=HYPER',conditions='일반 판매 표시가',delivery='미확인',sourceVerified=True) for i in range(25)]
 assert m.store(c,'우유','HOMEPLUS',products,at)==20
 m.export(c,d,at)
 java=root/'src/main/java/com/onrender/smartnf/health'
 for name in ['ScheduledPriceCatalog.java','ProductQuantity.java']:(d/name).write_text((java/name).read_text())
 source=(java/'KakaoProductSnapshots.java').read_text();start=source.index(' public static boolean validUrl(');end=source.index(' public static synchronized',start)
 (d/'KakaoProductSnapshots.java').write_text('package com.onrender.smartnf.health; import java.util.*; import java.net.URI; public class KakaoProductSnapshots {'+source[start:end]+'}')
 record=(java/'IngredientProductService.java').read_text();record=record[record.index(' public record Product('):record.index(' public record Result(')]
 (d/'IngredientProductService.java').write_text('package com.onrender.smartnf.health; import java.util.*;import java.math.*;public class IngredientProductService {'+record+'}')
 (d/'Service.java').write_text('package org.springframework.stereotype; public @interface Service {}')
 (d/'PipelineCheck.java').write_text('''package com.onrender.smartnf.health;
import java.nio.file.*;import java.math.*;import java.time.*;
public class PipelineCheck {
 static void require(boolean value,String message){if(!value)throw new AssertionError(message);}
 public static void main(String[] args)throws Exception{
 var dir=Path.of(args[0]);var catalog=new ScheduledPriceCatalog(dir);
 var raw=catalog.search("우유",new BigDecimal("100"),"g");require(raw.size()==20,"20 raw offers visible");
 require(raw.stream().allMatch(x->x.priceVerified()),"source receipt projected to Java");
 require(catalog.search("우유",new BigDecimal("100"),"ml").stream().allMatch(x->x.referenceEstimated()!=null),"verified source has native-volume reference independently of Gemini review");
 require(raw.stream().allMatch(x->x.estimated()==null&&x.purchaseAmount()==null&&x.price().intValue()==2790&&x.unit().equals("ml")),"g/ml mismatch does not hide price or compute totals");
 require(catalog.search("우유",new BigDecimal("100"),"ml").stream().allMatch(x->x.estimated()==null),"pending not automatically budgeted");
 var live=new IngredientProductService.Product("1","NC다이노스 1A 우유 2.3L","홈플러스",new BigDecimal("5290"),null,"https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER","미확인",Instant.now().toString(),"CRAWL","HOMEPLUS","DISPLAY","표시가","","","");
 require(live.quantityUnit().equals("ml")&&live.packageAmount().intValue()==2300&&live.grams()==null,"real product constructor parses 2.3L without fake grams");
 require(raw.getFirst().verificationReason()!=null,"verification reason exposed");
 var q=ProductQuantity.parse("우유 1L×2");require(q.unit().equals("ml")&&q.amount().intValue()==2000,"L multipack");
 require(ProductQuantity.parse("양파 500g×3").amount().intValue()==1500,"g multipack");
 require(ProductQuantity.parse("양파 1kg").amount().intValue()==1000,"kg");
 require(ProductQuantity.parse("우유 100ml당 500원")==null,"unit-price denominator");
 var validated=catalog.search("검증우유",new BigDecimal("100"),"ml");require(validated.size()==1,"validated fixture");
 require(validated.getFirst().estimated().compareTo(new BigDecimal("155.00"))==0,"required amount price");
 require(validated.getFirst().purchaseAmount().intValue()==2790&&validated.getFirst().leftover().intValue()==1700,"pack price and leftover");
 require(catalog.search("오래된우유",BigDecimal.ONE,"ml").getFirst().stale(),"stale retained");
 require(catalog.search("오래된우유",BigDecimal.ONE,"ml").getFirst().estimated()==null,"stale excluded from estimate");
 require(catalog.search("없는상품",BigDecimal.ONE,"g").isEmpty(),"no unrelated offers");
 System.out.println("DB -> TSV -> Java: PASS (20 offers, pending/mismatched/stale prices, package arithmetic, g/kg/ml/L)");
 }}''')
 # Deliberate fixtures use the actual exporter, not a hand-written TSV.
 p=dict(products[0],url='https://mfront.homeplus.co.kr/item?itemNo=99&storeType=HYPER')
 # Valid same-food query with a distinct name keeps application relevance guards in place.
 for query,old in [('검증우유',False),('오래된우유',True)]:
  p=dict(products[0],name=query+' 900ML×2');stamp=(m.now()-dt.timedelta(days=2)).isoformat() if old else at
  m.store(c,query,'HOMEPLUS',[p],stamp);h=m.content_hash(query,p)
  c.execute('INSERT OR REPLACE INTO analysis VALUES(?,?,?,?)',(h,'VALIDATED','','fixture'))
  c.execute('INSERT OR REPLACE INTO measures VALUES(?,?,?,?)',(h,'1800','ml','900ML×2'))
 c.commit();m.export(c,d,at);c.close()
 subprocess.run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-d',str(d),*[str(p) for p in d.glob('*.java')]],check=True)
 subprocess.run(['java','-cp',str(d),'com.onrender.smartnf.health.PipelineCheck',str(d)],check=True)
