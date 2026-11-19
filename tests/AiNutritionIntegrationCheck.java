package com.onrender.smartnf.web;
import java.util.*;import java.math.BigDecimal;import java.nio.file.*;import java.net.*;
import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.Authentication;import org.springframework.web.server.ResponseStatusException;
import com.onrender.smartnf.health.CurrentHealthMember;import com.onrender.smartnf.health.MealCatalog;import tools.jackson.databind.json.JsonMapper;
public class AiNutritionIntegrationCheck {
 static void check(boolean x){if(!x)throw new AssertionError();}static Authentication auth(int m){return UsernamePasswordAuthenticationToken.authenticated(""+m,"",List.of());}
 public static void main(String[] args)throws Exception{
  var json=JsonMapper.builder().build();var jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:ai;MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));jdbc.execute("CREATE TABLE members(id BIGINT PRIMARY KEY)");jdbc.execute("INSERT INTO members VALUES(1),(2)");jdbc.execute(Files.readString(Path.of(args[0])));
  var modelValues=new LinkedHashMap<String,Object>();modelValues.put("energy",80);modelValues.put("protein",10);modelValues.put("fat",2);modelValues.put("carbohydrate",5);modelValues.put("saturated_fat",1);modelValues.put("sugars",1);modelValues.put("sodium",100);modelValues.put("fiber",2);
  var calls=new java.util.concurrent.atomic.AtomicInteger();var server=com.sun.net.httpserver.HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/estimate",exchange->{String body=new String(exchange.getRequestBody().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);check(body.contains("basisGrams")&&!body.contains("member_id"));calls.incrementAndGet();var text=json.writeValueAsString(Map.of("nutrients",modelValues,"note","일반 상태 가정"));byte[] bytes=json.writeValueAsBytes(Map.of("candidates",List.of(Map.of("finishReason","STOP","content",Map.of("parts",List.of(Map.of("text",text)))))));exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();});server.start();
  try{
   var service=new AiNutritionService(jdbc,"fixture","gemini-test");var endpoint=AiNutritionService.class.getDeclaredField("endpoint");endpoint.setAccessible(true);endpoint.set(service,URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/estimate"));
   var input=new AiNutritionService.Input(UUID.randomUUID(),"검사용 식재료","",true);var e=service.request(1,input);check(e.status().equals("UNREVIEWED"));check(e.source().equals("AI_UNVERIFIED")&&e.sourceUrl()==null);check(calls.get()==1);check(service.request(1,input).id().equals(e.id())&&calls.get()==1);check(service.confirmed(1,List.of(e.id())).isEmpty());
   try{service.get(2,e.id());throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==404);}
   e=service.review(1,e.id(),new AiNutritionService.Review("AUTO_APPLY",e.revision()));check(e.status().equals("AUTO_APPLIED"));
   var nutrition=new RecipeNutritionController(service,new CurrentHealthMember());var meal=new RecipeNutritionController.Meal("검사",1,List.of(new RecipeNutritionController.Ingredient(e.id(),new BigDecimal("50"))));var request=new RecipeNutritionController.Request(List.of(meal),true);
   var analysis=nutrition.analyze(auth(1),request).getBody().getFirst();check(analysis.nutrients().get("energy").compareTo(new BigDecimal("40"))==0);check(analysis.aiCoverage().get("energy")==1);check(nutrition.analyze(auth(2),request).getBody().getFirst().nutrients().get("energy")==null);
   var base=MealCatalog.all().stream().filter(f->f.basis().matches("100g(?: .*)?")&&f.nutrients().get("energy")!=null&&AiNutritionService.KEYS.stream().anyMatch(k->f.nutrients().get(k)==null)).findFirst().orElseThrow();
   var complemented=service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"검사 보완",base.id(),true));check(complemented.nutrients().get("energy").compareTo(base.nutrients().get("energy"))==0);check(!complemented.aiKeys().contains("energy"));
   try{service.review(1,e.id(),new AiNutritionService.Review("EXCLUDE",1));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==409);}
   e=service.review(1,e.id(),new AiNutritionService.Review("EXCLUDE",e.revision()));check(service.confirmed(1,List.of(e.id())).isEmpty());
   modelValues.put("energy",-1);try{service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"실패 검사","",true));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==502);}check(service.list(1).stream().anyMatch(x->x.status().equals("FAILED")));
   int before=calls.get();try{service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"검사","",false));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}check(calls.get()==before);
   modelValues.put("energy",80);modelValues.put("fiber",null);modelValues.put("sodium",0);var partial=AiNutritionService.validateNutrients(json.readTree(json.writeValueAsString(modelValues)));check(partial.get("fiber")==null&&partial.get("sodium").signum()==0);
   var reuse=service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"검사 보완",base.id(),true));check(reuse.id().equals(complemented.id()));
   jdbc.update("DELETE FROM ai_nutrition_estimates WHERE member_id=1");
   for(int i=0;i<499;i++)jdbc.update("INSERT INTO ai_nutrition_estimates(id,member_id,request_key,food_name,reference_food_id,model_name,review_status,nutrients_data) VALUES(?,1,?,?,?,'fixture','AUTO_APPLIED',?)",UUID.randomUUID().toString(),UUID.randomUUID().toString(),"기존 재료 "+i,"", "{\"energy\":80}");
   int countBefore=calls.get();var last=service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"마지막 새 재료","",true));check(calls.get()==countBefore+1);check(jdbc.queryForObject("SELECT COUNT(*) FROM ai_nutrition_estimates WHERE member_id=1",Integer.class)==500);
   check(service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"마지막 새 재료","",true)).id().equals(last.id()));check(calls.get()==countBefore+1);
   try{service.request(1,new AiNutritionService.Input(UUID.randomUUID(),"한도 초과 재료","",true));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==429);check(good.getReason().contains("500"));}check(calls.get()==countBefore+1);
   // Same name belonging to another member cannot be reused.
   service.request(2,new AiNutritionService.Input(UUID.randomUUID(),"마지막 새 재료","",true));check(calls.get()==countBefore+2);
   jdbc.update("DELETE FROM members WHERE id=1");check(jdbc.queryForObject("SELECT COUNT(*) FROM ai_nutrition_estimates WHERE member_id=1",Integer.class)==0);
  }finally{server.stop(0);}System.out.println("AI DB/H2 + HTTP fixture: migration, consent, idempotency, owner boundary, review/CAS/exclude, public-data precedence, 100g scaling, AI coverage, null/zero, failed output and deletion passed");
 }
}
