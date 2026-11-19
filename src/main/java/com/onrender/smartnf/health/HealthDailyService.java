package com.onrender.smartnf.health;

import java.util.*;import java.time.*;import java.sql.Date;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.onrender.smartnf.health.HealthDailyModels.*;

@Service
@Transactional
public class HealthDailyService {
 private final JdbcTemplate jdbc;private final HealthRepository health;
 public HealthDailyService(JdbcTemplate jdbc,HealthRepository health){this.jdbc=jdbc;this.health=health;}
 private HealthModels.ConsentState require(long member,Long event){health.lockMember(member);var c=health.consent(member);if(!c.agreed())throw new HealthException(403,"갱신된 건강정보 저장 안내에 동의해 주세요.");if(event!=null&&!event.equals(c.eventId()))throw HealthException.conflict();return c;}
 public Map<String,Object> options(long member){require(member,null);var care=care(member);return Map.of("today",today(),"actions",care==null||care.needsReview()?List.of():care.items(),"needsReview",care!=null&&care.needsReview());}
 public Selection selection(long member){require(member,null);return readSelection(member);}
 private Selection readSelection(long member){
  return jdbc.query("SELECT revision, tracking_keys FROM health_tracking_selection WHERE member_id=?",(rs,n)->{
   String keys=rs.getString(2);
   return new Selection(rs.getLong(1),keys.isEmpty()?List.of():List.of(keys.split(",")));
  },member).stream().findFirst().orElseGet(()->{
   var keys=new LinkedHashSet<>(List.of("weight","bp"));
   var care=care(member);
   if(care!=null&&!care.needsReview())for(var item:care.items()){
    if(item.id().equals("movement"))keys.addAll(List.of("steps","walkingMinutes"));
    else if(!item.id().equals("weightcare"))keys.add(item.id());
   }
   return new Selection(0,List.copyOf(keys));
  });
 }
 public Selection saveSelection(long member,SaveSelection request){
  if(request==null||request.consentEventId()==null||request.expectedRevision()==null||request.keys()==null||request.keys().size()>20)throw HealthException.invalid();
  require(member,request.consentEventId());
  var keys=new LinkedHashSet<String>();
  for(String key:request.keys())if(key==null||(!MEASUREMENTS.contains(key)&&!action(key))||!keys.add(key))throw HealthException.invalid();
  var old=readSelection(member);
  var selected=List.copyOf(keys);
  if(old.revision()!=request.expectedRevision()){
   if(old.keys().equals(selected))return old;
   throw HealthException.conflict();
  }
  long revision=old.revision()+1;
  String encoded=String.join(",",keys);
  if(old.revision()==0)jdbc.update("INSERT INTO health_tracking_selection(member_id,revision,tracking_keys) VALUES (?,?,?)",member,revision,encoded);
  else jdbc.update("UPDATE health_tracking_selection SET revision=?,tracking_keys=? WHERE member_id=?",revision,encoded,member);
  return new Selection(revision,selected);
 }
 private HealthModels.CareSet care(long member){Long id=health.latestCare(member);return id==null?null:health.care(member,id);}
 private record Stored(long id,long revision,boolean deleted,String savedAt,Input input){}
 private Stored read(long member,LocalDate date){
  return jdbc.query("SELECT * FROM health_daily_records WHERE member_id=? AND record_date=?",(rs,n)->{
   long id=rs.getLong("id");var items=jdbc.query("SELECT action_id,practice_status,practice_note FROM health_daily_practices WHERE daily_id=? ORDER BY action_id",(r,i)->new Practice(r.getString(1),r.getString(2),r.getString(3)),id);
   var weight=rs.getBigDecimal("weight");
   var clinical=new Clinical(normalize(rs.getBigDecimal("height_cm")),normalize(rs.getBigDecimal("total_cholesterol")),
    normalize(rs.getBigDecimal("ldl")),normalize(rs.getBigDecimal("hdl")),normalize(rs.getBigDecimal("triglycerides")));
   if(clinical.equals(Clinical.EMPTY))clinical=null;
   var metrics=new Metrics(rs.getObject("step_count",Integer.class),rs.getObject("walking_minutes",Integer.class),rs.getObject("fasting_glucose",Integer.class),normalize(rs.getBigDecimal("waist")),normalize(rs.getBigDecimal("sleep_hours")),clinical);
   if(metrics.equals(new Metrics(null,null,null,null,null)))metrics=null;
   return new Stored(id,rs.getLong("revision"),rs.getBoolean("deleted"),rs.getTimestamp("updated_at").toLocalDateTime()+"Z",new Input(weight==null?null:weight.stripTrailingZeros(),rs.getBigDecimal("sys")==null?null:rs.getBigDecimal("sys").stripTrailingZeros(),rs.getBigDecimal("dia")==null?null:rs.getBigDecimal("dia").stripTrailingZeros(),rs.getString("bp_context"),rs.getString("bp_time"),rs.getString("weight_time"),rs.getString("day_note"),items,metrics));
  },member,Date.valueOf(date)).stream().findFirst().orElse(null);
 }
 private static java.math.BigDecimal normalize(java.math.BigDecimal value){return value==null?null:value.stripTrailingZeros();}
 private Day view(LocalDate date,Stored stored){return new Day(date,stored==null?0:stored.revision(),stored==null||stored.deleted()?null:new Entry(date,stored.revision(),stored.savedAt(),stored.input()));}
 public Day day(long member,LocalDate date){require(member,null);date(date);return view(date,read(member,date));}
 public List<Entry> range(long member,LocalDate from,LocalDate to){
  require(member,null);date(from);date(to);if(from.isAfter(to)||java.time.temporal.ChronoUnit.DAYS.between(from,to)>365)throw HealthException.invalid();
  var dates=jdbc.queryForList("SELECT record_date FROM health_daily_records WHERE member_id=? AND record_date BETWEEN ? AND ? AND deleted=FALSE ORDER BY record_date",LocalDate.class,member,Date.valueOf(from),Date.valueOf(to));
  var out=new ArrayList<Entry>();for(var d:dates)out.add(view(d,read(member,d)).record());return out;
 }
 private record Receipt(LocalDate date,String operation,long revision){}
 private Receipt receipt(long member,UUID request){return jdbc.query("SELECT record_date,operation,result_revision FROM health_daily_requests WHERE member_id=? AND request_id=?",(rs,n)->new Receipt(rs.getDate(1).toLocalDate(),rs.getString(2),rs.getLong(3)),member,request.toString()).stream().findFirst().orElse(null);}
 private void receipt(long member,UUID request,LocalDate date,String op,long revision){jdbc.update("INSERT INTO health_daily_requests(member_id,request_id,record_date,operation,result_revision) VALUES (?,?,?,?,?)",member,request.toString(),Date.valueOf(date),op,revision);}
 public Day save(long member,Save request){
  if(request==null||request.requestId()==null||request.expectedRevision()==null||request.expectedRevision()<0||request.consentEventId()==null)throw HealthException.invalid();
  require(member,request.consentEventId());date(request.date());var old=read(member,request.date());
  Input raw=request.input();
  if(raw!=null&&old!=null&&!old.deleted()&&old.input().metrics()!=null){
   if(raw.metrics()==null)raw=raw.withMetrics(old.input().metrics());
   else if(raw.metrics().clinical()==null)raw=raw.withMetrics(raw.metrics().withClinical(old.input().metrics().clinical()));
  }
  Input input=validate(raw);var prior=receipt(member,request.requestId());
  if(prior!=null){if(!prior.date().equals(request.date())||!prior.operation().equals("SAVE")||old==null||old.deleted()||old.revision()!=prior.revision()||!old.input().equals(input))throw HealthException.conflict();return view(request.date(),old);}
  long revision=old==null?0:old.revision();if(revision!=request.expectedRevision())throw HealthException.conflict();
  var allowed=new HashSet<String>();var care=care(member);if(care!=null&&!care.needsReview())for(var item:care.items())allowed.add(item.id());if(old!=null&&!old.deleted())for(var item:old.input().items())allowed.add(item.id());
  if(request.input().metrics()!=null)allowed.addAll(readSelection(member).keys());
  if(input.items().stream().anyMatch(i->!allowed.contains(i.id())))throw new HealthException(409,"관리항목 선택이 변경되었습니다. 현재 선택과 기록을 다시 확인하세요.");
  long next=revision+1;var now=LocalDateTime.now(ZoneOffset.UTC);
  if(old==null)jdbc.update("INSERT INTO health_daily_records(member_id,record_date,revision,deleted,consent_event_id,weight,sys,dia,bp_context,bp_time,weight_time,day_note,updated_at) VALUES (?,?,?,FALSE,?,?,?,?,?,?,?,?,?)",member,Date.valueOf(request.date()),next,request.consentEventId(),input.weight(),input.sys(),input.dia(),input.bpContext(),input.bpTime(),input.weightTime(),input.note(),now);
  else jdbc.update("UPDATE health_daily_records SET revision=?,deleted=FALSE,consent_event_id=?,weight=?,sys=?,dia=?,bp_context=?,bp_time=?,weight_time=?,day_note=?,updated_at=? WHERE id=? AND member_id=?",next,request.consentEventId(),input.weight(),input.sys(),input.dia(),input.bpContext(),input.bpTime(),input.weightTime(),input.note(),now,old.id(),member);
  var metrics=input.metrics()==null?new Metrics(null,null,null,null,null):input.metrics();
  var clinical=metrics.clinical()==null?Clinical.EMPTY:metrics.clinical();
  jdbc.update("UPDATE health_daily_records SET step_count=?,walking_minutes=?,fasting_glucose=?,waist=?,sleep_hours=?,height_cm=?,total_cholesterol=?,ldl=?,hdl=?,triglycerides=? WHERE member_id=? AND record_date=?",
   metrics.steps(),metrics.walkingMinutes(),metrics.fastingGlucose(),metrics.waist(),metrics.sleepHours(),clinical.height(),clinical.totalCholesterol(),clinical.ldl(),clinical.hdl(),clinical.triglycerides(),member,Date.valueOf(request.date()));
  var saved=read(member,request.date());jdbc.update("DELETE FROM health_daily_practices WHERE daily_id=?",saved.id());
  for(var item:input.items())jdbc.update("INSERT INTO health_daily_practices(daily_id,action_id,practice_status,practice_note) VALUES (?,?,?,?)",saved.id(),item.id(),item.status(),item.note());
  receipt(member,request.requestId(),request.date(),"SAVE",next);return view(request.date(),read(member,request.date()));
 }
 public Day delete(long member,Delete request){
  if(request==null||request.requestId()==null||request.expectedRevision()==null||request.expectedRevision()<1||request.consentEventId()==null)throw HealthException.invalid();
  require(member,request.consentEventId());date(request.date());var old=read(member,request.date());var prior=receipt(member,request.requestId());
  if(prior!=null){if(!prior.date().equals(request.date())||!prior.operation().equals("DELETE")||old==null||!old.deleted()||old.revision()!=prior.revision())throw HealthException.conflict();return view(request.date(),old);}
  if(old==null||old.deleted()||old.revision()!=request.expectedRevision())throw HealthException.conflict();
  jdbc.update("DELETE FROM health_daily_practices WHERE daily_id=?",old.id());
  jdbc.update("UPDATE health_daily_records SET revision=revision+1,deleted=TRUE,weight=NULL,sys=NULL,dia=NULL,step_count=NULL,walking_minutes=NULL,fasting_glucose=NULL,waist=NULL,sleep_hours=NULL,height_cm=NULL,total_cholesterol=NULL,ldl=NULL,hdl=NULL,triglycerides=NULL,bp_context='UNKNOWN',bp_time='UNKNOWN',weight_time='UNKNOWN',day_note='',updated_at=? WHERE id=? AND member_id=?",LocalDateTime.now(ZoneOffset.UTC),old.id(),member);
  receipt(member,request.requestId(),request.date(),"DELETE",old.revision()+1);return view(request.date(),read(member,request.date()));
 }
}
