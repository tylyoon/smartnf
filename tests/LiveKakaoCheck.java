package com.onrender.smartnf.health;
import java.math.*;import java.nio.file.*;import java.time.*;import java.util.*;import org.springframework.jdbc.core.*;import org.springframework.jdbc.datasource.*;import org.springframework.transaction.support.*;
/** Explicit live check; only this disposable H2 database is written. */
public class LiveKakaoCheck {
 public static void main(String[] args)throws Exception{
  var ds=new DriverManagerDataSource("jdbc:h2:mem:liveKakao;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var jdbc=new JdbcTemplate(ds);var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));jdbc.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");jdbc.update("INSERT INTO members VALUES(1)");for(String file:args)for(String sql:Files.readString(Path.of(file)).split(";"))if(!sql.isBlank())jdbc.execute(sql);
  var auth=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(new com.onrender.smartnf.member.MemberPrincipal(new com.onrender.smartnf.member.MemberRepository.LoginMember(1,"test@example.com","hash","test","ACTIVE"),List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))),"",List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));
  var controller=new IngredientProductController(new CurrentHealthMember(),new IngredientProductService(),new CollectedProductService(jdbc));var result=controller.search(auth,"양파").getBody();var p=result.products().stream().filter(x->"KAKAO".equals(x.provider())&&x.grams()!=null).findFirst().orElseThrow();
  var lists=new ShoppingListService(jdbc);UUID id=UUID.randomUUID();LocalDate d=LocalDate.of(2026,11,16);tx.execute(s->lists.save(1,new ShoppingListModels.Save(id,UUID.randomUUID(),0L,d,d,d,"WEEK",List.of(new ShoppingListModels.Item("onion","양파",new BigDecimal("480"))))));
  var store=new ShoppingProductService(jdbc,lists);var s=new ShoppingProductService.Save(id,0,1,0,UUID.randomUUID(),p.id(),p.name(),p.merchant(),p.grams(),p.price(),1,p.url(),p.checkedAt(),true);tx.execute(status->store.save(1,s));var restored=new ShoppingProductService(jdbc,lists).get(1,id).getFirst();
  if(!restored.productId().equals(p.id())||restored.price().compareTo(p.price())!=0||!restored.sourceDetails().contains("KAKAO")||lists.get(1,id).items().getFirst().grams().intValue()!=480)throw new AssertionError();
  System.out.println("LIVE PASS: authenticated controller -> Kakao public JSON ("+result.products().size()+" products) -> member receipt -> selected item H2 save -> fresh service read-back; required 480g unchanged");
 }
}
