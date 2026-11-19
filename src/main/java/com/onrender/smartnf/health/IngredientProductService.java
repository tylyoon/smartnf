package com.onrender.smartnf.health;

import java.io.*;import java.math.BigDecimal;import java.net.*;import java.net.http.*;import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;import java.util.regex.*;import javax.xml.XMLConstants;import javax.xml.parsers.DocumentBuilderFactory;import org.springframework.stereotype.Service;import org.w3c.dom.*;

/** Product search only. Does not send health profiles or alter meal/shopping quantities. */
@Service public class IngredientProductService {
 public record Product(String id,String name,String merchant,BigDecimal price,BigDecimal grams,String url,String delivery,String checkedAt,String sourceType,String provider,String priceKind,String conditions,String branch,String validFrom,String validTo,String quantityUnit,BigDecimal packageAmount,List<ProductQuantity> quantities){
  public Product(String id,String name,String merchant,BigDecimal price,BigDecimal grams,String url,String delivery,String checkedAt,String sourceType,String provider,String priceKind,String conditions,String branch,String validFrom,String validTo,String quantityUnit,BigDecimal packageAmount){this(id,name,merchant,price,grams,url,delivery,checkedAt,sourceType,provider,priceKind,conditions,branch,validFrom,validTo,quantityUnit,packageAmount,Set.of("DANAWA","ENURI").contains(provider)?List.of():ProductQuantity.quantities(name));}
  public Product(String id,String name,String merchant,BigDecimal price,BigDecimal grams,String url,String delivery,String checkedAt,String sourceType,String provider,String priceKind,String conditions,String branch,String validFrom,String validTo){this(id,name,merchant,price,grams,url,delivery,checkedAt,sourceType,provider,priceKind,conditions,branch,validFrom,validTo,Set.of("DANAWA","ENURI").contains(provider)||ProductQuantity.parse(name)==null?null:ProductQuantity.parse(name).unit(),Set.of("DANAWA","ENURI").contains(provider)||ProductQuantity.parse(name)==null?null:ProductQuantity.parse(name).amount());}

  public Product(String id,String name,String merchant,BigDecimal price,BigDecimal grams,String url,String delivery,String checkedAt){this(id,name,merchant,price,grams,url,delivery,checkedAt,"API","11ST","ONLINE","배송비·옵션·회원 조건 별도 확인","","","");}
 }
 public record Result(String provider,List<Product> products,String message){}
 private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
 private long minute=-1;private int calls;
 private synchronized boolean allow(){long now=System.currentTimeMillis()/60000;if(now!=minute){minute=now;calls=0;}return ++calls<=20;}
 public Result search(String query,String provider){
  if("KAKAO".equals(provider))return search(query);
  if(!Set.of("DANAWA","ENURI","OASIS","EMART","LOTTE","HOMEPLUS").contains(provider)||query==null||query.isBlank()||query.length()>100||query.chars().anyMatch(Character::isISOControl))throw HealthException.invalid();
  if(!allow())throw new HealthException(429,"잠시 후 다시 조회하세요.");
  return new RetailProductSearch().search(provider,IngredientPricePolicy.searchName(query.strip()));
 }
 public Result search(String query){
  query=query==null?"":query.strip();if(query.isEmpty()||query.length()>100||query.chars().anyMatch(Character::isISOControl))throw HealthException.invalid();
  if(!"false".equalsIgnoreCase(System.getenv("SMARTNF_KAKAO_LOOKUP_ENABLED"))){if(!allow())throw new HealthException(429,"잠시 후 다시 조회하세요.");return new KakaoProductSearch().search(IngredientPricePolicy.searchName(query));}
  if(!"true".equalsIgnoreCase(System.getenv("SMARTNF_ELEVENST_AUTHORIZED")))return new Result("UNCONFIGURED",List.of(),"검토해 저장한 상품을 표시합니다. 외부 상품은 판매 사이트 연결에서 확인하세요.");
  String key=System.getenv("SMARTNF_ELEVENST_API_KEY");if(key==null||key.isBlank())return new Result("11ST",List.of(),"11번가 상품 검색 API 키가 설정되지 않았습니다. 운영자가 연결 설정을 완료해 주세요.");
  if(!key.matches("[A-Za-z0-9]{32}"))throw new HealthException(503,"11번가 API 키 설정을 확인해 주세요.");
  if(!allow())throw new HealthException(429,"상품 조회가 많습니다. 잠시 후 다시 조회해 주세요.");
  URI uri=URI.create("https://openapi.11st.co.kr/openapi/OpenApiService.tmall?apiCode=ProductSearch&pageNum=1&pageSize=20&sortCd=CP&key="+key+"&keyword="+URLEncoder.encode(query,StandardCharsets.UTF_8));
  try{var response=client.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(12)).GET().build(),HttpResponse.BodyHandlers.ofInputStream());try(var body=response.body()){if(response.statusCode()!=200)throw new HealthException(502,"11번가 상품 조회 응답을 확인하지 못했습니다.");byte[] bytes=body.readNBytes(1_000_001);if(bytes.length>1_000_000)throw new HealthException(502,"상품 응답이 너무 큽니다.");return parse(bytes,Instant.now().toString());}}
  catch(InterruptedException e){Thread.currentThread().interrupt();throw new HealthException(503,"상품 조회가 중단됐습니다. 다시 조회해 주세요.");}catch(HealthException e){throw e;}catch(Exception e){throw new HealthException(502,"판매처 상품 조회가 지연되거나 실패했습니다. 잠시 후 다시 시도해 주세요.");}
 }
 public static Result parse(byte[] bytes,String checkedAt)throws Exception{
  var factory=DocumentBuilderFactory.newInstance();factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl",true);factory.setFeature("http://xml.org/sax/features/external-general-entities",false);factory.setFeature("http://xml.org/sax/features/external-parameter-entities",false);factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD,"");factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA,"");factory.setXIncludeAware(false);factory.setExpandEntityReferences(false);
  var builder=factory.newDocumentBuilder();builder.setErrorHandler(new org.xml.sax.helpers.DefaultHandler());Document doc=builder.parse(new ByteArrayInputStream(bytes));
  if(!doc.getDocumentElement().getTagName().equals("ProductSearchResponse"))throw new HealthException(502,"11번가 응답 형식을 확인해 주세요.");
  if(doc.getElementsByTagName("ErrorCode").getLength()>0||doc.getElementsByTagName("Error").getLength()>0)throw new HealthException(502,"11번가 API 이용 권한·키·호출 한도를 확인해 주세요.");
  NodeList nodes=doc.getElementsByTagName("Product");var products=new ArrayList<Product>();var ids=new HashSet<String>();
  for(int i=0;i<Math.min(nodes.getLength(),20);i++){Element n=(Element)nodes.item(i);String id=text(n,"ProductCode"),name=clean(text(n,"ProductName"));if(!id.matches("[0-9]{1,30}")||name.isBlank()||!ids.add(id))continue;BigDecimal price;try{price=new BigDecimal(text(n,"ProductPrice").replace(",",""));if(price.signum()<=0||price.compareTo(new BigDecimal("100000000"))>0)continue;}catch(NumberFormatException e){continue;}
   products.add(new Product(id,name,clean(text(n,"Seller")),price,weight(name),"https://www.11st.co.kr/products/"+id,clean(text(n,"Delivery")),checkedAt));
  }
  return new Result("11ST",List.copyOf(products),"11번가 검색 결과입니다. 상품 가격 기준이며 배송비·옵션·할인 조건은 판매처에서 확인하세요. 상품 1개의 총중량을 확인한 뒤 비교에 담으세요.");
 }
 private static String text(Element e,String key){var n=e.getElementsByTagName(key);return n.getLength()==0?"":n.item(0).getTextContent().strip();}
 private static String clean(String s){String value=s.replaceAll("<[^>]*>","").replace("&amp;","&").replace("&lt;","<").replace("&gt;",">");return value.substring(0,Math.min(value.length(),300));}
 public static BigDecimal weight(String name){
  // One explicit weight only. Sets/options/multiple packs require human confirmation.
  if(name.matches("(?is).*(?:[x×*+~]|옵션|선택|증정|묶음|세트|[0-9]\\s*(?:봉|팩|개입|입)).*"))return null;
  var m=Pattern.compile("(?i)(?<![0-9.])([0-9]+(?:\\.[0-9]+)?)\\s*(kg|g|㎏|㎎|그램|킬로그램)(?![a-z])").matcher(name);BigDecimal result=null;int count=0;
  while(m.find()){count++;if(m.group(2).equals("㎎"))return null;result=new BigDecimal(m.group(1));if(Set.of("kg","㎏","킬로그램").contains(m.group(2).toLowerCase(Locale.ROOT)))result=result.multiply(BigDecimal.valueOf(1000));}
  return count==1&&result.signum()>0&&result.compareTo(new BigDecimal("10000000"))<=0?result:null;
 }
}
