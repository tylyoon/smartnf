package com.onrender.smartnf.health;

import java.io.*;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import org.springframework.stereotype.Service;

/** Survey prices only. Never changes a shopping list or assumes ml/egg == grams. */
@Service public class PriceReferenceService {
 public record Reference(String provider,String name,String surveyDate,BigDecimal medianPrice,
   BigDecimal minPrice,BigDecimal maxPrice,int storeCount,BigDecimal surveyGrams,BigDecimal estimated,
   String sourceUrl,String updatedAt,boolean oldData,String matchNote,String unit,BigDecimal surveyAmount) {}
 public record Result(List<Reference> references,String message,boolean kamisAvailable,List<String> sourceErrors,List<ScheduledPriceCatalog.Quote> market,String searchName) {}
 private static final String CHAM="https://www.data.go.kr/data/15083256/fileData.do";
 private final Path directory;
 public PriceReferenceService(){this(Path.of(System.getenv().getOrDefault("SMARTNF_PRICE_DATA_DIR","data/price-reference")));}
 PriceReferenceService(Path directory){this.directory=directory;}
 static String keyword(String q){
  q=q==null?"":q.strip();if(q.isBlank()||q.length()>100||q.chars().anyMatch(Character::isISOControl))throw HealthException.invalid();
  return q.split(",",2)[0].strip();
 }
 public Result search(String query,BigDecimal grams){return search(query,grams,"g");}
 public Result search(String query,BigDecimal grams,String unit){
  if(!Set.of("g","ml","ea","pack","bag","bottle").contains(unit))throw HealthException.invalid();
  String q=keyword(query);if(grams==null||grams.signum()<=0||grams.compareTo(BigDecimal.valueOf(10_000_000))>0)throw HealthException.invalid();
  Set<String> identities=aiMatches(query);List<Reference> all=new ArrayList<>();List<String> errors=new ArrayList<>();boolean kamis=false;
  for(String provider:List.of("CHAMPRICE","KAMIS")){
   try(InputStream stream=open(provider)){
    if(stream==null)continue;
    List<String> lines=new BufferedReader(new InputStreamReader(stream,StandardCharsets.UTF_8)).lines().toList();
    if(lines.size()<6||!lines.get(0).equals("#SmartNF-ChamPrice-v1"))throw new IOException("format");
    String updated=lines.get(1).split("\t",2)[1],url=lines.get(2).split("\t",2)[1];
    if(!url.startsWith("https://www.data.go.kr/")&&!url.startsWith("https://www.kamis.or.kr/"))throw new IOException("source");
    List<Reference> source=new ArrayList<>();
    for(String line:lines.subList(5,lines.size())){
     if(line.isBlank())continue;String[] f=line.split("\t",-1);if(f.length!=6)throw new IOException("row");
     LocalDate day=LocalDate.parse(f[1]);BigDecimal price=new BigDecimal(f[2]),low=new BigDecimal(f[3]),high=new BigDecimal(f[4]);int stores=Integer.parseInt(f[5]);
     if(price.signum()<=0||price.compareTo(new BigDecimal("100000000"))>0||low.signum()<=0||low.compareTo(price)>0||high.compareTo(price)<0||stores<1||day.isAfter(LocalDate.now(ZoneId.of("Asia/Seoul"))))throw new IOException("value");
     boolean ai=identities.contains(provider+"\n"+f[0])&&!Boolean.FALSE.equals(IngredientPricePolicy.compatible(query,f[0]));if(!matches(f[0],query)&&!ai)continue;ProductQuantity quantity=ProductQuantity.quantities(f[0]).stream().filter(qty->qty.unit().equals(unit)).findFirst().orElse(ProductQuantity.parse(f[0]));BigDecimal weight=quantity==null?null:quantity.amount();
     // Only an explicit mass denominator is convertible from this application's grams.
     String note=IngredientPricePolicy.specification(query);if(note.isBlank()&&ai)note="Gemini 재료명 매칭·원문 규격 검증";boolean blocked=!IngredientPricePolicy.specification(query).isBlank();BigDecimal estimate=weight==null||blocked||!quantity.unit().equals(unit)?null:price.multiply(grams).divide(weight,2,RoundingMode.HALF_UP);
     source.add(new Reference(provider,f[0],f[1],price,low,high,stores,quantity!=null&&quantity.unit().equals("g")?weight:null,estimate,url,updated,day.isBefore(LocalDate.now(ZoneId.of("Asia/Seoul")).minusDays(provider.equals("KAMIS")?7:45)),note,quantity==null?"":quantity.unit(),weight));
    }
    if(provider.equals("KAMIS"))kamis=true;all.addAll(source);
   }catch(Exception e){errors.add(provider);}
  }
  all.sort(Comparator.comparing(Reference::surveyDate).reversed().thenComparing(Reference::name));
  return new Result(all.stream().limit(15).toList(),all.isEmpty()?"일치하는 조사 가격 자료가 없습니다. 판매처에서 확인하세요.":"참가격은 판매점 중앙값, KAMIS는 소매 조사값(공공데이터포털 자료는 시장별 중앙값)입니다. 필요량의 참고 예산이며 실제 구매금액이 아닙니다.",kamis,List.copyOf(errors),List.of(),IngredientPricePolicy.searchName(query));
 }
 private Set<String> aiMatches(String query){
  var matches=new HashSet<String>();Path file=directory.resolve("reference-matches.tsv");try{if(!Files.isRegularFile(file)||Files.size(file)>2_000_000)return matches;var lines=Files.readAllLines(file,StandardCharsets.UTF_8);if(lines.size()<2||!lines.getFirst().equals("#SmartNF-ReferenceMatches-v1"))return matches;
   if(Instant.parse(lines.get(1)).isBefore(Instant.now().minusSeconds(86400)))return matches;
   for(String line:lines.subList(2,lines.size())){var f=line.split("\t",-1);if(f.length!=5)continue;for(int i=0;i<f.length;i++)f[i]=java.net.URLDecoder.decode(f[i],StandardCharsets.UTF_8);if(f[0].equals(query)&&f[3].equals("VALIDATED"))matches.add(f[1]+"\n"+f[2]);}
  }catch(Exception ignored){}return matches;
 }
 private InputStream open(String provider)throws IOException{
  String file=provider.equals("KAMIS")?"kamis.tsv":"champrice.tsv";Path local=directory.resolve(file);
  if(Files.isRegularFile(local)){if(Files.size(local)>2_000_000)throw new IOException("size");return Files.newInputStream(local);}
  return provider.equals("CHAMPRICE")?getClass().getResourceAsStream("/price-reference/champrice.tsv"):null;
 }
 // Curated whole category names: never a free substring search for raw ingredients.
 static boolean matches(String name,String q){
  if((q.split(",",2)[0].strip().matches("양파|마늘|토마토")||q.contains("생것"))&&Pattern.compile("소스|분말|카레|커리|가루|즙|볶음|구운|튀김|장아찌|건조|페이스트").matcher(name).find())return false;
  Boolean policy=IngredientPricePolicy.compatible(q,name);if(policy!=null)return policy;q=keyword(q);
  String base=name.split("\\(",2)[0].strip();
  if(q.equals("백미")||q.equals("쌀"))return name.contains("쌀(")&&!name.contains("찹쌀");
  if(q.equals("계란")||q.equals("달걀"))return base.endsWith("계란")||base.endsWith("달걀")||base.endsWith("유정란");
  if(q.equals("스파게티면")||q.equals("스파게티"))return base.endsWith("스파게티");
  if(q.equals("설탕"))return base.endsWith("하얀설탕")||base.equals("설탕");
  if(q.equals("소금"))return base.equals("소금"); // 맛소금/꽃소금 are not refined salt.
  if(q.equals("고추장")||q.equals("된장")||q.equals("우유"))return base.equals(q)||base.endsWith(" "+q);
  return name.startsWith(q+"(")||name.startsWith(q+" ")||name.equals(q)||Pattern.compile("(?:^|\\s)[^\\s]*"+Pattern.quote(q)+"(?:\\s*(?:중력(?:분|다목적용)?|강력분?|박력분?|다목적용|일반|오리지널))*$").matcher(base).find();
 }
}
