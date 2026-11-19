package com.onrender.smartnf.web;
import java.util.*;
import java.nio.file.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import com.onrender.smartnf.health.CurrentHealthMember;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
public class SharedRecipeCheck {
 static void check(boolean b){if(!b)throw new AssertionError();}
 public static String sha2(String value,int bits){if(bits!=256)throw new IllegalArgumentException();return MyRecipeService.fingerprint(value);}
 public static void main(String[] args)throws Exception{
  var source=new DriverManagerDataSource("jdbc:h2:mem:shared;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var j=new JdbcTemplate(source);var tx=new TransactionTemplate(new DataSourceTransactionManager(source));var json=JsonMapper.builder().build();
  j.execute("CREATE ALIAS SHA2 FOR 'com.onrender.smartnf.web.SharedRecipeCheck.sha2'");j.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");j.execute("INSERT INTO members VALUES(1),(2),(3)");
  j.execute("CREATE TABLE my_recipe_sequences(member_id BIGINT PRIMARY KEY,last_number BIGINT)");j.execute("INSERT INTO my_recipe_sequences VALUES(1,7),(2,4)");
  j.execute("CREATE TABLE my_recipes(member_id BIGINT,recipe_number BIGINT,save_key VARCHAR(36),recipe_data TEXT NOT NULL,PRIMARY KEY(member_id,recipe_number),UNIQUE(member_id,save_key),FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE)");
  var recipe=new MyRecipeService.Snapshot("스파게티",2,20,List.of("면 100g","소고기 100g"),List.of("삶기","볶기"));String data=json.writeValueAsString(recipe);UUID key1=UUID.randomUUID(),key2=UUID.randomUUID();
  j.update("INSERT INTO my_recipes VALUES(1,7,?,?)",key1.toString(),data);j.update("INSERT INTO my_recipes VALUES(2,4,?,?)",key2.toString(),data);
  j.execute(Files.readString(Path.of(args[1])));j.execute(Files.readString(Path.of(args[2])));
  var feedback=new RecipeTastePolicy.Feedback(3,true,Map.of("spicy",1),List.of(),5,4,null,null);j.update("INSERT INTO my_recipe_taste(member_id,recipe_number,features_data,feedback_data) VALUES(1,7,'{}',?)",json.writeValueAsString(feedback));j.execute("INSERT INTO my_recipe_prediction VALUES(1,7,'{}',CURRENT_TIMESTAMP)");
  for(String sql:Files.readString(Path.of(args[0])).split(";"))if(!sql.isBlank())j.execute(sql);
  var s=new MyRecipeService(j);check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==1);check(s.list(1).getFirst().number()==7&&s.list(2).getFirst().number()==4);check(s.list(1).getFirst().recipe().equals(recipe));check(j.queryForObject("SELECT COUNT(*) FROM my_recipe_taste",Integer.class)==1);
  check(tx.execute(st->s.save(1,key1,recipe))==7);check(tx.execute(st->s.save(1,UUID.randomUUID(),recipe))==7);
  UUID key3=UUID.randomUUID();check(tx.execute(st->s.save(3,key3,recipe))==1);check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==1);
  var edited=new MyRecipeService.Snapshot("나의 스파게티",2,20,List.of("면 100g","소고기 300g"),recipe.steps());tx.execute(st->s.update(1,7,1,edited));check(s.list(1).getFirst().recipe().equals(edited));check(s.list(2).getFirst().recipe().equals(recipe));String diff=j.queryForObject("SELECT recipe_overrides FROM my_recipes WHERE member_id=1",String.class);check(!diff.contains("steps")&&!diff.contains("servings"));
  try{tx.execute(st->s.update(1,7,1,recipe));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==409);}
  try{tx.execute(st->s.update(2,7,1,recipe));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==404);}
  check(tx.execute(st->s.save(1,key1,recipe))==7); // old request remains idempotent after personal edits
  var prefs=new RecipePreferenceService(new CurrentHealthMember(),j);check(prefs.read(UsernamePasswordAuthenticationToken.authenticated("1","",List.of())).evaluated()==1);
  var variant=new MyRecipeService.Snapshot(recipe.name(),2,20,List.of("면 200g"),recipe.steps());tx.execute(st->s.save(2,UUID.randomUUID(),variant));check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==2);
  long before=j.queryForObject("SELECT COUNT(*) FROM my_recipes",Long.class);
  try{tx.execute(st->{s.saveAll(3,List.of(new MyRecipeService.SaveItem(UUID.randomUUID(),variant),new MyRecipeService.SaveItem(null,recipe)));return null;});throw new AssertionError();}catch(ResponseStatusException good){}check(j.queryForObject("SELECT COUNT(*) FROM my_recipes",Long.class)==before);
  var rollbackRecipe=new MyRecipeService.Snapshot("rollback",1,5,List.of("두부 100g"),List.of("굽기"));
  long libraryBefore=j.queryForObject("SELECT COUNT(*) FROM recipe_library",Long.class);
  try{tx.execute(st->s.saveAll(3,List.of(new MyRecipeService.SaveItem(UUID.randomUUID(),rollbackRecipe),new MyRecipeService.SaveItem(key3,variant))));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==409);}
  check(j.queryForObject("SELECT COUNT(*) FROM my_recipes",Long.class)==before);check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Long.class)==libraryBefore);
  tx.execute(st->s.delete(1,7));check(j.queryForObject("SELECT COUNT(*) FROM my_recipe_taste",Integer.class)==0);check(j.queryForObject("SELECT COUNT(*) FROM my_recipe_prediction",Integer.class)==0);check(s.list(2).getFirst().recipe()!=null);check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==2);
  j.execute("INSERT INTO members VALUES(4),(5)");
  var concurrentRecipe=new MyRecipeService.Snapshot("동시 등록",1,10,List.of("두부 100g"),List.of("굽기"));
  var executor=java.util.concurrent.Executors.newFixedThreadPool(2);
  try{var f1=executor.submit(()->tx.execute(st->s.save(4,UUID.randomUUID(),concurrentRecipe)));var f2=executor.submit(()->tx.execute(st->s.save(5,UUID.randomUUID(),concurrentRecipe)));check(f1.get(10,java.util.concurrent.TimeUnit.SECONDS)==1&&f2.get(10,java.util.concurrent.TimeUnit.SECONDS)==1);}finally{executor.shutdownNow();}
  check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==3);check(s.list(4).getFirst().recipeId().equals(s.list(5).getFirst().recipeId()));
  j.execute("INSERT INTO members VALUES(6),(7)");UUID variantKey=UUID.randomUUID();
  tx.execute(st->s.saveAll(6,List.of(new MyRecipeService.SaveItem(variantKey,edited,recipe))));
  tx.execute(st->s.saveAll(7,List.of(new MyRecipeService.SaveItem(UUID.randomUUID(),variant,recipe))));
  check(s.list(6).getFirst().recipe().equals(edited));check(s.list(7).getFirst().recipe().equals(variant));check(s.list(6).getFirst().recipeId().equals(s.list(7).getFirst().recipeId()));
  check(j.queryForObject("SELECT COUNT(*) FROM recipe_library",Integer.class)==3);
  tx.execute(st->s.saveAll(6,List.of(new MyRecipeService.SaveItem(variantKey,edited,recipe))));check(s.list(6).size()==1);
  var food=com.onrender.smartnf.health.MealCatalog.all().stream().filter(f->f.basis().startsWith("100g")).findFirst().orElseThrow();
  var many=new RecipeNutritionController.Meal("20개 요리",1,Collections.nCopies(500,new RecipeNutritionController.Ingredient(food.id(),java.math.BigDecimal.ONE)));
  check(RecipeNutritionController.calculate(many,true).total()==500);
  System.out.println("PASS: V25 migration deduplicates content, preserves numbers/ratings/predictions; shared save/dedup/idempotency; private differences/revision/owner checks; saved preference join; names do not merge different content; batch validation/rollback; concurrent shared save; personal delete keeps shared original");
 }
}
