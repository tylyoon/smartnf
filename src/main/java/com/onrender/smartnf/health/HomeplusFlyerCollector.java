package com.onrender.smartnf.health;

import java.io.*;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import org.springframework.stereotype.Service;

/** Fixed public source only. Drafts are never auto-approved. */
@Service public class HomeplusFlyerCollector {
 public record Fetch(int status,String body){}
 public interface Transport {Fetch get(URI uri)throws Exception;}
 public static class Unavailable extends RuntimeException {
  public final String state;
  public Unavailable(String state,String message){super(message);this.state=state;}
 }
 private static final String ROOT="https://m.my.homeplus.co.kr";
 private static final String UA="SmartNFProductCollector/1.0";
 private final Transport transport;
 private final boolean permitted;
 public HomeplusFlyerCollector(){this("true".equalsIgnoreCase(System.getenv("SMARTNF_HOMEPLUS_COLLECTION_ALLOWED")),new Network());}
 public HomeplusFlyerCollector(boolean permitted,Transport transport){this.permitted=permitted;this.transport=transport;}
 public boolean configured(){return permitted;}
 private static class Network implements Transport {
  private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
  public Fetch get(URI uri)throws Exception{
   if(!Set.of(ROOT+"/robots.txt",ROOT+"/leaflet").contains(uri.toString()))throw new IllegalArgumentException();
   var response=client.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15)).header("User-Agent",UA).GET().build(),HttpResponse.BodyHandlers.ofInputStream());
   try(var in=response.body()){byte[] bytes=in.readNBytes(1_000_001);if(bytes.length>1_000_000)throw new IOException("body limit");return new Fetch(response.statusCode(),new String(bytes,java.nio.charset.StandardCharsets.UTF_8));}
  }
 }
 public List<CollectedProductService.Offer> collect(String query){
  if(!permitted)throw new Unavailable("NEEDS_CONFIGURATION","홈플러스 수집·재사용 허용 확인이 완료되지 않았습니다. 운영자 설정 전에는 자동 수집하지 않습니다. 기존 저장 상품은 계속 사용할 수 있습니다.");
  try{
   Fetch robots=transport.get(URI.create(ROOT+"/robots.txt"));
   if(robots.status()!=200)throw new Unavailable("POLICY_UNAVAILABLE","홈플러스 수집 정책 확인 응답 오류 (HTTP "+robots.status()+"). 자동 수집을 중단했습니다. 저장된 상품은 유지됩니다.");
   if(!robotsAllow(robots.body()))throw new Unavailable("POLICY_BLOCKED","홈플러스 수집 정책이 불명확하거나 전단 수집을 허용하지 않습니다. 자동 수집을 중단했습니다.");
   Fetch page=transport.get(URI.create(ROOT+"/leaflet"));
   if(page.status()!=200)throw new Unavailable("SOURCE_UNAVAILABLE","홈플러스 전단 응답 오류 (HTTP "+page.status()+"). 잠시 후 다시 시도하세요.");
   return parse(page.body(),query,Instant.now().toString());
  }catch(Unavailable e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new Unavailable("FAILED","수집이 중단됐습니다. 다시 시도해 주세요.");}catch(Exception e){throw new Unavailable("FAILED","홈플러스 연결·응답을 확인하지 못했습니다. 저장된 상품은 유지됩니다.");}
 }
 // Deliberately conservative: any wildcard deny stops collection; no bot impersonation.
 public static boolean robotsAllow(String raw){
  if(raw==null||raw.length()>100000||raw.toLowerCase(Locale.ROOT).contains("<html"))return false;
  boolean seen=false,group=false,denied=false,explicitAllow=false;
  for(String line:raw.split("\\R")){
   String s=line.split("#",2)[0].strip().toLowerCase(Locale.ROOT);
   if(s.startsWith("user-agent:")){String agent=s.substring(11).strip();group=agent.equals("*")||agent.equals("smartnfproductcollector")||agent.equals("smartnfproductcollector/1.0");seen|=group;}
   else if(group&&s.startsWith("disallow:")){String path=s.substring(9).strip();if(!path.isEmpty()&&(path.equals("/")||"/leaflet".startsWith(path)||path.contains("*")||path.contains("$")))denied=true;}
   else if(group&&s.startsWith("allow:")){String path=s.substring(6).strip();if(path.equals("/")||path.equals("/leaflet"))explicitAllow=true;}
  }return seen&&explicitAllow&&!denied;
 }
 private static String first(String html,String regex){Matcher m=Pattern.compile(regex,Pattern.CASE_INSENSITIVE|Pattern.DOTALL).matcher(html);return m.find()?m.group(1):"";}
 private static String text(String html){return html.replaceAll("(?is)<script\\b[^>]*>.*?</script>|<style\\b[^>]*>.*?</style>|<!--.*?-->"," ").replaceAll("(?s)<[^>]*>"," ").replace("&nbsp;"," ").replace("&amp;","&").replaceAll("\\s+"," ").strip();}
 public static List<CollectedProductService.Offer> parse(String html,String query,String checkedAt){
  if(html==null||html.length()>1_000_000)throw new Unavailable("FORMAT_CHANGED","전단 본문 크기를 확인할 수 없습니다.");
  html=html.replaceAll("(?is)<script\\b[^>]*>.*?</script>|<!--.*?-->"," ");
  String branch=text(first(html,"flyer__store-name[^>]*>\\s*<h2[^>]*>(.*?)</h2>"));
  Matcher dates=Pattern.compile("행사 기간\\s*:\\s*(?:<[^>]*>\\s*)*(\\d{4})\\.\\s*(\\d{1,2})\\.\\s*(\\d{1,2})\\.[^~]{0,50}~\\s*(\\d{4})\\.\\s*(\\d{1,2})\\.\\s*(\\d{1,2})\\.").matcher(html);
  if(branch.isBlank()||!dates.find())throw new Unavailable("FORMAT_CHANGED","점포·전단 기간을 읽지 못했습니다. 형식 변경 여부를 확인해야 합니다.");
  LocalDate from,to;try{from=LocalDate.of(Integer.parseInt(dates.group(1)),Integer.parseInt(dates.group(2)),Integer.parseInt(dates.group(3)));to=LocalDate.of(Integer.parseInt(dates.group(4)),Integer.parseInt(dates.group(5)),Integer.parseInt(dates.group(6)));}catch(Exception e){throw new Unavailable("FORMAT_CHANGED","전단 기간 형식을 확인해 주세요.");}
  LocalDate today=LocalDate.now(ZoneId.of("Asia/Seoul"));if(to.isBefore(today)||to.isBefore(from))throw new Unavailable("EXPIRED","현재 유효한 전단이 아닙니다. 기존 상품을 새 행사로 바꾸지 않았습니다.");
  // Only the explicit accessibility product descriptions, never scripts or unrelated menus.
  Matcher sections=Pattern.compile("(?is)<desc[0-9]+\\b[^>]*>(.*?)</desc[0-9]+>").matcher(html);
  List<CollectedProductService.Offer> result=new ArrayList<>();int ordinal=0;Set<String> seen=new HashSet<>();
  while(sections.find()){
   String section=text(sections.group(1));
   for(String part:section.split("[가-힣0-9]+번째\\s*상품입니다[.。]?")){
    part=part.strip();if(part.isEmpty())continue;ordinal++;
    String normalized=normalize(part);if(!normalized.contains("원")&&!normalized.matches("(?s).*\\d\\s*(?:kg|g).*"))continue;
    if(!part.contains(query)&&!normalized.contains(query))continue;
    if(!seen.add(part))continue;
    Matcher weights=Pattern.compile("(?i)(?<![\\d.])(\\d+(?:\\.\\d+)?)\\s*(kg|g)(?![a-z])").matcher(normalized);BigDecimal grams=null;int count=0;
    while(weights.find()){count++;grams=new BigDecimal(weights.group(1));if(weights.group(2).equalsIgnoreCase("kg"))grams=grams.multiply(BigDecimal.valueOf(1000));}
    if(count!=1||normalized.matches("(?s).*(?:100\\s*g|[×*+]|세트|증정|하나사면|부터|최대).*"))grams=null;
    // Even apparently clear prices remain blank when normal/discount/conditions coexist.
    Matcher prices=Pattern.compile("(?<![\\d.])(\\d[\\d,]*)\\s*원").matcher(normalized);BigDecimal price=null;int pc=0;while(prices.find()){pc++;price=new BigDecimal(prices.group(1).replace(",",""));}if(pc!=1)price=null;
    if(price==null&&grams!=null&&pc>1){Matcher sale=Pattern.compile("에서\\s*(\\d[\\d,]*)\\s*원에\\s*판매").matcher(normalized);if(sale.find()){BigDecimal candidate=new BigDecimal(sale.group(1).replace(",",""));if(!sale.find())price=candidate;}}
    String name=normalized.split("멤버특가|판매합니다",2)[0].replaceAll("[을를]\\s*$","").strip();name=name.substring(0,Math.min(name.length(),150));String evidence=part.substring(0,Math.min(part.length(),1800));
    result.add(new CollectedProductService.Offer("CRAWL","HOMEPLUS","flyer-"+from+"-item-"+ordinal,name,"홈플러스 "+branch,grams,price,ROOT+"/leaflet",checkedAt,part.matches("(?s).*요일부터.*")?"":from.toString(),part.matches("(?s).*요일부터.*")?"":to.toString(),"FLYER","원문에서 이 상품의 개별 행사 기간·회원·카드 조건을 확인하세요. 전단 전체 기간은 임시값입니다. 오프라인 행사이며 온라인 가격과 다를 수 있습니다.",branch,evidence,false));
    if(result.size()>=50)return List.copyOf(result);
   }
  }
  if(ordinal==0)throw new Unavailable("FORMAT_CHANGED","전단 상품 설명을 읽지 못했습니다. 수집 형식 변경 여부를 확인해야 합니다.");return List.copyOf(result);
 }
 public static String normalize(String value){
  Matcher m=Pattern.compile("([영일이삼사오육칠팔구십백천만점]+)(?=\\s*(?:킬로그램|그램|원|퍼센트))").matcher(value);StringBuffer b=new StringBuffer();
  while(m.find())m.appendReplacement(b,Matcher.quoteReplacement(korean(m.group(1))));m.appendTail(b);return b.toString().replace("킬로그램","kg").replace("그램","g");
 }
 private static String korean(String s){if(s.contains("점")){String[] p=s.split("점",2);StringBuilder b=new StringBuilder(korean(p[0])).append('.');for(char c:p[1].toCharArray()){int d="영일이삼사오육칠팔구".indexOf(c);if(d<0)return s;b.append(d);}return b.toString();}
  long total=0,section=0,num=0;for(char c:s.toCharArray()){int d="영일이삼사오육칠팔구".indexOf(c);if(d>=0)num=d;else if(c=='만'){total+=(section+num==0?1:section+num)*10000;section=0;num=0;}else{int unit=c=='십'?10:c=='백'?100:c=='천'?1000:0;if(unit==0)return s;section+=(num==0?1:num)*unit;num=0;}}return Long.toString(total+section+num);
 }
}
