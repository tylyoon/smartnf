package com.onrender.smartnf.health;
import java.util.*;import java.time.*;import java.math.BigDecimal;
public final class HealthDailyModels {
 private HealthDailyModels(){}
 public record Practice(String id,String status,String note){}
 public record Input(BigDecimal weight,BigDecimal sys,BigDecimal dia,String bpContext,String bpTime,String weightTime,String note,List<Practice> items,Metrics metrics){
  public Input(BigDecimal weight,BigDecimal sys,BigDecimal dia,String bpContext,String bpTime,String weightTime,String note,List<Practice> items){
   this(weight,sys,dia,bpContext,bpTime,weightTime,note,items,null);
  }
  public Input withMetrics(Metrics value){return new Input(weight,sys,dia,bpContext,bpTime,weightTime,note,items,value);}
 }
 public record Metrics(Integer steps,Integer walkingMinutes,Integer fastingGlucose,BigDecimal waist,BigDecimal sleepHours,Clinical clinical){
  public Metrics(Integer steps,Integer walkingMinutes,Integer fastingGlucose,BigDecimal waist,BigDecimal sleepHours){
   this(steps,walkingMinutes,fastingGlucose,waist,sleepHours,null);
  }
  public Metrics withClinical(Clinical value){return new Metrics(steps,walkingMinutes,fastingGlucose,waist,sleepHours,value);}
 }
 public record Clinical(BigDecimal height,BigDecimal totalCholesterol,BigDecimal ldl,BigDecimal hdl,BigDecimal triglycerides){
  public static final Clinical EMPTY=new Clinical(null,null,null,null,null);
 }
 public record Selection(long revision,List<String> keys){}
 public record SaveSelection(Long expectedRevision,Long consentEventId,List<String> keys){}
 public static final Set<String> MEASUREMENTS=Set.of("steps","walkingMinutes","fastingGlucose","waist","sleepHours","weight","bp","bmi","totalCholesterol","ldl","hdl","triglycerides");
 public static boolean action(String key){return HealthFields.SUPPORTED.values().stream().anyMatch(ids->ids.contains(key));}
 private static void bound(Integer value,int min,int max){if(value!=null&&(value<min||value>max))throw HealthException.invalid();}
 private static BigDecimal decimal(BigDecimal value,int min,int max){
  if(value==null)return null;
  var normalized=value.stripTrailingZeros();
  if(normalized.scale()>1||normalized.compareTo(BigDecimal.valueOf(min))<0||normalized.compareTo(BigDecimal.valueOf(max))>0)throw HealthException.invalid();
  return normalized;
 }
 private static Metrics metrics(Metrics m){
  if(m==null)return null;
  bound(m.steps(),0,200000);bound(m.walkingMinutes(),0,1440);bound(m.fastingGlucose(),1,1500);
  var waist=decimal(m.waist(),1,400);var sleep=decimal(m.sleepHours(),0,24);
  var c=m.clinical();
  var clinical=c==null?Clinical.EMPTY:new Clinical(decimal(c.height(),1,300),decimal(c.totalCholesterol(),1,9999),
   decimal(c.ldl(),0,9999),decimal(c.hdl(),0,9999),decimal(c.triglycerides(),0,9999));
  if(clinical.equals(Clinical.EMPTY))clinical=null;
  return m.steps()==null&&m.walkingMinutes()==null&&m.fastingGlucose()==null&&waist==null&&sleep==null&&clinical==null?null:new Metrics(m.steps(),m.walkingMinutes(),m.fastingGlucose(),waist,sleep,clinical);
 }
 public record Save(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date,Input input){}
 public record Delete(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date){}
 public record Entry(LocalDate date,long revision,String savedAt,Input input){}
 public record Day(LocalDate date,long revision,Entry record){}
 public static LocalDate today(){return LocalDate.now(ZoneId.of("Asia/Seoul"));}
 public static void date(LocalDate d){if(d==null||d.isBefore(LocalDate.of(1900,1,1))||d.isAfter(today()))throw HealthException.invalid();}
 private static String text(String s,int max){if(s==null)return "";s=s.strip();if(s.length()>max||s.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'&&c!='\t'))throw HealthException.invalid();return s;}
 public static Input validate(Input input){
  if(input==null||input.items()==null||input.items().size()>10)throw HealthException.invalid();
  BigDecimal w=input.weight()==null?null:input.weight().stripTrailingZeros();
  if(w!=null&&(w.scale()>1||w.compareTo(BigDecimal.ONE)<0||w.compareTo(new BigDecimal("400"))>0))throw HealthException.invalid();
  if((input.sys()==null)!=(input.dia()==null))throw HealthException.invalid();
  BigDecimal sys=input.sys()==null?null:input.sys().stripTrailingZeros(),dia=input.dia()==null?null:input.dia().stripTrailingZeros();
  if(sys!=null&&(sys.scale()>0||dia.scale()>0||sys.compareTo(new BigDecimal("30"))<0||sys.compareTo(new BigDecimal("300"))>0||dia.compareTo(new BigDecimal("20"))<0||dia.compareTo(new BigDecimal("200"))>0||sys.compareTo(dia)<0))throw HealthException.invalid();
  if(!Set.of("UNKNOWN","HOME","CLINIC").contains(input.bpContext()==null?"":input.bpContext())||!Set.of("UNKNOWN","AM","PM").contains(input.bpTime()==null?"":input.bpTime())||!Set.of("UNKNOWN","AM","PM").contains(input.weightTime()==null?"":input.weightTime()))throw HealthException.invalid();
  var items=new TreeMap<String,Practice>();
  for(var item:input.items()){
   if(item==null||item.id()==null||HealthFields.SUPPORTED.values().stream().noneMatch(ids->ids.contains(item.id()))||!Set.of("DONE","PARTIAL","NOT_DONE","UNRECORDED").contains(item.status()==null?"":item.status()))throw HealthException.invalid();
   String note=text(item.note(),500);if(items.put(item.id(),new Practice(item.id(),item.status(),note))!=null)throw HealthException.invalid();
  }
  var list=items.values().stream().filter(i->!i.status().equals("UNRECORDED")||!i.note().isEmpty()).toList();String note=text(input.note(),1000);
  var metrics=metrics(input.metrics());
  if(w==null&&input.sys()==null&&note.isEmpty()&&list.isEmpty()&&metrics==null)throw new HealthException(400,"측정값 또는 실천 내용을 입력하세요.");
  return new Input(w,sys,dia,input.sys()==null?"UNKNOWN":input.bpContext(),input.sys()==null?"UNKNOWN":input.bpTime(),w==null?"UNKNOWN":input.weightTime(),note,list,metrics);
 }
}
