package com.onrender.smartnf.web;
import java.math.BigDecimal;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class RecipeNutritionEstimateTests {
 @Test void incompleteEstimateHasCoverageAndStrictCalculationRemainsIncomplete(){
  var ingredient=new RecipeNutritionController.Ingredient("rda_10_4:F2050070009a",new BigDecimal("180"));
  var meal=new RecipeNutritionController.Meal("부분 합계",2,Arrays.asList(ingredient,null));
  var strict=RecipeNutritionController.calculate(meal);
  assertNull(strict.nutrients().get("energy"));
  var estimate=RecipeNutritionController.calculate(meal,true);
  assertEquals(0,new BigDecimal("34.2").compareTo(estimate.nutrients().get("energy")));
  assertEquals(1,estimate.coverage().get("energy").intValue());assertEquals(2,estimate.total());
 }
 @Test void noDataIsNotZero(){
  var meal=new RecipeNutritionController.Meal("미연결",1,Arrays.asList((RecipeNutritionController.Ingredient)null));
  var estimate=RecipeNutritionController.calculate(meal,true);
  assertNull(estimate.nutrients().get("energy"));assertEquals(0,estimate.coverage().get("energy").intValue());
 }
 @Test void explicitReferenceMustBelongToOfferedCandidates()throws Exception{
  var catalog=new IngredientMatchCatalog();
  for(String name:new String[]{"김치","돼지고기","소금","다진 마늘","양파","물","대파"}){
   var reference=catalog.reference(name);assertNotNull(reference);assertNotNull(catalog.offered(name,reference.id()));
  }
  assertNull(catalog.reference("알수없는 재료"));
 }
}
