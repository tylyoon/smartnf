package com.onrender.smartnf.health;
import java.util.*;
import java.math.BigDecimal;
public final class SimulatorPlanModels {
 private SimulatorPlanModels(){}
 public record IngredientInput(String foodId,BigDecimal grams,List<ShoppingListModels.Measure> quantities){public IngredientInput(String foodId,BigDecimal grams){this(foodId,grams,List.of());}}
 public record DishInput(String name,BigDecimal servings,List<IngredientInput> ingredients){}
 public record Input(String meal,List<DishInput> dishes){}
 public record Ingredient(String foodId,String name,BigDecimal grams,String source,String version,String model,String generatedAt,String referenceFoodId,List<String> aiKeys,Map<String,BigDecimal> nutrients,List<ShoppingListModels.Measure> quantities){public Ingredient(String foodId,String name,BigDecimal grams,String source,String version,String model,String generatedAt,String referenceFoodId,List<String> aiKeys,Map<String,BigDecimal> nutrients){this(foodId,name,grams,source,version,model,generatedAt,referenceFoodId,aiKeys,nutrients,List.of());}}
 public record Dish(String name,BigDecimal servings,List<Ingredient> ingredients){}
 public record Saved(Input input,List<Dish> dishes,Map<String,BigDecimal> nutrients,Map<String,Integer> coverage,Map<String,Integer> aiCoverage,int total,String calculatedAt){}
 public static Input validate(Input input){
  if(input==null||!Set.of("breakfast","lunch","dinner","snack").contains(input.meal()==null?"":input.meal())||input.dishes()==null||input.dishes().isEmpty()||input.dishes().size()>30)throw HealthException.invalid();
  int count=0;var dishes=new ArrayList<DishInput>();
  for(var d:input.dishes()){
   if(d==null||d.name()==null||d.name().isBlank()||d.name().length()>200||d.name().chars().anyMatch(Character::isISOControl)||d.servings()==null||d.servings().signum()<=0||d.servings().compareTo(BigDecimal.TEN)>0||d.servings().scale()>3||d.ingredients()==null||d.ingredients().isEmpty()||d.ingredients().size()>25)throw HealthException.invalid();
   var ingredients=new ArrayList<IngredientInput>();
   for(var i:d.ingredients()){
    if(++count>600||i==null||i.foodId()==null||i.foodId().isBlank()||i.foodId().length()>120||i.grams()==null||i.grams().signum()<=0||i.grams().compareTo(BigDecimal.valueOf(50000))>0||i.grams().scale()>6||i.grams().scale()< -6)throw HealthException.invalid();
    var quantities=new ArrayList<ShoppingListModels.Measure>();var units=new HashSet<String>();
    if(i.quantities()!=null){if(i.quantities().size()>6)throw HealthException.invalid();for(var q:i.quantities()){if(q==null||!ShoppingListModels.positive(q.amount())||!Set.of("g","ml","ea","pack","bag","bottle").contains(q.unit()==null?"":q.unit())||!units.add(q.unit())||q.evidence()==null||q.evidence().isBlank()||q.evidence().length()>300||q.evidence().chars().anyMatch(Character::isISOControl))throw HealthException.invalid();if(q.unit().equals("g")&&q.amount().compareTo(i.grams())!=0)throw HealthException.invalid();quantities.add(new ShoppingListModels.Measure(q.amount().stripTrailingZeros(),q.unit(),q.evidence().strip()));}}
    quantities.sort(Comparator.comparing(ShoppingListModels.Measure::unit));ingredients.add(new IngredientInput(i.foodId(),i.grams().stripTrailingZeros(),List.copyOf(quantities)));
   }dishes.add(new DishInput(d.name().strip(),d.servings().stripTrailingZeros(),List.copyOf(ingredients)));
  }return new Input(input.meal(),List.copyOf(dishes));
 }
}
