package com.onrender.smartnf.health;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.net.URLDecoder;import java.math.BigDecimal;import java.util.*;import java.util.concurrent.TimeUnit;
/** Single on-demand provider lookup. No login, polling, or retries on blocks. */
public final class RetailProductSearch {
 public IngredientProductService.Result search(String provider,String query){
  if(!Set.of("DANAWA","ENURI","OASIS","EMART","LOTTE","HOMEPLUS").contains(provider))throw HealthException.invalid();
  Path output=null;Process process=null;
  try{
   output=Files.createTempFile("smartnf-retail-",".tsv");
   process=new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON","python"),"tools/price_sources/retail_search.py",provider,query).redirectOutput(output.toFile()).redirectError(ProcessBuilder.Redirect.DISCARD).start();
   if(!process.waitFor(22,TimeUnit.SECONDS)){process.destroyForcibly();throw new Exception();}
   if(process.exitValue()!=0||Files.size(output)>1_000_000)throw new Exception();
   var products=new ArrayList<IngredientProductService.Product>();
   for(String row:Files.readAllLines(output,StandardCharsets.UTF_8)){
    if(row.isBlank())continue;String[] f=row.split("\t",-1);if(f.length!=8)throw new Exception();for(int i=0;i<f.length;i++)f[i]=URLDecoder.decode(f[i],StandardCharsets.UTF_8);
    BigDecimal price=new BigDecimal(f[3]);if(price.signum()<=0||price.compareTo(BigDecimal.valueOf(100000000))>0||!KakaoProductSnapshots.validLiveUrl(provider,f[4]))throw new Exception();
    products.add(new IngredientProductService.Product(provider+":"+products.size(),f[1],f[2],price,Set.of("DANAWA","ENURI").contains(provider)?null:IngredientProductService.weight(f[1]),f[4],f[5],f[6],"CRAWL",provider,"DISPLAY",f[7],"","",""));
    if(products.size()>=20)break;
   }
   return new IngredientProductService.Result(provider,List.copyOf(products),provider+" 검색 표시가격입니다. 비교 사이트 가격은 최종 판매처 결제금액이 아닙니다. 포장량·배송비·쿠폰·옵션을 확인한 상품만 선택하세요.");
  }catch(InterruptedException e){Thread.currentThread().interrupt();throw new HealthException(503,"상품 조회가 중단됐습니다.");}
  catch(Exception e){throw new HealthException(502,provider+" 가격 조회 실패·접근 제한·응답 변경. 해당 사이트에서 확인하세요.");}
  finally{if(process!=null&&process.isAlive())process.destroyForcibly();if(output!=null)try{Files.deleteIfExists(output);}catch(Exception ignored){}}
 }
}
