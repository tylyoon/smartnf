package com.onrender.smartnf.health;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.net.URLDecoder;import java.math.BigDecimal;import java.time.Instant;import java.util.*;import java.util.concurrent.TimeUnit;
/** On-demand lookup. Search receipts are bound to the authenticated member by the controller. */
public final class KakaoProductSearch {
 public IngredientProductService.Result search(String query){
  if("false".equalsIgnoreCase(System.getenv("SMARTNF_KAKAO_LOOKUP_ENABLED")))return new IngredientProductService.Result("KAKAO",List.of(),"외부 상품 조회가 운영 설정에서 꺼져 있습니다. 판매 사이트 연결을 이용하세요.");
  Path output=null;Process process=null;
  try{
   output=Files.createTempFile("smartnf-products-",".tsv");
   process=new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON","python"),"tools/price_sources/kakao_shopping.py",query).redirectOutput(output.toFile()).redirectError(ProcessBuilder.Redirect.DISCARD).start();
   if(!process.waitFor(25,TimeUnit.SECONDS)){process.destroyForcibly();throw new Exception();}
   if(process.exitValue()!=0||Files.size(output)>1_000_000)throw new Exception();
   List<IngredientProductService.Product> products=new ArrayList<>();
   for(String row:Files.readAllLines(output,StandardCharsets.UTF_8)){
    if(row.isBlank())continue;String[] f=row.split("\t",-1);if(f.length!=8)throw new Exception();for(int i=0;i<f.length;i++)f[i]=URLDecoder.decode(f[i],StandardCharsets.UTF_8);
    BigDecimal price=new BigDecimal(f[4]);if(price.signum()<=0||price.compareTo(BigDecimal.valueOf(100000000))>0||!f[5].startsWith("https://shoppinghow.kakao.com/go.daum?"))throw new Exception();
    String name=f[1]+(f[2].isBlank()?"":" · "+f[2]);String delivery=f[6].matches("[0-9]+")?f[6]+"원 표시 · 합배송·지역 조건 확인":"미확인 · 무료배송으로 간주하지 않습니다";
    products.add(new IngredientProductService.Product("KAKAO:"+f[0]+":"+products.size(),name,f[3],price,IngredientProductService.weight(name),f[5],delivery,Instant.now().toString(),"API","KAKAO","DISPLAY","판매 표시가 · 쿠폰/카드/옵션 가능 · 결제금액 아님","","",""));
   }
   return new IngredientProductService.Result("KAKAO",List.copyOf(products),"쇼핑하우 판매 표시가격입니다. 쿠폰·구성·배송비를 판매처에서 확인하세요. 선택한 상품만 본인의 장보기 계정에 저장됩니다.");
  }catch(InterruptedException e){Thread.currentThread().interrupt();throw new HealthException(503,"상품 조회가 중단됐습니다.");}catch(Exception e){throw new HealthException(502,"외부 상품을 확인하지 못했습니다. 아래 판매 사이트 연결을 이용하세요.");}
  finally{if(process!=null&&process.isAlive())process.destroyForcibly();if(output!=null)try{Files.deleteIfExists(output);}catch(Exception ignored){}}
 }
}
