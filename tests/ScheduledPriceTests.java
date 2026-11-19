package com.onrender.smartnf.health;
import java.nio.file.*;import java.net.URLEncoder;import java.nio.charset.StandardCharsets;import java.time.*;import java.math.*;import java.util.*;
public class ScheduledPriceTests {
 static String row(String state,String at,String url){return String.join("\t",List.of("양파, 생것","OASIS","양파 500g x 3봉","오아시스","3000",url,"일반 판매가","배송비 미확인",at,state,"1500","검증").stream().map(s->URLEncoder.encode(s,StandardCharsets.UTF_8)).toList());}
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("scheduled-test");var service=new ScheduledPriceCatalog(dir);String url="https://www.oasis.co.kr/product/detail/1";
  String text="#SmartNF-ScheduledPrices-v1\n"+Instant.now()+"\n"+row("VALIDATED",Instant.now().toString(),url)+"\n"+row("REVIEW",Instant.now().toString(),url)+"\n"+row("VALIDATED",Instant.now().minusSeconds(90000).toString(),url)+"\n"+row("VALIDATED",Instant.now().toString(),"https://evil.example/x");Files.writeString(dir.resolve("scheduled.tsv"),text);
  var result=service.search("양파, 생것",new BigDecimal("480"));assert result.size()==1;assert result.getFirst().estimated().compareTo(new BigDecimal("960.00"))==0;assert result.getFirst().price().intValue()==3000;assert service.search("마늘",BigDecimal.ONE).isEmpty();
  var controller=new PriceReferenceController(new CurrentHealthMember(),new PriceReferenceService(dir),service);try{controller.status(null);throw new AssertionError();}catch(HealthException expected){assert expected.status()==401;}
  Files.writeString(dir.resolve("scheduled.tsv"),"broken");assert service.search("양파, 생것",BigDecimal.ONE).isEmpty();
  System.out.println("ScheduledPriceTests: 7 PASS; validated/fresh/exact-food/host filtering, 480g share vs 1500g package, anonymous status denied");
 }
}
