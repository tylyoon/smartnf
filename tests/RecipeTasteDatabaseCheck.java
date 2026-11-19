package com.onrender.smartnf.web;
import java.nio.file.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import com.onrender.smartnf.health.CurrentHealthMember;
import static com.onrender.smartnf.web.RecipeTastePolicy.*;
/** Standalone H2 integration harness. CurrentHealthMember is isolated in the harness only. */
public class RecipeTasteDatabaseCheck {
 static void check(boolean value){if(!value)throw new AssertionError();}
 static Authentication auth(String m){return UsernamePasswordAuthenticationToken.authenticated(m,"",List.of());}
 public static void main(String[] args)throws Exception{
  var source=new DriverManagerDataSource("jdbc:h2:mem:taste;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");var jdbc=new JdbcTemplate(source);
  jdbc.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");jdbc.execute("INSERT INTO members VALUES(1),(2)");
  jdbc.execute("CREATE TABLE my_recipe_sequences(member_id BIGINT PRIMARY KEY,last_number BIGINT)");
  jdbc.execute("CREATE TABLE my_recipes(member_id BIGINT, recipe_number BIGINT, save_key VARCHAR(36), recipe_data TEXT, PRIMARY KEY(member_id,recipe_number))");
  jdbc.execute(Files.readString(Path.of(args[0])));
  jdbc.execute(Files.readString(args.length>1?Path.of(args[1]):Path.of(args[0]).resolveSibling("V23__preserve_ai_recipe_prediction.sql")));
  var service=new MyRecipeService(jdbc);var controller=new RecipeTasteController(new CurrentHealthMember(),jdbc,service,false,8091);
  var recipe=new MyRecipeService.Snapshot("두부구이",2,15,List.of("두부 200g","간장 10g"),List.of("굽기"));
  for(int i=0;i<3;i++)service.save(1,UUID.randomUUID(),new MyRecipeService.Snapshot(List.of("두부구이","김치찌개","오이무침").get(i),2,15,recipe.ingredients(),recipe.steps()));service.save(2,UUID.randomUUID(),recipe);
  check(controller.library(auth("1")).getBody().recipes().size()==3);check(controller.library(auth("2")).getBody().recipes().size()==1);
  var features=new Features("한식","겸용",Map.of("spicy",1,"salty",2),"부드러움","","USER");
  var feedback=new Feedback(3,true,Map.of("spicy",1,"salty",2),List.of());
  var legacyJson=tools.jackson.databind.json.JsonMapper.builder().build().readValue("{\"liking\":3,\"again\":true,\"actual\":{},\"adjustments\":[]}",Feedback.class);
  check(likingStars(legacyJson)==5&&againStars(legacyJson)==5);
  for(int n=1;n<=3;n++)controller.save(auth("1"),n,new RecipeTasteController.Save(features,feedback,0));
  check(controller.library(auth("1")).getBody().profile().get("spicy")==1);
  check(controller.library(auth("2")).getBody().profile().isEmpty());
  check(controller.library(auth("2")).getBody().recipes().getFirst().revision()==0);
  try{controller.save(auth("1"),1,new RecipeTasteController.Save(features,feedback,0));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==409);}
  try{controller.save(auth("2"),2,new RecipeTasteController.Save(features,feedback,0));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==404);}
  check(controller.search(auth("1"),new RecipeTasteController.Search("두부")).getBody().numbers().size()==3);
  check(controller.analyze(auth("1"),1).getBody().taste().isEmpty());
  var e=controller.library(auth("1")).getBody().recipes().getFirst();
  check(RecipeTasteController.matches(e,new RecipeTasteController.Query("한식","메인",List.of("두부"),List.of("돼지고기"),20)));
  check(!RecipeTasteController.matches(e,new RecipeTasteController.Query("","",List.of(),List.of("두부"),0)));
  // Exercise the real HTTP/JSON model adapter against a local fixture, not a real LLM.
  var model=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
  var responseText=new java.util.concurrent.atomic.AtomicReference<String>();
  model.createContext("/v1/chat/completions",exchange->{
   String input=new String(exchange.getRequestBody().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
   check(input.contains("json_schema")&&input.contains("smartnf-food-parser"));
   byte[] bytes=responseText.get().getBytes(java.nio.charset.StandardCharsets.UTF_8);
   exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
  });model.start();
  try {
   var mapper=tools.jackson.databind.json.JsonMapper.builder().build();
   var llm=new RecipeTasteController(new CurrentHealthMember(),jdbc,service,true,model.getAddress().getPort());
   responseText.set(mapper.writeValueAsString(Map.of("choices",List.of(Map.of("finish_reason","stop","message",Map.of("content",mapper.writeValueAsString(features)))))));
   check(llm.analyze(auth("1"),1).getBody().source().equals("LOCAL_LLM"));
   check(jdbc.queryForObject("SELECT COUNT(*) FROM my_recipe_prediction WHERE member_id=1 AND recipe_number=1",Integer.class)==1);
   var invalid=new Features("한식","메인",Map.of("spicy",6),"","","LOCAL_LLM");
   responseText.set(mapper.writeValueAsString(Map.of("choices",List.of(Map.of("finish_reason","stop","message",Map.of("content",mapper.writeValueAsString(invalid)))))));
   check(llm.analyze(auth("1"),2).getBody().source().equals("RULE"));
   var conditions=new RecipeTasteController.Query("한식","메인",List.of("두부"),List.of("돼지고기"),20);
   responseText.set(mapper.writeValueAsString(Map.of("choices",List.of(Map.of("finish_reason","stop","message",Map.of("content",mapper.writeValueAsString(conditions)))))));
   check(llm.search(auth("1"),new RecipeTasteController.Search("두부 들어간 한식 메인")).getBody().numbers().size()==3);
  } finally {model.stop(0);}
  var starred=new Feedback(0,null,Map.of("spicy",3),List.of(),4,2,"쫄깃함","마늘향");
  controller.save(auth("1"),1,new RecipeTasteController.Save(features,starred,1));
  var restored=controller.library(auth("1")).getBody().recipes().stream().filter(x->x.number()==1).findFirst().orElseThrow();
  check(restored.feedback().likingStars()==4&&restored.feedback().againStars()==2);
  check(restored.feedback().texture().equals("쫄깃함")&&restored.prediction()!=null);
  check(restored.prediction().taste().get("spicy")==1); // Actual edits never overwrite AI baseline.
  service.delete(1,1);check(jdbc.queryForObject("SELECT COUNT(*) FROM my_recipe_taste WHERE member_id=1",Integer.class)==2);
  check(jdbc.queryForObject("SELECT COUNT(*) FROM my_recipes WHERE member_id=2",Integer.class)==1);
  check(jdbc.queryForObject("SELECT COUNT(*) FROM my_recipe_prediction WHERE member_id=1 AND recipe_number=1",Integer.class)==0);
  System.out.println("H2: migration, actual JSON roundtrip, ownership, revision conflict, profile, literal search, deletion cascade passed");
 }
}
