package com.onrender.smartnf.web;
import com.onrender.smartnf.health.*;
import java.util.*;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
@Component
public class SimulatorMealCodec {
 private final AiNutritionService ai;private final JsonMapper json=JsonMapper.builder().build();
 public SimulatorMealCodec(AiNutritionService ai){this.ai=ai;}
 public SimulatorPlanModels.Saved capture(long member,SimulatorPlanModels.Input input){
  input=SimulatorPlanModels.validate(input);var ids=input.dishes().stream().flatMap(d->d.ingredients().stream()).map(SimulatorPlanModels.IngredientInput::foodId).filter(id->id.startsWith("ai:")).toList();
  var confirmed=ai.confirmed(member,ids);var dishes=new ArrayList<SimulatorPlanModels.Dish>();var amounts=new ArrayList<RecipeNutritionController.Ingredient>();
  for(var dish:input.dishes()){
   var ingredients=new ArrayList<SimulatorPlanModels.Ingredient>();
   for(var item:dish.ingredients()){
    if(item.foodId().startsWith("ai:")){
     var e=confirmed.get(item.foodId());if(e==null)throw new HealthException(400,"이 계정에서 사용 중인 AI 보완 자료를 확인한 뒤 다시 저장해 주세요.");
     ingredients.add(new SimulatorPlanModels.Ingredient(e.id(),e.name(),item.grams(),e.aiKeys().isEmpty()?"공공 DB 연결 기준":"AI 추정 자료 포함",e.model(),e.model(),e.createdAt(),e.referenceFoodId(),e.aiKeys(),e.nutrients(),item.quantities()));
    }else{
     var food=MealCatalog.find(item.foodId());if(!food.basis().startsWith("100g"))throw HealthException.invalid();
     ingredients.add(new SimulatorPlanModels.Ingredient(food.id(),food.name(),item.grams(),food.source(),food.version(),"","",food.id(),List.of(),food.nutrients(),item.quantities()));
    }
    amounts.add(new RecipeNutritionController.Ingredient(item.foodId(),item.grams()));
   }dishes.add(new SimulatorPlanModels.Dish(dish.name(),dish.servings(),List.copyOf(ingredients)));
  }
  var result=RecipeNutritionController.calculate(new RecipeNutritionController.Meal("저장한 한 끼",1,amounts),true,confirmed);
  return new SimulatorPlanModels.Saved(input,List.copyOf(dishes),result.nutrients(),result.coverage(),result.aiCoverage(),result.total(),java.time.Instant.now().toString());
 }
 public String encode(SimulatorPlanModels.Saved value){return json.writeValueAsString(value);}
 public SimulatorPlanModels.Saved decode(String value){return json.readValue(value,SimulatorPlanModels.Saved.class);}
 public static String inputHash(SimulatorPlanModels.Input value){Object canonical=value;
  if(value.dishes().stream().flatMap(d->d.ingredients().stream()).allMatch(i->i.quantities()==null||i.quantities().isEmpty())){
   var body=new LinkedHashMap<String,Object>();body.put("meal",value.meal());var dishes=new ArrayList<Object>();for(var d:value.dishes()){var dish=new LinkedHashMap<String,Object>();dish.put("name",d.name());dish.put("servings",d.servings());var items=new ArrayList<Object>();for(var i:d.ingredients()){var item=new LinkedHashMap<String,Object>();item.put("foodId",i.foodId());item.put("grams",i.grams());items.add(item);}dish.put("ingredients",items);dishes.add(dish);}body.put("dishes",dishes);canonical=body;
  }return MyRecipeService.fingerprint(JsonMapper.builder().build().writeValueAsString(canonical));}
}
