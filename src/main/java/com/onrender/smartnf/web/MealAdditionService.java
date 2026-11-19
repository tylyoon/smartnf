package com.onrender.smartnf.web;
import java.time.LocalDate;import java.util.*;import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.stereotype.Service;import org.springframework.transaction.PlatformTransactionManager;import org.springframework.transaction.support.TransactionTemplate;import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
@Service
public class MealAdditionService {
 public record Food(String name,String role,List<String> ingredients){}
 public record Request(String mode,String foodName,List<Food> current,GeminiPeriodService.Criteria criteria,boolean consent){}
 public record Candidate(String id,String role,String reason,MyRecipeService.Snapshot recipe){}
 public record Result(List<Candidate> candidates,String provider,String model){}
 private final JdbcTemplate jdbc;private final GeminiPeriodClient gemini;private final TransactionTemplate tx;private final Set<Long> running=ConcurrentHashMap.newKeySet();private final JsonMapper json=JsonMapper.builder().build();
 public MealAdditionService(JdbcTemplate jdbc,GeminiPeriodClient gemini,PlatformTransactionManager manager){this.jdbc=jdbc;this.gemini=gemini;this.tx=new TransactionTemplate(manager);}
 public Result recommend(long member,Request request){
  validate(request);if(!running.add(member))throw problem(HttpStatus.CONFLICT,"추가 음식 추천이 진행 중입니다. 잠시 기다려 주세요.");
  try{
   if("named".equals(request.mode())){var reused=reuse(request);if(reused!=null)return new Result(List.of(reused),"STORED","");}
   var result=parse(gemini.generateAddition(json.writeValueAsString(request),schema()),request);
   tx.execute(status->{for(var c:result.candidates())jdbc.update("INSERT INTO recipe_library(recipe_id,recipe_data,period_kind) VALUES(?,?,?) ON DUPLICATE KEY UPDATE period_kind=COALESCE(period_kind,VALUES(period_kind))",c.id(),json.writeValueAsString(c.recipe()),c.role());return null;});
   return result;
  }finally{running.remove(member);}
 }
 private Candidate reuse(Request r){
  String term=r.foodName().strip().replace("!","!!").replace("%","!%").replace("_","!_");
  var rows=jdbc.query("SELECT recipe_id,recipe_data,period_kind FROM recipe_library WHERE recipe_data LIKE ? ESCAPE '!' ORDER BY recipe_id LIMIT 40",(rs,i)->new String[]{rs.getString(1),rs.getString(2),rs.getString(3)},"%"+term+"%");
  for(var row:rows)try{var recipe=json.readValue(row[1],MyRecipeService.Snapshot.class);if(!GeminiPeriodService.norm(recipe.name()).equals(GeminiPeriodService.norm(r.foodName())))continue;recipe=GeminiPeriodService.canonicalRecipe(recipe,r.criteria(),"stored");String role=Set.of("main","soup","bowl","staple","side").contains(row[2]==null?"":row[2])?row[2]:GeminiPeriodService.kind(recipe.name());if(role.equals("unknown"))role="side";return new Candidate(row[0],role,"공용 DB의 저장된 레시피를 재사용합니다.",recipe);}catch(Exception ignored){}
  return null;
 }
 static void validate(Request r){
  if(r==null||!Set.of("named","compatible").contains(r.mode()==null?"":r.mode())||!r.consent()||r.current()==null||r.current().size()>30)throw problem(HttpStatus.BAD_REQUEST,"추천 방식·현재 음식·Gemini 전송 안내를 확인해 주세요.");
  GeminiPeriodService.validateRequest(new GeminiPeriodService.Request(UUID.randomUUID(),LocalDate.of(2026,1,1),1,List.of("breakfast"),r.criteria(),false,true,List.of()));
  if(r.foodName()!=null&&r.foodName().length()>100||"named".equals(r.mode())&&!GeminiPeriodService.text(r.foodName(),100))throw problem(HttpStatus.BAD_REQUEST,"추가할 음식명을 100자 이내로 입력해 주세요.");
  if("compatible".equals(r.mode())&&r.current().isEmpty())throw problem(HttpStatus.BAD_REQUEST,"어울리는 음식을 추천받으려면 먼저 한 끼에 음식을 담아 주세요.");
  var unrestricted=new GeminiPeriodService.Criteria(false,false,false,false,null,null,"",List.of(),Map.of());
  for(var food:r.current())try{if(food==null||food.role()!=null&&!Set.of("main","soup","bowl","staple","side","unknown").contains(food.role()))throw new IllegalArgumentException();GeminiPeriodService.canonicalRecipe(new MyRecipeService.Snapshot(food.name(),1,1,food.ingredients(),List.of("현재 구성")),unrestricted,"current");}catch(Exception e){throw problem(HttpStatus.BAD_REQUEST,"현재 음식의 이름·재료·g 분량을 확인해 주세요.");}
  if("named".equals(r.mode())){
   if(r.current().stream().anyMatch(f->GeminiPeriodService.norm(f.name()).equals(GeminiPeriodService.norm(r.foodName()))))throw problem(HttpStatus.CONFLICT,"이미 담은 음식입니다. 해당 카드에서 먹을 인분을 조정해 주세요.");
   if(r.criteria().excluded().stream().anyMatch(x->GeminiPeriodService.norm(r.foodName()).contains(GeminiPeriodService.norm(x))))throw problem(HttpStatus.BAD_REQUEST,"입력한 음식명이 제외 재료 조건과 겹칩니다.");
  }
 }
 Result parse(String payload,Request r){
  if(payload==null||payload.length()>100000)throw invalid();
  try{
   var root=json.readTree(payload);var list=root.path("candidates");if(!list.isArray()||list.size()>3||"named".equals(r.mode())&&list.size()!=1)throw invalid();
   Set<String> seen=new HashSet<>();r.current().forEach(f->seen.add(GeminiPeriodService.norm(f.name())));List<Candidate> result=new ArrayList<>();
   for(var c:list){String role=c.path("role").asText("");if(!Set.of("main","soup","bowl","staple","side").contains(role))throw invalid();var data=c.path("recipe");if(!data.isObject()||!data.path("name").isTextual()||!data.path("servings").isIntegralNumber()||!data.path("servings").canConvertToInt()||!data.path("minutes").isIntegralNumber()||!data.path("minutes").canConvertToInt()||!stringArray(data.path("ingredients"))||!stringArray(data.path("steps")))throw invalid();
    var recipe=GeminiPeriodService.canonicalRecipe(json.treeToValue(data,MyRecipeService.Snapshot.class),r.criteria(),"addition");String name=GeminiPeriodService.norm(recipe.name());if(!seen.add(name)||"named".equals(r.mode())&&!name.equals(GeminiPeriodService.norm(r.foodName())))throw invalid();String reason=c.path("reason").isTextual()?c.path("reason").asText().replaceAll("\\s+"," ").strip():"";if(reason.length()>240)reason=reason.substring(0,240);
    result.add(new Candidate(MyRecipeService.fingerprint(json.writeValueAsString(recipe)),role,reason,recipe));
   }
   return new Result(List.copyOf(result),"GEMINI",gemini.model());
  }catch(ResponseStatusException e){throw e;}catch(Exception e){throw invalid();}
 }
 private static boolean stringArray(tools.jackson.databind.JsonNode node){if(!node.isArray())return false;for(var n:node)if(!n.isTextual())return false;return true;}
 static Map<String,Object> schema(){var str=Map.of("type","STRING");var strings=Map.of("type","ARRAY","items",str);var recipe=Map.of("type","OBJECT","properties",Map.of("name",str,"servings",Map.of("type","INTEGER"),"minutes",Map.of("type","INTEGER"),"ingredients",strings,"steps",strings),"required",List.of("name","servings","minutes","ingredients","steps"));var candidate=Map.of("type","OBJECT","properties",Map.of("role",Map.of("type","STRING","enum",List.of("main","soup","bowl","staple","side")),"reason",str,"recipe",recipe),"required",List.of("role","reason","recipe"));return Map.of("type","OBJECT","properties",Map.of("candidates",Map.of("type","ARRAY","items",candidate,"maxItems",3)),"required",List.of("candidates"));}
 static ResponseStatusException problem(HttpStatus status,String message){return new ResponseStatusException(status,message);}
 static ResponseStatusException invalid(){return problem(HttpStatus.BAD_GATEWAY,"추가 음식 후보의 이름·재료·역할을 확인하지 못했습니다. 현재 한 끼는 유지됩니다. [MEAL_ADDITION_VALIDATION]");}
}
