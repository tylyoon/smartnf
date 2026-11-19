package com.onrender.smartnf.health;
import java.util.*;import java.math.BigDecimal;import java.time.*;
public final class MealModels {
 private MealModels(){}
 public record Input(String meal,String name,String time,String note,List<String> ingredientIds,boolean ingredientsConfirmed){}
 public record Ingredient(String foodId,String name,String kind,String version,String source,Map<String,BigDecimal> nutrients,String basis){}
 public record Row(String meal,String name,String time,String note,List<Ingredient> ingredients,boolean ingredientsConfirmed,boolean legacy){}
 public record Day(LocalDate date,long revision,List<Row> items){}
 public record Save(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date,List<Input> items){}
 public record Delete(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date){}
 private static String text(String s,int max){if(s==null)return "";s=s.strip();if(s.length()>max||s.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'&&c!='\t'))throw HealthException.invalid();return s;}
 public static List<Input> validate(List<Input> items){
  if(items==null||items.isEmpty()||items.size()>50)throw HealthException.invalid();var out=new ArrayList<Input>();
  for(var i:items){
   if(i==null||i.meal()==null||!Set.of("breakfast","lunch","dinner","snack").contains(i.meal())||i.ingredientIds()==null||i.ingredientIds().size()>20)throw HealthException.invalid();
   String name=text(i.name(),120);if(name.isBlank())throw HealthException.invalid();
   String time=text(i.time(),5);if(!time.isEmpty()&&!time.matches("(?:[01][0-9]|2[0-3]):[0-5][0-9]"))throw HealthException.invalid();
   var ids=new TreeSet<String>();for(String id:i.ingredientIds()){if(id==null||!ids.add(id))throw HealthException.invalid();MealCatalog.find(id);}
   if(!ids.isEmpty()&&!i.ingredientsConfirmed())throw new HealthException(400,"음식에 들어간 것으로 확인한 재료만 선택하고 확인란을 체크해 주세요.");
   out.add(new Input(i.meal(),name,time,text(i.note(),500),List.copyOf(ids),!ids.isEmpty()&&i.ingredientsConfirmed()));
  }
  return List.copyOf(out);
 }
 public static String hash(String op,LocalDate date,Long revision,Long event,List<Input> items){
  var m=new TreeMap<String,List<String>>();m.put("request",List.of("INGREDIENT_REFS_V1",op,date.toString(),revision.toString(),event.toString()));
  for(int n=0;n<items.size();n++){var i=items.get(n);var values=new ArrayList<String>(List.of(i.meal(),i.name(),i.time(),i.note(),String.valueOf(i.ingredientsConfirmed())));values.addAll(i.ingredientIds());m.put("item"+n,values);}
  return HealthValidation.hash(m);
 }
}
