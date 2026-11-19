package com.onrender.smartnf.health;
import java.util.*;import java.net.URI;
/** Member-bound short-lived search receipts; only an explicitly selected item is persisted. */
public final class KakaoProductSnapshots {
 private record Receipt(long member,IngredientProductService.Product product,long expires){}
 private static final Map<String,Receipt> entries=new LinkedHashMap<>();
 private KakaoProductSnapshots(){}
 public static boolean validUrl(String value){try{URI u=URI.create(value);return value.length()<=2000&&"https".equals(u.getScheme())&&"shoppinghow.kakao.com".equals(u.getHost())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&"/go.daum".equals(u.getPath())&&u.getRawQuery()!=null&&u.getFragment()==null;}catch(Exception e){return false;}}
 public static boolean validLiveUrl(String provider,String value){
  if("KAKAO".equals(provider))return validUrl(value);
  try{URI u=URI.create(value);if(value.length()>2000||!"https".equals(u.getScheme())||u.getUserInfo()!=null||(u.getPort()!=-1&&u.getPort()!=443)||u.getFragment()!=null)return false;
   return switch(provider){
    case "DANAWA" -> "prod.danawa.com".equals(u.getHost())&&"/info/".equals(u.getPath())&&u.getRawQuery()!=null&&u.getRawQuery().matches("(?:[^&]*&)*pcode=[0-9]+(?:&[^&]*)*");
    case "ENURI" -> "www.enuri.com".equals(u.getHost())&&"/detail.jsp".equals(u.getPath())&&u.getRawQuery()!=null&&u.getRawQuery().matches("modelno=[0-9]+");
    case "HOMEPLUS" -> "mfront.homeplus.co.kr".equals(u.getHost())&&"/item".equals(u.getPath())&&u.getRawQuery()!=null&&u.getRawQuery().matches("itemNo=[0-9]+&storeType=(HYPER|EXPRESS)");
    case "EMART" -> "emart.ssg.com".equals(u.getHost())&&"/item/itemView.ssg".equals(u.getPath())&&u.getRawQuery()!=null&&u.getRawQuery().matches("itemId=[0-9]+(?:&[^&]*)*");
    case "LOTTE" -> "lottemartzetta.com".equals(u.getHost())&&u.getPath().matches("/products/[A-Za-z0-9]+/details")&&u.getRawQuery()==null;
    case "OASIS" -> "www.oasis.co.kr".equals(u.getHost())&&u.getPath().matches("/product/detail/[0-9]+")&&(u.getRawQuery()==null||u.getRawQuery().matches("categoryId=[0-9]*"));
    default -> false;
   };
  }catch(Exception e){return false;}
 }
 public static boolean validAnyLiveUrl(String value){return List.of("KAKAO","DANAWA","ENURI","OASIS","EMART","LOTTE","HOMEPLUS").stream().anyMatch(p->validLiveUrl(p,value));}
 public static synchronized List<IngredientProductService.Product> issue(long member,List<IngredientProductService.Product> products){
  long now=System.currentTimeMillis();entries.entrySet().removeIf(e->e.getValue().expires()<now);var out=new ArrayList<IngredientProductService.Product>();
  for(var p:products){if(!Set.of("KAKAO","DANAWA","ENURI","OASIS","EMART","LOTTE","HOMEPLUS").contains(p.provider())){out.add(p);continue;}if(!validLiveUrl(p.provider(),p.url()))continue;String id="k:"+UUID.randomUUID();
   var receipt=new IngredientProductService.Product(id,p.name(),p.merchant(),p.price(),p.grams(),p.url(),p.delivery(),p.checkedAt(),p.sourceType(),p.provider(),p.priceKind(),p.conditions(),p.branch(),p.validFrom(),p.validTo());
   while(entries.size()>=1000)entries.remove(entries.keySet().iterator().next());entries.put(id,new Receipt(member,receipt,now+15*60_000));out.add(receipt);
  }return List.copyOf(out);
 }
 public static boolean representativeKilogram(String name){return name!=null&&java.util.regex.Pattern.compile("(?i)(?<![0-9.])1\\s*kg\\s*[/／]\\s*2\\s*kg(?![a-z])").matcher(name).find();}
 public static synchronized IngredientProductService.Product require(long member,ShoppingProductService.Save s){
  Receipt r=entries.get(s.productId());if(r==null||r.member()!=member||r.expires()<System.currentTimeMillis())throw new HealthException(409,"조회 상품이 만료됐습니다. 상품을 다시 조회해 선택하세요.");var p=r.product();boolean option=s.optionPriceConfirmed();if(representativeKilogram(p.name())&&!option)throw new HealthException(400,"1kg 옵션명과 해당 가격을 확인하세요.");if(option&&(!representativeKilogram(p.name())||!"g".equals(s.quantityUnit())||s.packageAmount().compareTo(new java.math.BigDecimal("1000"))!=0||s.optionName()==null||s.optionName().isBlank()))throw HealthException.conflict();if(!option&&!p.quantities().isEmpty()&&!Set.of("DANAWA","ENURI").contains(p.provider())&&p.quantities().stream().noneMatch(q->q.unit().equals(s.quantityUnit())&&q.amount().compareTo(s.packageAmount())==0))throw HealthException.conflict();
  if(!p.name().equals(s.productName())||!p.merchant().equals(s.merchant())||(!option&&p.price().compareTo(s.price())!=0)||!p.url().equals(s.url())||!p.checkedAt().equals(s.checkedAt()))throw HealthException.conflict();return p;
 }
}
