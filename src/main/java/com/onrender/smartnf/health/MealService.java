package com.onrender.smartnf.health;
import java.util.*;import java.time.*;import java.sql.Date;import java.math.BigDecimal;
import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import static com.onrender.smartnf.health.MealModels.*;
@Service
@Transactional
public class MealService {
 private final JdbcTemplate jdbc;private final HealthRepository health;
 public MealService(JdbcTemplate jdbc,HealthRepository health){this.jdbc=jdbc;this.health=health;}
 private void require(long member,Long event){health.lockMember(member);var c=health.consent(member);if(!c.agreed())throw new HealthException(403,"식사 기록이 포함된 새 건강정보 저장 안내에 동의해 주세요.");if(event!=null&&!event.equals(c.eventId()))throw HealthException.conflict();}
 private record Stored(long id,long revision,boolean deleted){}
 private Stored read(long member,LocalDate date){return jdbc.query("SELECT id,revision,deleted FROM health_meal_days WHERE member_id=? AND record_date=?",(r,n)->new Stored(r.getLong(1),r.getLong(2),r.getBoolean(3)),member,Date.valueOf(date)).stream().findFirst().orElse(null);}
 private Day view(LocalDate date,Stored s){
  if(s==null||s.deleted())return new Day(date,s==null?0:s.revision(),List.of());
  var rows=jdbc.query("SELECT * FROM health_meal_items WHERE day_id=? ORDER BY position_no",(r,n)->{
   int position=r.getInt("position_no");
   var refs=jdbc.query("SELECT * FROM health_meal_ingredients WHERE day_id=? AND position_no=? ORDER BY ingredient_no",(v,j)->{
    var nutrients=new LinkedHashMap<String,BigDecimal>();for(String key:MealCatalog.KEYS){var value=v.getBigDecimal(key);if(value!=null)nutrients.put(key,value.stripTrailingZeros());}
    return new Ingredient(v.getString("food_id"),v.getString("food_name"),v.getString("reference_kind"),v.getString("source_version"),v.getString("source_name"),Collections.unmodifiableMap(nutrients),v.getString("basis_label"));
   },s.id(),position);
   return new Row(r.getString("meal"),r.getString("food_name"),r.getString("meal_time"),r.getString("note"),refs,r.getBoolean("ingredients_confirmed"),r.getBigDecimal("grams")!=null||r.getString("food_id")!=null);
  },s.id());return new Day(date,s.revision(),rows);
 }
 public Day day(long member,LocalDate date){require(member,null);HealthDailyModels.date(date);return view(date,read(member,date));}
 public List<Day> range(long member,LocalDate from,LocalDate to){
  require(member,null);HealthDailyModels.date(from);HealthDailyModels.date(to);if(from.isAfter(to)||java.time.temporal.ChronoUnit.DAYS.between(from,to)>365)throw HealthException.invalid();
  var dates=jdbc.queryForList("SELECT record_date FROM health_meal_days WHERE member_id=? AND record_date BETWEEN ? AND ? AND deleted=FALSE ORDER BY record_date",LocalDate.class,member,Date.valueOf(from),Date.valueOf(to));
  return dates.stream().map(d->view(d,read(member,d))).toList();
 }
 public List<MealCatalog.Food> catalog(long member){require(member,null);return MealCatalog.all();}
 public Day save(long member,Save request){
  if(request==null)throw HealthException.invalid();return write(member,request.requestId(),request.expectedRevision(),request.consentEventId(),request.date(),validate(request.items()),false);
 }
 public Day delete(long member,Delete request){if(request==null)throw HealthException.invalid();return write(member,request.requestId(),request.expectedRevision(),request.consentEventId(),request.date(),List.of(),true);}
 private record Receipt(String hash,long revision){}
 private Day write(long member,UUID request,Long revision,Long event,LocalDate date,List<Input> items,boolean remove){
  if(request==null||revision==null||revision<0||event==null)throw HealthException.invalid();require(member,event);HealthDailyModels.date(date);
  String op=remove?"DELETE":"SAVE",hash=hash(op,date,revision,event,items);var old=read(member,date);
  var prior=jdbc.query("SELECT payload_hash,result_revision FROM health_meal_requests WHERE member_id=? AND request_id=?",(r,n)->new Receipt(r.getString(1),r.getLong(2)),member,request.toString()).stream().findFirst().orElse(null);
  if(prior!=null){if(!prior.hash().equals(hash)||old==null||old.revision()!=prior.revision()||old.deleted()!=remove)throw HealthException.conflict();return view(date,old);}
  if((old==null?0:old.revision())!=revision||(remove&&(old==null||old.deleted())))throw HealthException.conflict();
  long next=revision+1;var now=LocalDateTime.now(ZoneOffset.UTC);
  if(old==null)jdbc.update("INSERT INTO health_meal_days(member_id,record_date,revision,deleted,consent_event_id,updated_at) VALUES (?,?,?,?,?,?)",member,Date.valueOf(date),next,remove,event,now);
  else jdbc.update("UPDATE health_meal_days SET revision=?,deleted=?,consent_event_id=?,updated_at=? WHERE id=? AND member_id=?",next,remove,event,now,old.id(),member);
  var saved=read(member,date);
  jdbc.update("DELETE FROM health_meal_ingredients WHERE day_id=?",saved.id());
  jdbc.update("DELETE FROM health_meal_items WHERE day_id=?",saved.id());
  for(int n=0;n<items.size();n++){
   var i=items.get(n);
   jdbc.update("INSERT INTO health_meal_items(day_id,position_no,meal,food_id,food_name,grams,meal_time,note,source_version,source_name,ingredients_confirmed) VALUES (?,?,?,NULL,?,NULL,?,?,'','',?)",saved.id(),n,i.meal(),i.name(),i.time(),i.note(),i.ingredientsConfirmed());
   int position=0;for(String foodId:i.ingredientIds()){
    var f=MealCatalog.find(foodId);var values=new ArrayList<Object>(Arrays.asList(saved.id(),n,position++,f.id(),f.name(),"CONFIRMED",f.version(),f.source(),f.basis()));
    for(String key:MealCatalog.KEYS)values.add(f.nutrients().get(key));
    jdbc.update("INSERT INTO health_meal_ingredients(day_id,position_no,ingredient_no,food_id,food_name,reference_kind,source_version,source_name,basis_label,energy,protein,carbohydrate,fat,sodium,sugars,fiber,saturated_fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",values.toArray());
   }
  }
  jdbc.update("INSERT INTO health_meal_requests(member_id,request_id,record_date,operation,result_revision,payload_hash) VALUES (?,?,?,?,?,?)",member,request.toString(),Date.valueOf(date),op,next,hash);
  return view(date,read(member,date));
 }
}
