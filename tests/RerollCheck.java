package com.onrender.smartnf.web;
import java.util.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.*;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.web.server.ResponseStatusException;
public class RerollCheck {
 static void check(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[] args)throws Exception{
  var json=JsonMapper.builder().build();var calls=new AtomicInteger();var allOld=new AtomicBoolean(false);var bodies=new ArrayList<String>();
  var server=com.sun.net.httpserver.HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/generate",exchange->{String body=new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);bodies.add(body);int n=calls.incrementAndGet();var recipes=new ArrayList<Object>();for(int i=1;i<=5;i++)recipes.add(Map.of("name",allOld.get()||n%2==1?"두부 요리"+i:"새 요리"+i,"servings",1,"minutes",10,"ingredients",List.of("두부 100g"),"steps",List.of("굽기"),"availableIngredientIndexes",List.of()));String result=json.writeValueAsString(Map.of("recipes",recipes));byte[] response=json.writeValueAsBytes(Map.of("candidates",List.of(Map.of("finishReason","STOP","content",Map.of("parts",List.of(Map.of("text",result)))))));exchange.sendResponseHeaders(200,response.length);exchange.getResponseBody().write(response);exchange.close();});server.start();
  try{
   var generator=new RecipeGenerationController("fixture","gemini-test",new RecipePreferenceService(null,null));var endpoint=RecipeGenerationController.class.getDeclaredField("endpoint");endpoint.setAccessible(true);endpoint.set(generator,URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));
   var excluded=List.of("두부 요리1","두부요리2","두부-요리3","두부 요리4","두부 요리5");
   var input=new RecipeGenerationController.RecipeRequest("두부","",true,null,List.of(),"","",false,false,null,excluded);
   var result=generator.generate(null,input);check(calls.get()==2);check(result.getBody().size()==5&&result.getBody().stream().allMatch(r->r.name().startsWith("새")));check(bodies.stream().allMatch(b->b.contains("excludedRecipeNames")&&b.contains("두부-요리3")));check(result.getHeaders().getFirst("X-SmartNF-Candidate-Attempts").equals("2"));
   allOld.set(true);int count=calls.get();check(generator.generate(null,input).getBody().isEmpty());check(calls.get()==count+2);
   var legacy=json.readValue("{\"foodName\":\"두부\",\"consent\":true}",RecipeGenerationController.RecipeRequest.class);check(legacy.excludedRecipeNames().isEmpty());check(generator.generate(null,legacy).getBody().size()==5);
   count=calls.get();try{generator.generate(null,new RecipeGenerationController.RecipeRequest("두부","",true,null,List.of(),"","",false,false,null,Collections.nCopies(6,"과다")));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}check(calls.get()==count);
   try{generator.generate(null,new RecipeGenerationController.RecipeRequest("두부","",false,null,List.of(),"","",false,false,null,excluded));throw new AssertionError();}catch(ResponseStatusException good){check(good.getStatusCode().value()==400);}check(calls.get()==count);
   System.out.println("PASS: current-name exclusion reaches both model requests; server removes normalized old names; bounded supplement returns fresh five or empty; old clients default empty exclusions; invalid/consentless requests never call model");
  }finally{server.stop(0);}
 }
}
