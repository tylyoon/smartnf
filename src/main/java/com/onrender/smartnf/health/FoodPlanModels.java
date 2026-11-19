package com.onrender.smartnf.health;
import java.util.*;import java.time.*;
public final class FoodPlanModels {
 private FoodPlanModels(){}
 public static final String DOCUMENT="dev-plan-20261104";
 public record Item(String foodId,String recipeId,List<Integer> ingredientIndices,String recipeVersion){public Item(String foodId,String recipeId,List<Integer> indices){this(foodId,recipeId,indices,"");}}
 public record Input(String type,String restaurant,String time,String note,List<Item> items,String scope,List<String> management,SimulatorPlanModels.Input simulation){
 public Input(String type,String restaurant,String time,String note,List<Item> items,String scope,List<String> management){this(type,restaurant,time,note,items,scope,management,null);}
 public Input(String type,String restaurant,String time,String note,List<Item> items){this(type,restaurant,time,note,items,"GENERAL",List.of(),null);}}

 public record Save(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date,List<Input> plans){}
 public record Delete(UUID requestId,Long expectedRevision,Long consentEventId,LocalDate date){}
 public record Consent(boolean agreed,Long eventId,String documentVersion){}
 public record ConsentChange(String documentVersion,String decision,Long expectedEventId){}
 public record Ingredient(int index,String text){}
 public record Food(String foodId,String kind,String name,String basis,String source,String version,String recipeId,String recipeName,String recipeSource,String recipeVersion,List<Ingredient> ingredients){}
 public record Plan(String type,String restaurant,String time,String note,List<Food> items,String scope,List<String> management,SimulatorPlanModels.Saved simulation){public Plan(String type,String restaurant,String time,String note,List<Food> items,String scope,List<String> management){this(type,restaurant,time,note,items,scope,management,null);}}

 public record Day(LocalDate date,long revision,List<Plan> plans){}
 public record Count(LocalDate date,int shopping,int dining,int health,int choice){}
 public record Move(UUID requestId,Long sourceRevision,Long targetRevision,Long consentEventId,LocalDate sourceDate,LocalDate targetDate,Integer sourceEntry,List<String> foodIds,String type,String restaurant,String time,String note){}
 public static void date(LocalDate date){if(date==null||date.isBefore(LocalDate.of(1900,1,1))||date.isAfter(LocalDate.of(2100,12,31)))throw HealthException.invalid();}
 private static String text(String s,int max){s=s==null?"":s.strip();if(s.length()>max||s.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'&&c!='\t'))throw HealthException.invalid();return s;}
 public static List<Input> validate(List<Input> plans){
  if(plans==null||plans.isEmpty()||plans.size()>20)throw HealthException.invalid();var out=new ArrayList<Input>();int total=0,tokens=0;
  for(var p:plans){if(p==null||!Set.of("CHOICE","SHOPPING","DINING").contains(p.type()==null?"":p.type())||p.items()==null||(p.simulation()==null&&p.items().isEmpty())||p.items().size()>30)throw HealthException.invalid();total+=p.items().size();if(total>100)throw HealthException.invalid();String time=text(p.time(),5),restaurant=text(p.restaurant(),120);if(!time.isEmpty()&&!time.matches("(?:[01][0-9]|2[0-3]):[0-5][0-9]"))throw HealthException.invalid();if(!p.type().equals("DINING")){restaurant="";time="";}
   String scope=p.scope()==null?"GENERAL":p.scope();var management=p.management()==null?List.<String>of():p.management();
   if(!Set.of("GENERAL","HEALTH").contains(scope)||management.size()>4||new HashSet<>(management).size()!=management.size()||management.stream().anyMatch(x->x==null||!Set.of("bp","diabetes","lipid","weight").contains(x))||scope.equals("HEALTH")&&management.isEmpty()||scope.equals("GENERAL")&&!management.isEmpty())throw HealthException.invalid();
   management=management.stream().sorted().toList();
   if(p.simulation()!=null){if(!p.type().equals("CHOICE")||!scope.equals("GENERAL")||!p.items().isEmpty())throw HealthException.invalid();var simulation=SimulatorPlanModels.validate(p.simulation());tokens+=simulation.dishes().stream().mapToInt(d->d.ingredients().size()).sum();if(tokens>2400)throw HealthException.invalid();out.add(new Input(p.type(),restaurant,time,text(p.note(),500),List.of(),scope,management,simulation));continue;}

   var ids=new HashSet<String>();var items=new ArrayList<Item>();
   for(var item:p.items()){if(item==null||item.foodId()==null||!ids.add(item.foodId())||item.ingredientIndices()==null||item.ingredientIndices().size()>100)throw HealthException.invalid();FoodPlanCatalog.food(item.foodId());var indices=new TreeSet<Integer>();String recipe=text(item.recipeId(),20);if(recipe.isEmpty()&&!item.ingredientIndices().isEmpty())throw HealthException.invalid();var r=recipe.isEmpty()?null:FoodPlanCatalog.recipe(item.foodId(),recipe);if(r!=null&&!r.version().equals(item.recipeVersion()))throw new HealthException(409,"참고 레시피 원문 버전이 바뀌었습니다. 영양정보 화면에서 다시 선택하세요.");
    for(Integer index:item.ingredientIndices())if(index==null||r==null||!r.tokens().containsKey(index)||!indices.add(index))throw HealthException.invalid();tokens+=indices.size();if(tokens>500)throw HealthException.invalid();items.add(new Item(item.foodId(),recipe,List.copyOf(indices),r==null?"":r.version()));
   }out.add(new Input(p.type(),restaurant,time,text(p.note(),500),List.copyOf(items),scope,management));
  }return List.copyOf(out);
 }
}
