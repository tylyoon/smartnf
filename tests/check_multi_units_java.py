"""Compile real changed models/services against minimal framework signatures; run pure unit contracts.
No actual Spring context or MySQL transaction is implied by this offline check.
"""
from pathlib import Path
import tempfile,subprocess
root=Path(__file__).resolve().parents[1];java=root/'src/main/java/com/onrender/smartnf/health'
with tempfile.TemporaryDirectory() as temp:
 d=Path(temp)
 for name in ['ShoppingListModels','ShoppingListService','ShoppingProductService','HealthException','ProductQuantity','KakaoProductSnapshots','PriceReferenceService','ScheduledPriceCatalog','IngredientPricePolicy','SimulatorPlanModels']:(d/(name+'.java')).write_text((java/(name+'.java')).read_text())
 (d/'SimulatorMealCodec.java').write_text((root/'src/main/java/com/onrender/smartnf/web/SimulatorMealCodec.java').read_text())
 src=(java/'IngredientProductService.java').read_text();record=src[src.index(' public record Product('):src.index(' public record Result(')]
 (d/'IngredientProductService.java').write_text('package com.onrender.smartnf.health;import java.math.*;import java.util.*;public class IngredientProductService{'+record+'}')
 stubs={
 'Service.java':'package org.springframework.stereotype;public @interface Service{}',
 'Transactional.java':'package org.springframework.transaction.annotation;public @interface Transactional{boolean readOnly() default false;}',
 'DuplicateKeyException.java':'package org.springframework.dao;public class DuplicateKeyException extends RuntimeException{}',
 'RowMapper.java':'package org.springframework.jdbc.core;public interface RowMapper<T>{T mapRow(java.sql.ResultSet rs,int n)throws java.sql.SQLException;}',
 'RowCallbackHandler.java':'package org.springframework.jdbc.core;public interface RowCallbackHandler{void processRow(java.sql.ResultSet rs)throws java.sql.SQLException;}',
 'JdbcTemplate.java':'''package org.springframework.jdbc.core;import java.util.*;public class JdbcTemplate{
 public <T> List<T> query(String sql,RowMapper<T> mapper,Object...args){throw new UnsupportedOperationException();}
 public void query(String sql,RowCallbackHandler mapper,Object...args){throw new UnsupportedOperationException();}
 public <T> List<T> queryForList(String sql,Class<T> type,Object...args){throw new UnsupportedOperationException();}
 public List<Map<String,Object>> queryForList(String sql,Object...args){throw new UnsupportedOperationException();}
 public Map<String,Object> queryForMap(String sql,Object...args){throw new UnsupportedOperationException();}
 public int update(String sql,Object...args){throw new UnsupportedOperationException();}}
 ''',
 'CollectedProductService.java':'package com.onrender.smartnf.health;public class CollectedProductService{static boolean officialUrl(String s){return false;}}'
 }
 stubs.update({
 'Component.java':'package org.springframework.stereotype;public @interface Component{}',
 'JsonMapper.java':'package tools.jackson.databind.json;public class JsonMapper{public static JsonMapper builder(){return new JsonMapper();}public JsonMapper build(){return this;}public String writeValueAsString(Object v){return "";}public <T>T readValue(String s,Class<T> c){return null;}}',
 'MyRecipeService.java':'package com.onrender.smartnf.web;public class MyRecipeService{public static String fingerprint(String s){return s;}}',
 'AiNutritionService.java':'''package com.onrender.smartnf.web;import java.util.*;import java.math.*;public class AiNutritionService{public record Estimate(String id,String name,String model,String createdAt,String referenceFoodId,List<String> aiKeys,Map<String,BigDecimal> nutrients){}public Map<String,Estimate> confirmed(long member,List<String> ids){return Map.of();}}''',
 'MealCatalog.java':'''package com.onrender.smartnf.health;import java.util.*;import java.math.*;public class MealCatalog{public record Food(String id,String name,String basis,String source,String version,Map<String,BigDecimal> nutrients){}public static Food find(String id){return null;}}''',
 'RecipeNutritionController.java':'''package com.onrender.smartnf.web;import java.util.*;import java.math.*;public class RecipeNutritionController{public record Ingredient(String id,BigDecimal grams){}public record Meal(String name,int servings,List<Ingredient> ingredients){}public record Analysis(Map<String,BigDecimal> nutrients,Map<String,Integer> coverage,Map<String,Integer> aiCoverage,int total){}public static Analysis calculate(Meal m,boolean b,Map<String,AiNutritionService.Estimate> ai){return null;}}'''
 })
 for name,content in stubs.items():(d/name).write_text(content)
 (d/'MultiUnitCheck.java').write_text('''package com.onrender.smartnf.health;import java.util.*;import java.time.*;import java.math.*;
public class MultiUnitCheck{
 static int n;static void ok(boolean value){n++;if(!value)throw new AssertionError("check "+n);}
 static ShoppingListModels.Save body(ShoppingListModels.Item item){return new ShoppingListModels.Save(UUID.randomUUID(),UUID.randomUUID(),0L,LocalDate.now(),LocalDate.now(),LocalDate.now(),"WEEK",List.of(item));}
 public static void main(String[]args)throws Exception{
 var two=new ShoppingListModels.Measure(new BigDecimal("2"),"ea","레시피 원문 계란2개");
 var item=new ShoppingListModels.Item("egg","계란",new BigDecimal("100"),List.of(two));var checked=ShoppingListModels.validate(body(item)).items().getFirst();ok(checked.grams().intValue()==100);ok(ShoppingListModels.required(checked,"ea").intValue()==2);
 var countOnly=ShoppingListModels.validate(body(new ShoppingListModels.Item("egg","계란",null,List.of(two)))).items().getFirst();ok(countOnly.grams()==null);ok(ShoppingListModels.required(countOnly,"ea").intValue()==2);
 try{ShoppingListModels.validate(body(new ShoppingListModels.Item("egg","계란",null,List.of(two,two))));throw new AssertionError();}catch(HealthException e){ok(true);}
 try{ShoppingListModels.validate(body(new ShoppingListModels.Item("egg","계란",null,List.of(new ShoppingListModels.Measure(BigDecimal.ONE,"ea","")))));throw new AssertionError();}catch(HealthException e){ok(true);}
 ok(ProductQuantity.parse("계란 특란 30구").amount().intValue()==30);ok(ProductQuantity.parse("계란10개").unit().equals("ea"));ok(ProductQuantity.parse("난각번호1번 계란")==null);ok(ProductQuantity.parse("계란 10개×2").amount().intValue()==20);
 ok(ProductQuantity.quantities("계란 10개 (500g)").size()==2);ok(ProductQuantity.quantities("계란 10개 (500g)").stream().anyMatch(q->q.unit().equals("ea")&&q.amount().intValue()==10));
 var raw=new IngredientProductService.Product("raw","계란 10개 (500g)","농장",new BigDecimal("5000"),new BigDecimal("500"),"https://shoppinghow.kakao.com/go.daum?x=1","미확인",Instant.now().toString(),"API","KAKAO","DISPLAY","표시가","","","");
 var p=KakaoProductSnapshots.issue(1,List.of(raw)).getFirst();var save=new ShoppingProductService.Save(UUID.randomUUID(),0,1,0,UUID.randomUUID(),p.id(),p.name(),p.merchant(),null,p.price(),1,p.url(),p.checkedAt(),true,"ea",new BigDecimal("2"),new BigDecimal("10"));
 ok(ShoppingProductService.validate(save).packGrams()==null);ok(KakaoProductSnapshots.require(1,save).quantities().size()==2);
 try{KakaoProductSnapshots.require(2,save);throw new AssertionError();}catch(HealthException e){ok(true);}
 var sim=SimulatorPlanModels.validate(new SimulatorPlanModels.Input("breakfast",List.of(new SimulatorPlanModels.DishInput("달걀요리",BigDecimal.ONE,List.of(new SimulatorPlanModels.IngredientInput("egg",new BigDecimal("100"),List.of(two)))))));ok(sim.dishes().getFirst().ingredients().getFirst().quantities().getFirst().amount().intValue()==2);ok(sim.dishes().getFirst().ingredients().getFirst().grams().intValue()==100);
 ok(ProductQuantity.parse("계란(10구) · XL10구 · 등급란").amount().intValue()==10);
 var refs=new PriceReferenceService(java.nio.file.Path.of(args[0]));var quotes=refs.search("계란",new BigDecimal("2"),"ea").references();ok(quotes.stream().anyMatch(q->q.estimated()!=null&&q.unit().equals("ea")));
 ok(ProductQuantity.parse("서울우유 멸균 우유 1000ml · 10개").amount().intValue()==10000);
 var optionRaw=new IngredientProductService.Product("raw","양송이버섯 1kg/2kg 골라담기","농장",new BigDecimal("9810"),null,"https://shoppinghow.kakao.com/go.daum?x=2","미확인",Instant.now().toString(),"API","KAKAO","DISPLAY","옵션별 가격","","","");
 var op=KakaoProductSnapshots.issue(1,List.of(optionRaw)).getFirst();var os=new ShoppingProductService.Save(UUID.randomUUID(),0,1,0,UUID.randomUUID(),op.id(),op.name(),op.merchant(),new BigDecimal("1000"),new BigDecimal("9630"),1,op.url(),op.checkedAt(),true,"g",new BigDecimal("40"),new BigDecimal("1000"),"파지 1kg",true);
 ok(ShoppingProductService.validate(os).optionPriceConfirmed());ok(KakaoProductSnapshots.require(1,os).price().intValue()==9810);
 var unconfirmed=new ShoppingProductService.Save(os.listId(),0,1,0,os.requestId(),op.id(),op.name(),op.merchant(),os.packGrams(),op.price(),1,op.url(),op.checkedAt(),true,"g",os.requiredAmount(),os.packageAmount());
 try{KakaoProductSnapshots.require(1,unconfirmed);throw new AssertionError();}catch(HealthException e){ok(true);}
 var ordinary=new ShoppingProductService.Save(save.listId(),0,1,0,save.requestId(),p.id(),p.name(),p.merchant(),new BigDecimal("1000"),new BigDecimal("1"),1,p.url(),p.checkedAt(),true,"g",new BigDecimal("40"),new BigDecimal("1000"),"할인",true);
 try{KakaoProductSnapshots.require(1,ordinary);throw new AssertionError();}catch(HealthException e){ok(true);}
 System.out.println("Multi-unit Java contracts: "+n+" PASS; changed services compile; framework/DB runtime isolated");
 }}''')
 subprocess.run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-d',str(d),*[str(f) for f in d.glob('*.java')]],check=True)
 subprocess.run(['java','-cp',str(d),'com.onrender.smartnf.health.MultiUnitCheck',str(root/'data/price-reference')],check=True)
