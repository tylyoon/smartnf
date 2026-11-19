package com.onrender.smartnf.health;
import java.math.BigDecimal;import java.nio.file.*;import java.util.*;
public class PriceReferenceTests {
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("reference-test");var service=new PriceReferenceService(dir);
  var onion=service.search("양파, 생것",new BigDecimal("480"));assert !onion.references().isEmpty();var first=onion.references().get(0);assert first.surveyGrams().compareTo(new BigDecimal("1500"))==0;assert first.estimated().compareTo(first.medianPrice().multiply(new BigDecimal("480")).divide(new BigDecimal("1500"),2,java.math.RoundingMode.HALF_UP))==0;
  assert service.search("우유",BigDecimal.ONE).references().stream().allMatch(r->r.estimated()==null);
  assert service.search("계란",BigDecimal.ONE).references().stream().allMatch(r->r.estimated()==null);
  assert !PriceReferenceService.matches("청정원 카레여왕 구운마늘&양파(108g)","양파");
  assert service.search("없는식재료",BigDecimal.ONE).references().isEmpty();
  try{service.search("양파",BigDecimal.ZERO);throw new AssertionError();}catch(HealthException expected){}
  String day=java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString();
  Files.writeString(dir.resolve("kamis.tsv"),"#SmartNF-ChamPrice-v1\n#updatedAt\t2026-11-16T00:00:00Z\n#source\thttps://www.kamis.or.kr/customer/reference/openapi_list.do\n#sha256\ttest-only\nname\tsurveyDate\tmedianPrice\tminPrice\tmaxPrice\tstoreCount\n양파(1kg) · 상품 · 전국 소매\t"+day+"\t3000\t3000\t3000\t1\n");
  var joined=service.search("양파",new BigDecimal("480"));assert joined.kamisAvailable();assert joined.references().stream().anyMatch(r->r.provider().equals("KAMIS")&&r.estimated().compareTo(new BigDecimal("1440.00"))==0);
  Files.writeString(dir.resolve("kamis.tsv"),"broken");assert !service.search("양파",BigDecimal.ONE).kamisAvailable();assert !service.search("양파",BigDecimal.ONE).references().isEmpty();
  assert !KakaoProductSnapshots.validUrl("https://shoppinghow.kakao.com.evil.example/go.daum?x=1");
  try{new PriceReferenceController(new CurrentHealthMember(),service).get(null,"양파",BigDecimal.ONE);throw new AssertionError();}catch(HealthException expected){assert expected.status()==401;}
  assert new ProductApiErrors().malformed().getStatusCode().value()==400;
  assert PriceReferenceService.matches("오뚜기 프레스코 스파게티(500g)","스파게티면");
  assert !PriceReferenceService.matches("청정원 스파게티 소스(500g)","스파게티면");
  assert !PriceReferenceService.matches("오뚜기 토마토 케찹(500g)","토마토");
  assert !PriceReferenceService.matches("백설 구운소금(500g)","소금");
  assert service.search("양파",BigDecimal.ONE).sourceErrors().contains("KAMIS");
  System.out.println("PriceReferenceTests: 16 checks PASS (KAMIS fixture, live credentials not used)");
 }
}
