package com.onrender.smartnf.health;
import java.nio.file.*;import java.math.*;import java.time.*;import java.net.URLEncoder;import java.nio.charset.StandardCharsets;import java.util.*;
public class ProcessedPriceTests {
 static int n;static void ok(boolean b){if(!b)throw new AssertionError("check "+n);n++;}
 static String row(String query,String name,String price,String weight){return String.join("\t",List.of(query,"OASIS",name,"오아시스",price,"https://www.oasis.co.kr/product/detail/1","일반 판매가","배송 미확인",Instant.now().toString(),"VALIDATED",weight,"검증").stream().map(x->URLEncoder.encode(x,StandardCharsets.UTF_8)).toList());}
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("processed-prices");var prices=new PriceReferenceService(dir);
  ok(!prices.search("버터",new BigDecimal("20")).references().isEmpty());ok(!prices.search("베이컨",new BigDecimal("50")).references().isEmpty());ok(!prices.search("토마토 소스",new BigDecimal("200")).references().isEmpty());
  ok(!PriceReferenceService.matches("몽쉘 생크림케이크(408g)","생크림"));ok(!PriceReferenceService.matches("바프 허니버터아몬드(120g)","버터"));ok(!PriceReferenceService.matches("버터롤 클래식(21개입)","버터"));ok(!PriceReferenceService.matches("쇠고기 카레(200g)","소고기"));ok(!PriceReferenceService.matches("양조간장 501(500ml)","국간장"));ok(!PriceReferenceService.matches("해표 꽃소금(1kg)","소금"));
  var beef=prices.search("소고기",new BigDecimal("275"));ok(!beef.references().isEmpty());ok(beef.references().stream().allMatch(r->r.estimated()==null&&!r.matchNote().isBlank()));
  ok(prices.search("쇠고기 등심",new BigDecimal("100")).references().stream().anyMatch(r->r.estimated()!=null));
  var milk=prices.search("우유",new BigDecimal("100"));ok(!milk.references().isEmpty());ok(milk.references().stream().allMatch(r->r.estimated()==null));
  var market=new ScheduledPriceCatalog(dir);Path file=dir.resolve("scheduled.tsv");Files.writeString(file,"#SmartNF-ScheduledPrices-v1\n"+Instant.now()+"\n"+row("버터","버터 100g","3000","100"));
  var q=market.search("버터",new BigDecimal("10")).getFirst();ok(q.estimated().intValue()==300);ok(q.packs()==1&&q.purchaseAmount().intValue()==3000&&q.leftover().intValue()==90);
  q=market.search("버터",new BigDecimal("110")).getFirst();ok(q.packs()==2&&q.purchaseAmount().intValue()==6000&&q.leftover().intValue()==90);
  Files.writeString(file,"#SmartNF-ScheduledPrices-v1\n"+Instant.now()+"\n"+row("버터","버터 500g","15000","500"));q=market.search("버터",new BigDecimal("10")).getFirst();ok(q.estimated().intValue()==300&&q.purchaseAmount().intValue()==15000&&q.leftover().intValue()==490);
  System.out.println("ProcessedPriceTests: "+n+" PASS; real butter/bacon/ketchup snapshots, wrong food exclusions, unqualified beef, unit price vs actual pack");
 }
}
