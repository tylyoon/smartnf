package com.onrender.smartnf.health;
import java.math.*;import java.nio.file.*;import java.time.*;import java.util.*;import org.springframework.jdbc.core.*;import org.springframework.jdbc.datasource.*;import org.springframework.transaction.support.*;
public class RetailConnectionTests {
 static int n;static void ok(boolean b){if(!b)throw new AssertionError();n++;}
 static void fail(Runnable r){try{r.run();throw new AssertionError();}catch(HealthException expected){n++;}}
 public static void main(String[] args)throws Exception{
  var ds=new DriverManagerDataSource("jdbc:h2:mem:retail252;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var jdbc=new JdbcTemplate(ds);var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));jdbc.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");jdbc.update("INSERT INTO members VALUES(1),(2)");for(String f:args)for(String sql:Files.readString(Path.of(f)).split(";"))if(!sql.isBlank())jdbc.execute(sql);
  var lists=new ShoppingListService(jdbc);var store=new ShoppingProductService(jdbc,lists);
  for(String provider:List.of("DANAWA","ENURI","OASIS","EMART","LOTTE","HOMEPLUS")){
   String url=switch(provider){case "DANAWA"->"https://prod.danawa.com/info/?pcode=123&keyword=x";case "ENURI"->"https://www.enuri.com/detail.jsp?modelno=123";case "HOMEPLUS"->"https://mfront.homeplus.co.kr/item?itemNo=123&storeType=HYPER";case "EMART"->"https://emart.ssg.com/item/itemView.ssg?itemId=123&siteNo=6001";case "LOTTE"->"https://lottemartzetta.com/products/OS123/details";default->"https://www.oasis.co.kr/product/detail/123?categoryId=";};
   UUID id=UUID.randomUUID();var day=LocalDate.now();tx.execute(s->lists.save(1,new ShoppingListModels.Save(id,UUID.randomUUID(),0L,day,day,day,"WEEK",List.of(new ShoppingListModels.Item("onion","양파",new BigDecimal("480"))))));
   var raw=new IngredientProductService.Product("raw","검증용 양파 1kg",provider,new BigDecimal("3000"),null,url,"배송 미확인",Instant.now().toString(),"CRAWL",provider,"DISPLAY","옵션 확인","","","");
   var p=KakaoProductSnapshots.issue(1,List.of(raw)).getFirst();ok(p.id().startsWith("k:"));
   var body=new ShoppingProductService.Save(id,0,1,0,UUID.randomUUID(),p.id(),p.name(),p.merchant(),new BigDecimal("1000"),p.price(),1,p.url(),p.checkedAt(),true);
   var saved=tx.execute(s->store.save(1,body));ok(saved.sourceDetails().contains(provider));ok(saved.sourceDetails().contains("옵션 확인"));ok(new ShoppingProductService(jdbc,lists).get(1,id).getFirst().url().equals(url));ok(lists.get(1,id).items().getFirst().grams().intValue()==480);
   fail(()->KakaoProductSnapshots.require(2,body));fail(()->store.get(2,id));
   var bad=new ShoppingProductService.Save(id,0,1,0,UUID.randomUUID(),p.id(),p.name(),p.merchant(),new BigDecimal("1000"),BigDecimal.ONE,1,p.url(),p.checkedAt(),true);fail(()->KakaoProductSnapshots.require(1,bad));
   ok(!KakaoProductSnapshots.validLiveUrl(provider,url.replace("https://","https://attacker@")));
  }
  ok(!KakaoProductSnapshots.validAnyLiveUrl("https://www.oasis.co.kr.evil.test/product/detail/123"));
  fail(()->new IngredientProductService().search("양파","SSG"));
  System.out.println("RetailConnectionTests: "+n+" PASS; 6 providers receipt, isolation, H2 save/read, provenance, tamper rejection");
 }
}
