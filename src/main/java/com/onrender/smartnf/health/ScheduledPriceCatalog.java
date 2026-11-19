package com.onrender.smartnf.health;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.net.URLDecoder;import java.time.*;import java.math.*;import java.util.*;import org.springframework.stereotype.Service;
@Service public class ScheduledPriceCatalog {
 public record Quote(String provider,String name,String merchant,BigDecimal price,BigDecimal surveyGrams,BigDecimal estimated,String checkedAt,String sourceUrl,String conditions,Integer packs,BigDecimal purchaseAmount,BigDecimal leftover,String unit,BigDecimal surveyAmount,String verificationStatus,String comparisonReason,boolean stale,BigDecimal unitPrice,String verificationReason,boolean priceVerified,BigDecimal referenceEstimated){}
 private final Path directory;
 public ScheduledPriceCatalog(){this(Path.of(System.getenv().getOrDefault("SMARTNF_PRICE_DATA_DIR","data/price-reference")));}
 ScheduledPriceCatalog(Path directory){this.directory=directory;}
 public List<Quote> search(String query,BigDecimal grams){return search(query,grams,"g");}
 public List<Quote> search(String query,BigDecimal needed,String unit){
  var result=new ArrayList<Quote>();Path file=directory.resolve("scheduled.tsv");
  try{
   if(!Files.isRegularFile(file)||Files.size(file)>10_000_000)return List.of();var lines=Files.readAllLines(file,StandardCharsets.UTF_8);
   if(lines.size()<2||!Set.of("#SmartNF-ScheduledPrices-v1","#SmartNF-ScheduledPrices-v2").contains(lines.getFirst()))return List.of();
   var receipts=new HashSet<String>();Path checks=directory.resolve("verified-sales.tsv");
   try{if(Files.isRegularFile(checks)&&Files.size(checks)<2000000){var verified=Files.readAllLines(checks,StandardCharsets.UTF_8);if(verified.size()>1&&verified.getFirst().equals("#SmartNF-VerifiedSalePrices-v1"))for(String row:verified.subList(2,verified.size())){var f=row.split("\\t",-1);if(f.length==4){for(int i=0;i<4;i++)f[i]=URLDecoder.decode(f[i],StandardCharsets.UTF_8);receipts.add(String.join("\n",f));}}}}catch(Exception invalidChecks){receipts.clear();}
   var seen=new HashSet<String>();
   for(String line:lines.subList(2,lines.size())){
    try{
     String[] f=line.split("\t",-1);if(f.length!=12&&f.length!=14)continue;for(int i=0;i<f.length;i++)f[i]=URLDecoder.decode(f[i],StandardCharsets.UTF_8);
     if(!f[0].equals(query)||!KakaoProductSnapshots.validLiveUrl(f[1],f[5]))continue;
     // Survey entries are budget evidence, never sale packages.
     Instant checked=Instant.parse(f[8]);if(checked.isAfter(Instant.now().plusSeconds(300)))continue;
     BigDecimal price=new BigDecimal(f[4]);if(price.signum()<=0||price.compareTo(new BigDecimal("100000000"))>0)continue;
     boolean stale=checked.isBefore(Instant.now().minusSeconds(86400));
     var parsed=ProductQuantity.quantities(f[2]).stream().filter(qty->qty.unit().equals(unit)).findFirst().orElse(ProductQuantity.parse(f[2]));BigDecimal amount=parsed==null?null:parsed.amount();String recordUnit=parsed==null?"unknown":parsed.unit();
     boolean validated=f[9].equals("VALIDATED");
     if(validated){
      String encodedUnit=f.length==14?f[13]:"g",encodedAmount=f.length==14?f[12]:f[10];
      try{validated=parsed!=null&&encodedUnit.equals(recordUnit)&&new BigDecimal(encodedAmount).compareTo(amount)==0;}catch(Exception invalid){validated=false;}
     }
     String reason=stale?"오래된 가격 · 재조회 필요":!recordUnit.equals(unit)?(amount==null?"판매포장 규격 미확인":"필요량과 상품 단위 불일치 · 서로 다른 단위 자동환산 안 함"):!validated?(f[11].isBlank()?"동일식품·가격 조건 검증 대기":f[11]):"";
     boolean priceVerified=!stale&&receipts.contains(String.join("\n",f[0],f[1],f[5],f[8]));
     BigDecimal referenceEstimated=(validated||priceVerified)&&!stale&&amount!=null&&recordUnit.equals(unit)&&needed!=null&&needed.signum()>0?price.multiply(needed).divide(amount,2,RoundingMode.HALF_UP):null;
     boolean comparable=reason.isEmpty()&&needed!=null&&needed.signum()>0;
     Integer packs=comparable?needed.divide(amount,0,RoundingMode.CEILING).intValueExact():null;
     BigDecimal estimated=comparable?price.multiply(needed).divide(amount,2,RoundingMode.HALF_UP):null;
     BigDecimal per=amount==null?null:price.multiply(BigDecimal.valueOf(java.util.Set.of("g","ml").contains(recordUnit)?100:1)).divide(amount,2,RoundingMode.HALF_UP);
     if(!seen.add(f[1]+"|"+f[5]))continue;
     result.add(new Quote(f[1],f[2],f[3],price,recordUnit.equals("g")?amount:null,estimated,f[8],f[5],f[6]+" · 배송: "+f[7],packs,packs==null?null:price.multiply(BigDecimal.valueOf(packs)),packs==null?null:amount.multiply(BigDecimal.valueOf(packs)).subtract(needed),recordUnit,amount,validated?"VALIDATED":f[9].equals("ERROR")?"ERROR":f[9].equals("REVIEW")?"REVIEW":"PENDING",reason,stale,per,f[11].isBlank()?(validated?"동일식품·원문 규격 검증 완료":"분석 결과 또는 가격 조건 확인 필요"):f[11],priceVerified,referenceEstimated));
    }catch(Exception invalidRow){/* One corrupt record must not hide other sellers. */}
   }
  }catch(Exception e){return List.of();}
  result.sort(Comparator.comparing(Quote::checkedAt).reversed().thenComparing(Quote::provider).thenComparing(Quote::name));return List.copyOf(result);
 }
 public String status(){try{Path p=directory.resolve("scheduled-status.json");if(Files.isRegularFile(p)&&Files.size(p)<200_000)return Files.readString(p,StandardCharsets.UTF_8);}catch(Exception ignored){}return "{\"message\":\"정기 수집 실행 기록 없음\"}";}
}
