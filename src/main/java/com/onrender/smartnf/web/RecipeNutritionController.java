package com.onrender.smartnf.web;

import com.onrender.smartnf.health.HealthException;
import com.onrender.smartnf.health.CurrentHealthMember;
import org.springframework.security.core.Authentication;
import com.onrender.smartnf.health.MealCatalog;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RecipeNutritionController {
    private final AiNutritionService ai; private final CurrentHealthMember current;
    public RecipeNutritionController(AiNutritionService ai,CurrentHealthMember current){this.ai=ai;this.current=current;}
    private record NutritionFood(Map<String,BigDecimal> nutrients,java.util.Set<String> aiKeys) {}
    private static final List<String> KEYS = List.of(
            "energy", "carbohydrate", "protein", "fat", "sodium", "fiber", "saturated_fat", "sugars");
    public record Ingredient(String foodId, BigDecimal grams) {}
    public record Meal(String name, int servings, List<Ingredient> ingredients) {}
    public record Request(List<Meal> meals, Boolean estimate) {
        public Request(List<Meal> meals) { this(meals, false); }
    }
    public record Analysis(String name, Map<String, BigDecimal> nutrients, int matched, int total, Map<String, Integer> coverage,Map<String,Integer> aiCoverage) {
        public Analysis(String name,Map<String,BigDecimal> nutrients,int matched,int total,Map<String,Integer> coverage){this(name,nutrients,matched,total,coverage,Map.of());}
    }

    @PostMapping("/api/recipes/nutrition")
    public ResponseEntity<List<Analysis>> analyze(Authentication auth,@RequestBody Request request) {
        if (request == null || request.meals() == null || request.meals().isEmpty() || request.meals().size() > 5) {
            throw invalid();
        }
        var ids=new java.util.HashSet<String>();
        for(var meal:request.meals())if(meal!=null&&meal.ingredients()!=null)for(var ingredient:meal.ingredients())if(ingredient!=null&&ingredient.foodId()!=null&&ingredient.foodId().startsWith("ai:"))ids.add(ingredient.foodId());
        if(ids.size()>600)throw invalid();
        Map<String,AiNutritionService.Estimate> confirmed=Map.of();
        if(!ids.isEmpty())try{confirmed=ai.confirmed(current.id(auth),ids);}catch(HealthException e){throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(e.status()),e.getMessage());}
        var sources=confirmed;
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(request.meals().stream().map(meal->calculate(meal,Boolean.TRUE.equals(request.estimate()),sources)).toList());
    }

    static Analysis calculate(Meal meal) { return calculate(meal, false); }

    static Analysis calculate(Meal meal, boolean estimate) {return calculate(meal,estimate,Map.of());}
    static Analysis calculate(Meal meal, boolean estimate,Map<String,AiNutritionService.Estimate> aiFoods) {
        if (meal == null || meal.name() == null || meal.name().isBlank() || meal.name().length() > 120
                || meal.servings() < 1 || meal.servings() > 24 || meal.ingredients() == null
                || meal.ingredients().isEmpty() || meal.ingredients().size() > 600) throw invalid();
        var foods = new ArrayList<NutritionFood>();
        int matched = 0;
        for (Ingredient ingredient : meal.ingredients()) {
            if (ingredient == null || ingredient.foodId() == null || ingredient.foodId().isBlank()
                    || ingredient.grams() == null) {
                foods.add(null);
                continue;
            }
            BigDecimal grams = ingredient.grams();
            if (grams.scale() > 24 || grams.scale() < -6 || grams.signum() <= 0
                    || grams.compareTo(BigDecimal.valueOf(50000)) > 0) throw invalid();
            try {
                if(ingredient.foodId().startsWith("ai:")){
                    var ai=aiFoods.get(ingredient.foodId());
                    if(ai==null){foods.add(null);continue;}
                    foods.add(new NutritionFood(ai.nutrients(),new java.util.HashSet<>(ai.aiKeys())));matched++;continue;
                }
                var food = MealCatalog.find(ingredient.foodId());
                if (!food.basis().matches("100g(?: .*)?")) throw invalid();
                foods.add(new NutritionFood(food.nutrients(),java.util.Set.of()));
                matched++;
            } catch (HealthException error) {
                throw invalid();
            }
        }
        Map<String, BigDecimal> values = new LinkedHashMap<>();
        Map<String, Integer> coverage = new LinkedHashMap<>();
        Map<String,Integer> aiCoverage=new LinkedHashMap<>();
        for (String key : KEYS) {
            BigDecimal total = BigDecimal.ZERO;
            int covered = 0;int aiCount=0;
            boolean complete = matched == meal.ingredients().size();
            for (int index = 0; index < foods.size(); index++) {
                var food = foods.get(index);
                BigDecimal value = food == null ? null : food.nutrients().get(key);
                if (value == null) {
                    complete = false;
                    continue;
                }
                covered++;if(food.aiKeys().contains(key))aiCount++;
                total = total.add(value.multiply(meal.ingredients().get(index).grams()).movePointLeft(2));
            }
            coverage.put(key, covered);aiCoverage.put(key,aiCount);
            values.put(key, (complete || (estimate && covered > 0)) ? total.divide(BigDecimal.valueOf(meal.servings()), MathContext.DECIMAL128) : null);
        }
        return new Analysis(meal.name(), values, matched, meal.ingredients().size(), coverage,aiCoverage);
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "음식과 분량을 확인해 주세요.");
    }
}
