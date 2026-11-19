package com.onrender.smartnf.demo.local;
import java.util.*;import java.time.LocalDate;
import com.onrender.smartnf.health.*;
/** Fictional everyday menus. Confirmed reference components, never complete recipes or intake estimates. */
public final class LocalDemoMeals {
 private LocalDemoMeals(){}
 private record Menu(String name,List<Integer> refs){}
 private static Menu m(String name,Integer... refs){return new Menu(name,List.of(refs));}
 private static final List<Menu> BREAKFAST=List.of(m("집에서 먹은 밥·삶은 달걀·김",0,1,16),m("식빵·우유·사과",13,2,3),m("밥·콩나물국·배추김치",0,14,12),m("삶은 감자·삶은 달걀·우유",15,1,2),m("바쁜 아침, 우유와 사과",2,3),m("밥·시금치나물·김",0,5,16),m("집에서 만든 달걀 샌드위치",13,1,8),m("밥·두부 반찬·김치",0,4,12));
 private static final List<Menu> LUNCH=List.of(m("회사 식당 백반: 밥·구운 고등어·김치",0,11,12),m("닭고기 샐러드와 식빵",10,7,8,9,13),m("외식 비빔밥 · 재료 확인 못함"),m("김밥 · 속재료 확인 못함"),m("집밥: 밥·두부·데친 채소",0,4,5,6),m("잔치국수 · 고명/육수 재료 확인 못함"),m("외식 제육볶음 정식 · 재료 확인 못함"),m("밥·삶은 닭가슴살·생채소",0,10,7,9));
 private static final List<Menu> DINNER=List.of(m("밥·된장찌개·반찬 · 찌개 재료 확인 못함",0),m("집에서 먹은 밥·구운 고등어·콩나물",0,11,14),m("두부와 삶은 달걀을 넣은 채소 샐러드",4,1,7,8,9),m("밥·시금치나물·김치",0,5,12),m("가족과 먹은 닭볶음탕 · 배합 확인 못함"),m("주말 외식: 칼국수 · 재료 확인 못함"),m("밥·두부·삶은 감자·김",0,4,15,16),m("배달 음식 · 재료/조리 상태 확인 못함"));
 public static Map<LocalDate,List<MealModels.Input>> days(int person){
  var out=new LinkedHashMap<LocalDate,List<MealModels.Input>>();
  for(int d=0;d<8;d++){
   if(person==5&&Set.of(1,3,5).contains(d))continue;
   var items=new ArrayList<MealModels.Input>();int shift=person-1;
   var menus=List.of(BREAKFAST.get((d+shift)%8),LUNCH.get((d+2*shift)%8),DINNER.get((d+3*shift)%8));
   for(int n=0;n<3;n++){
    var menu=menus.get(n);var ids=menu.refs().stream().map(i->MealCatalog.FOODS.get(i).id()).toList();
    items.add(new MealModels.Input(List.of("breakfast","lunch","dinner").get(n),menu.name(),List.of("08:00","12:30","18:30").get(n),"[가상] 일상 식사 예시 · 표시 재료만 확인한 설정이며 양념·조리유·전체 배합은 미확인",ids,!ids.isEmpty()));
   }
   if((d+person)%2!=0){var snack=d%2==0?m("오후 간식으로 먹은 사과",3):m("간식 빵 · 제품/재료 확인 못함");var ids=snack.refs().stream().map(i->MealCatalog.FOODS.get(i).id()).toList();items.add(new MealModels.Input("snack",snack.name(),"15:30","[가상] 분량을 측정하지 않은 식사 기록",ids,!ids.isEmpty()));}
   out.put(LocalDemoFixtures.FROM.plusDays(d),List.copyOf(items));
  }
  return out;
 }
}
