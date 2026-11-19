package com.onrender.smartnf.health;

import java.math.BigDecimal;
import java.net.URI;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Reviewed, member-owned snapshots. No outbound requests to submitted URLs. */
@Service
public class CollectedProductService {
 public record Offer(String sourceType,String provider,String sourceId,String name,String merchant,
   BigDecimal grams,BigDecimal price,String url,String checkedAt,String validFrom,String validTo,
   String priceKind,String conditions,String branch,String evidence,boolean confirmed) {}
 private final JdbcTemplate jdbc;
 public CollectedProductService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 private static String text(String s,int max,boolean required){
  if(s==null)s="";s=s.strip();if((required&&s.isEmpty())||s.length()>max||s.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'))throw HealthException.invalid();return s;
 }
 public static boolean officialUrl(String value){
  try {URI u=URI.create(value);return "https".equals(u.getScheme())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&Set.of("www.11st.co.kr","m.my.homeplus.co.kr","www.mlotte.net","company.lottemart.com","emartapp.emart.com","eapp.emart.com","store.traders.co.kr").contains(u.getHost());}catch(Exception e){return false;}
 }
 public static Offer validate(Offer o){
  if(o==null||!o.confirmed()||!Set.of("API","CRAWL","RPA","OCR").contains(o.sourceType()==null?"":o.sourceType())||!Set.of("ONLINE","FLYER").contains(o.priceKind()==null?"":o.priceKind()))throw HealthException.invalid();
  if(o.grams()==null||o.price()==null||o.grams().signum()<=0||o.grams().compareTo(new BigDecimal("10000000"))>0||o.price().signum()<=0||o.price().compareTo(new BigDecimal("100000000"))>0||o.grams().stripTrailingZeros().scale()>3||o.price().stripTrailingZeros().scale()>2)throw HealthException.invalid();
  String url=text(o.url(),500,true);if(!officialUrl(url))throw HealthException.invalid();
  try{Instant at=Instant.parse(o.checkedAt());LocalDate from=LocalDate.parse(o.validFrom()),to=LocalDate.parse(o.validTo());if(at.isAfter(Instant.now().plusSeconds(300))||to.isBefore(from)||to.isAfter(from.plusDays(366))||to.isBefore(LocalDate.now(ZoneId.of("Asia/Seoul"))))throw HealthException.invalid();}catch(Exception e){throw HealthException.invalid();}
  String branch=text(o.branch(),100,false),conditions=text(o.conditions(),1000,false);
  if(o.priceKind().equals("FLYER")&&(branch.isEmpty()||conditions.isEmpty()))throw HealthException.invalid();
  return new Offer(o.sourceType(),text(o.provider(),50,true),text(o.sourceId(),100,true),text(o.name(),300,true),text(o.merchant(),300,true),o.grams(),o.price(),url,o.checkedAt(),o.validFrom(),o.validTo(),o.priceKind(),conditions,branch,text(o.evidence(),2000,true),true);
 }
 @Transactional public int save(long member,List<Offer> offers){
  if(offers==null||offers.isEmpty()||offers.size()>100)throw HealthException.invalid();
  List<Offer> valid=offers.stream().map(CollectedProductService::validate).toList();
  if(jdbc.queryForList("SELECT id FROM members WHERE id=? FOR UPDATE",Long.class,member).isEmpty())throw HealthException.invalid();
  for(Offer o:valid){
   // Stable key makes re-import replace the snapshot instead of creating duplicate offers.
   String key=UUID.nameUUIDFromBytes((o.provider()+"|"+o.sourceType()+"|"+o.sourceId()+"|"+o.branch()+"|"+o.priceKind()).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
   jdbc.update("DELETE FROM collected_product_offers WHERE member_id=? AND id=?",member,key);
   jdbc.update("INSERT INTO collected_product_offers(member_id,id,source_type,provider,source_id,product_name,merchant,pack_grams,unit_price,product_url,checked_at,valid_from,valid_to,price_kind,conditions_text,branch,evidence) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",member,key,o.sourceType(),o.provider(),o.sourceId(),o.name(),o.merchant(),o.grams(),o.price(),o.url(),o.checkedAt(),o.validFrom(),o.validTo(),o.priceKind(),o.conditions(),o.branch(),o.evidence());
  }return valid.size();
 }
 @Transactional(readOnly=true) public List<IngredientProductService.Product> search(long member,String query){
  if(query==null||query.isBlank()||query.length()>100)throw HealthException.invalid();
  String escaped=query.strip().replace("!","!!").replace("%","!%").replace("_","!_");
  String day=LocalDate.now(ZoneId.of("Asia/Seoul")).toString();
  return jdbc.query("SELECT * FROM collected_product_offers WHERE member_id=? AND product_name LIKE ? ESCAPE '!' AND valid_from<=? AND valid_to>=? ORDER BY checked_at DESC LIMIT 100",(r,n)->new IngredientProductService.Product("c:"+r.getString("id"),r.getString("product_name"),r.getString("merchant"),r.getBigDecimal("unit_price"),r.getBigDecimal("pack_grams"),r.getString("product_url"),"배송비·재고는 판매처 확인",r.getString("checked_at"),r.getString("source_type"),r.getString("provider"),r.getString("price_kind"),r.getString("conditions_text"),r.getString("branch"),r.getString("valid_from"),r.getString("valid_to")),member,"%"+escaped+"%",day,day);
 }
}
