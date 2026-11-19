package com.onrender.smartnf.health;
import java.math.*;import java.nio.file.*;import java.time.*;import java.util.*;import org.springframework.jdbc.core.*;import org.springframework.jdbc.datasource.*;import org.springframework.transaction.support.*;
public class KakaoChoiceTests {
 static int n;static void ok(boolean b){if(!b)throw new AssertionError();n++;}static void fail(Runnable r){try{r.run();throw new AssertionError();}catch(HealthException expected){n++;}}
 static ShoppingProductService.Save body(UUID list,IngredientProductService.Product p,BigDecimal price){return new ShoppingProductService.Save(list,0,1,0,UUID.randomUUID(),p.id(),p.name(),p.merchant(),new BigDecimal("1000"),price,2,p.url(),p.checkedAt(),true);}
 public static void main(String[] args)throws Exception{
  var ds=new DriverManagerDataSource("jdbc:h2:mem:kakao;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var jdbc=new JdbcTemplate(ds);var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));jdbc.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");jdbc.update("INSERT INTO members VALUES(1),(2)");for(String file:args)for(String sql:Files.readString(Path.of(file)).split(";"))if(!sql.isBlank())jdbc.execute(sql);
  var lists=new ShoppingListService(jdbc);var store=new ShoppingProductService(jdbc,lists);UUID list=UUID.randomUUID();LocalDate d=LocalDate.of(2026,11,16);tx.execute(s->lists.save(1,new ShoppingListModels.Save(list,UUID.randomUUID(),0L,d,d,d,"WEEK",List.of(new ShoppingListModels.Item("onion","양파",new BigDecimal("480"))))));
  var raw=new IngredientProductService.Product("KAKAO:raw","양파 1kg","판매처",new BigDecimal("4500"),new BigDecimal("1000"),"https://shoppinghow.kakao.com/go.daum?url="+"a".repeat(700),"배송비 확인 필요",Instant.now().toString(),"API","KAKAO","DISPLAY","쿠폰 가능","","","");
  var p=KakaoProductSnapshots.issue(1,List.of(raw)).getFirst();ok(p.id().startsWith("k:"));var input=body(list,p,p.price());var saved=tx.execute(s->store.save(1,input));ok(saved.sourceDetails().contains("KAKAO"));ok(saved.sourceDetails().contains("판매 표시가"));ok(saved.url().length()>500);ok(lists.get(1,list).items().getFirst().grams().intValue()==480);
  ok(new ShoppingProductService(jdbc,lists).get(1,list).getFirst().packs()==2);ok(tx.execute(s->store.save(1,input)).revision()==1);fail(()->store.get(2,list));fail(()->KakaoProductSnapshots.require(2,input));
  fail(()->store.save(1,body(list,p,new BigDecimal("1"))));fail(()->store.save(1,body(list,raw,raw.price())));ok(!KakaoProductSnapshots.validUrl("https://shoppinghow.kakao.com@evil.example/go.daum?x=1"));
  System.out.println("KakaoChoiceTests: "+n+" PASS; long URL, member receipt, tamper rejection, DB read-back, retry, need unchanged");
 }
}
