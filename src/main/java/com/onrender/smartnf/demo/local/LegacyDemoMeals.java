package com.onrender.smartnf.demo.local;
import java.util.*;import java.time.LocalDate;import java.math.BigDecimal;
import com.onrender.smartnf.health.*;
/** Partial fictional food logs, not full meals or dietary recommendations. */
final class LegacyDemoMeals {
 private LegacyDemoMeals(){}
 public record Item(String meal,String foodId,String name,BigDecimal grams,String time,String note){}
 public static Map<LocalDate,List<Item>> days(int person){
  var out=new LinkedHashMap<LocalDate,List<Item>>();
  for(int d=0;d<8;d++){
   if(person==5&&Set.of(1,3,5).contains(d))continue;
   var items=new ArrayList<Item>();
   for(int m=0;m<4;m++){
    if(m==3&&(d+person)%2==0)continue;
    var f=MealCatalog.FOODS.get((person+d+m)%5);
    items.add(new Item(List.of("breakfast","lunch","dinner","snack").get(m),f.id(),f.name(),BigDecimal.valueOf(m==3?50:80+(person*10+d*5)%100),List.of("08:00","12:30","18:30","15:00").get(m),"[가상] 기록한 일부 식품 · 식단 추천/하루 전체 섭취량 아님"));
   }
   if(d==2)items.add(new Item("lunch",null,"[가상] 외식 반찬 · 성분 미연결",new BigDecimal("80"),"12:30","소스·조리유 성분 자료 없음"));
   out.put(LocalDemoFixtures.FROM.plusDays(d),List.copyOf(items));
  }
  return out;
 }
}
