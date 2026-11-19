package com.onrender.smartnf.health;
import java.util.*;import java.nio.charset.StandardCharsets;
/** Server-side allowlist copied from the same public manifest and reviewed recipes. */
public final class FoodPlanCatalog {
 private FoodPlanCatalog(){}
 public record Food(String id,String kind,String name,String basis,String source,String version){}
 public record Recipe(String id,String name,String version,String source,Map<Integer,String> tokens){}
 private static final Map<String,Food> foods=new LinkedHashMap<>();private static final Map<String,Recipe> recipes=new HashMap<>();private static final Map<String,Set<String>> links=new HashMap<>();
 private static String decode(String s){return new String(Base64.getDecoder().decode(s),StandardCharsets.UTF_8);}
 static{try(var stream=FoodPlanCatalog.class.getResourceAsStream("/food-plan-catalog.tsv")){
  if(stream==null)throw new IllegalStateException("Missing food plan catalog");
  try(var reader=new java.io.BufferedReader(new java.io.InputStreamReader(stream,StandardCharsets.UTF_8))){for(String line;(line=reader.readLine())!=null;){var a=line.split("\t",-1);switch(a[0]){
   case "F"->{if(foods.put(a[1],new Food(a[1],a[2],decode(a[3]),decode(a[4]),decode(a[5]),decode(a[6])))!=null)throw new IllegalStateException("Duplicate food");}
   case "R"->recipes.put(a[1],new Recipe(a[1],decode(a[2]),decode(a[3]),decode(a[4]),new TreeMap<>()));
   case "T"->recipes.get(a[1]).tokens().put(Integer.parseInt(a[2]),decode(a[3]));
   case "L"->links.computeIfAbsent(a[1],k->new HashSet<>()).add(a[2]);default->throw new IllegalStateException("Invalid catalog");
  }}}
 }catch(java.io.IOException e){throw new java.io.UncheckedIOException(e);}}
 public static Food food(String id){var f=foods.get(id);if(f==null)throw new HealthException(400,"현재 원자료에서 확인할 수 없는 식품입니다. 영양정보 화면에서 다시 선택하세요.");return f;}
 public static Recipe recipe(String food,String id){if(!links.getOrDefault(food,Set.of()).contains(id)||!recipes.containsKey(id))throw new HealthException(400,"이 음식의 확인 가능한 참고 레시피가 아닙니다.");return recipes.get(id);}
}
