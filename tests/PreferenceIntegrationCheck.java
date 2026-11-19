package com.onrender.smartnf.web;
import java.util.*;
import java.net.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import com.onrender.smartnf.health.CurrentHealthMember;
import tools.jackson.databind.json.JsonMapper;
public class PreferenceIntegrationCheck {
 static void check(boolean x){if(!x)throw new AssertionError();}
 static Authentication auth(int m){return UsernamePasswordAuthenticationToken.authenticated(""+m,"",List.of());}
 public static void main(String[] args)throws Exception{
  var json=JsonMapper.builder().build();var jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:prefs;MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
  jdbc.execute("CREATE TABLE my_recipes(member_id BIGINT,recipe_number BIGINT,recipe_data TEXT,PRIMARY KEY(member_id,recipe_number))");
  jdbc.execute("CREATE TABLE my_recipe_taste(member_id BIGINT,recipe_number BIGINT,feedback_data TEXT,PRIMARY KEY(member_id,recipe_number))");
  for(int m=1;m<=2;m++)for(int n=1;n<=3;n++){
   jdbc.update("INSERT INTO my_recipes VALUES(?,?,?)",m,n,json.writeValueAsString(Map.of("name","private_recipe_"+n)));
   var feedback=new RecipeTastePolicy.Feedback(3,true,Map.of("spicy",m==1?1:5,"salty",2),List.of(),5,4,null,null);
   jdbc.update("INSERT INTO my_recipe_taste VALUES(?,?,?)",m,n,json.writeValueAsString(feedback));
  }
  var prefs=new RecipePreferenceService(new CurrentHealthMember(),jdbc);
  check(prefs.read(auth(1)).targets().get("spicy")==1);check(prefs.read(auth(2)).targets().get("spicy")==5);
  check(prefs.resolve(null,false,true,Map.of("spicy",999)).targets().isEmpty());
  check(prefs.resolve(auth(1),true,true,Map.of("rich",0)).targets().get("rich")==0);
  try{prefs.resolve(auth(1),true,true,Map.of("spicy",6));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}
  try{prefs.resolve(auth(3),true,false,null);throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}
  var bodies=new java.util.concurrent.CopyOnWriteArrayList<String>();var filling=new java.util.concurrent.atomic.AtomicInteger(-1);var server=com.sun.net.httpserver.HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/generate",exchange->{
   bodies.add(new String(exchange.getRequestBody().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));
   int round=filling.get()<0?-1:filling.getAndIncrement();int start=round==1?2:1,end=round==0?1:5;var recipes=new ArrayList<Object>();for(int n=start;n<=end;n++)recipes.add(Map.of("name","두부 요리"+n,"servings",1,"minutes",10,"ingredients",List.of("두부 100g"),"steps",List.of("굽기"),"availableIngredientIndexes",List.of()));
   String payload=json.writeValueAsString(Map.of("recipes",recipes));
   byte[] bytes=json.writeValueAsBytes(Map.of("candidates",List.of(Map.of("finishReason","STOP","content",Map.of("parts",List.of(Map.of("text",payload)))))));
   exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
  });server.start();
  try{
   var generator=new RecipeGenerationController("fixture","gemini-test",prefs);
   var endpoint=RecipeGenerationController.class.getDeclaredField("endpoint");endpoint.setAccessible(true);endpoint.set(generator,URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));
   var ordinary=new RecipeGenerationController.RecipeRequest("두부","",true,null,List.of(),"","");
   var first=generator.generate(auth(1),ordinary);check(first.getBody().size()==5);check(!bodies.getLast().contains("tasteTargets"));check(first.getHeaders().getFirst("X-SmartNF-Taste-Applied")==null);
   var personal=new RecipeGenerationController.RecipeRequest("두부","",true,null,List.of(),"","",true,false,null);
   var second=generator.generate(auth(1),personal);check(second.getBody().size()==5);check(second.getHeaders().getFirst("X-SmartNF-Taste-Applied")!=null);
   var body=json.readTree(bodies.getLast());var input=json.readTree(body.path("contents").path(0).path("parts").path(0).path("text").asText());
   check(input.path("tasteTargets").path("spicy").asDouble()==1);check(!bodies.getLast().contains("private_recipe"));check(!bodies.getLast().contains("likingStars"));
   check(body.path("systemInstruction").toString().contains("최우선"));
   var manual=new RecipeGenerationController.RecipeRequest("두부","",true,null,List.of(),"","",true,true,Map.of("rich",0));generator.generate(auth(2),manual);
   check(json.readTree(json.readTree(bodies.getLast()).path("contents").path(0).path("parts").path(0).path("text").asText()).path("tasteTargets").path("rich").asDouble()==0);
   int before=bodies.size();filling.set(0);var filled=generator.generate(auth(1),personal);check(filled.getBody().size()==5);check(filled.getHeaders().getFirst("X-SmartNF-Candidate-Attempts").equals("2"));check(bodies.size()==before+2);check(bodies.get(before).contains("tasteTargets")&&bodies.get(before+1).contains("tasteTargets"));filling.set(-1);
   int count=bodies.size();try{generator.generate(auth(1),new RecipeGenerationController.RecipeRequest("두부","",false,null,List.of(),"","",true,false,null));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}check(count==bodies.size());
  }finally{server.stop(0);}
  System.out.println("H2 + actual HTTP adapter fixture: account-scoped profile, OFF/manual/zero/bounds, minimal outgoing taste data, consent, five candidates passed");
 }
}
