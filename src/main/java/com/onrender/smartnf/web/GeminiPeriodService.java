package com.onrender.smartnf.web;

import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class GeminiPeriodService {
 public record Criteria(boolean general,boolean special,boolean lowerSodium,boolean fiber,Double energy,Double sodium,String targetSource,List<String> excluded,Map<String,Double> personal){}
 public record FixedDish(String id,String role,MyRecipeService.Snapshot recipe){}
 public record Request(UUID requestId,LocalDate first,int days,List<String> meals,Criteria criteria,boolean usePreferences,boolean consent,List<String> previousNames,@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY) List<FixedDish> fixedDishes,@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY) List<String> excludedRecipeNames){
  public Request(UUID id,LocalDate first,int days,List<String> meals,Criteria criteria,boolean usePreferences,boolean consent,List<String> previousNames,List<FixedDish> fixed){this(id,first,days,meals,criteria,usePreferences,consent,previousNames,fixed,List.of());}
  public Request(UUID id,LocalDate first,int days,List<String> meals,Criteria criteria,boolean usePreferences,boolean consent,List<String> previousNames){this(id,first,days,meals,criteria,usePreferences,consent,previousNames,List.of());}
 }
 public record Dish(String id,String kind,MyRecipeService.Snapshot recipe){}
 public record Ingredient(String text,String name,double grams,String foodId,String matchStatus){}
 public record Part(String name,double servings,List<Ingredient> ingredients,String role){}
 public record Slot(String date,String meal,int recipe,List<Part> recommended,String policy,String reason,List<String> recipeIds){}
 public record Result(List<Slot> slots,List<String> notes,String provider,String model,boolean cached){}
 private record Reservation(String hash,String status,String response,Integer error,Instant created){}
 private static final Set<String> MEALS=Set.of("breakfast","lunch","dinner"),KINDS=Set.of("bowl","soup","main","staple","side");
 private static final Pattern GRAMS=Pattern.compile("(.+?)\\s+((?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\\.[0-9]{1,6})?)\\s*(?:g|그램)",Pattern.CASE_INSENSITIVE);
 private final JdbcTemplate jdbc;private final GeminiPeriodClient gemini;private final TransactionTemplate tx;
 private final JsonMapper json=JsonMapper.builder().build();private final Set<Long> running=ConcurrentHashMap.newKeySet();
 public GeminiPeriodService(JdbcTemplate jdbc,GeminiPeriodClient gemini,PlatformTransactionManager manager){this.jdbc=jdbc;this.gemini=gemini;this.tx=new TransactionTemplate(manager);}
 public Result generate(long member,Request request,Map<String,Double> taste){
  validateRequest(request);jdbc.update("DELETE FROM gemini_period_requests WHERE created_at < ?",java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(7))));String hash=MyRecipeService.fingerprint(json.writeValueAsString(request));
  var old=reservation(member,request.requestId());if(old!=null)return replay(old,hash);
  if(!running.add(member))throw error(HttpStatus.CONFLICT,"이 계정의 식단 추천이 진행 중입니다. 완료 후 다시 눌러주세요.");
  try{
   int inserted=jdbc.update("INSERT IGNORE INTO gemini_period_requests(member_id,request_key,request_hash,status) VALUES(?,?,?,'PROCESSING')",member,request.requestId().toString(),hash);
   if(inserted==0)return replay(reservation(member,request.requestId()),hash);
   try{
    var originals=pool(member,request.criteria()).stream().filter(d->!excludedRecipeNames(request).contains(norm(d.recipe().name()))).toList();var saved=jdbc.query("SELECT DISTINCT recipe_id FROM my_recipes WHERE member_id=? AND recipe_id IS NOT NULL",(r,i)->r.getString(1),member);
    // Short request-local references reduce transcription errors; stored IDs stay canonical hashes.
    List<Dish> pool=new ArrayList<>();List<String> savedAliases=new ArrayList<>();
    for(int i=0;i<originals.size();i++){var dish=originals.get(i);String alias="saved-"+(i+1);pool.add(new Dish(alias,dish.kind(),dish.recipe()));if(saved.contains(dish.id()))savedAliases.add(alias);}
    var fixed=fixedDishes(request);fixed.forEach(d->pool.add(new Dish(d.id(),d.role(),d.recipe())));
    Set<String> privateHashes=new HashSet<>();fixed.forEach(d->privateHashes.add(MyRecipeService.fingerprint(json.writeValueAsString(d.recipe()))));
    var input=new LinkedHashMap<String,Object>();input.put("excludedRecipeNames",request.excludedRecipeNames()==null?List.of():request.excludedRecipeNames());input.put("fixedDishes",fixed);input.put("first",request.first().toString());input.put("days",request.days());input.put("meals",request.meals());input.put("criteria",request.criteria());input.put("previousNames",request.previousNames()==null?List.of():request.previousNames());input.put("savedRecipeIds",List.copyOf(savedAliases));input.put("tasteTargets",taste==null?Map.of():taste);input.put("recipes",pool.stream().map(d->Map.of("id",d.id(),"kind",d.kind(),"recipe",Map.of("name",d.recipe().name(),"servings",d.recipe().servings(),"ingredients",d.recipe().ingredients()))).toList());
    Result result=gemini.withinRecommendation(()->recommend(input,request,pool));
    // Only validated used recipe snapshots are shared; no private overrides/feedback are copied.
    return tx.execute(status->{
     for(var slot:result.slots())for(String id:slot.recipeIds()){
      var recipe=validatedRecipes.get().get(id);if(recipe!=null&&!privateHashes.contains(id)){String payload=json.writeValueAsString(recipe);jdbc.update("INSERT INTO recipe_library(recipe_id,recipe_data,period_kind) VALUES(?,?,?) ON DUPLICATE KEY UPDATE period_kind=COALESCE(period_kind,VALUES(period_kind))",id,payload,validatedKinds.get().get(id));}
     }
     int written=jdbc.update("UPDATE gemini_period_requests SET status='DONE',response_data=? WHERE member_id=? AND request_key=? AND status='PROCESSING'",json.writeValueAsString(result),member,request.requestId().toString());if(written!=1)throw error(HttpStatus.CONFLICT,"요청 소유 계정 또는 저장 상태가 변경되어 결과를 적용하지 않았습니다.");return result;
    });
   }catch(Exception e){
    int code=e instanceof ResponseStatusException r?r.getStatusCode().value():502;
    String message=e instanceof ResponseStatusException r&&r.getReason()!=null?r.getReason():"식단 결과 처리 중 오류가 발생했습니다. [GEMINI_PERIOD_PROCESSING] 기존 식단은 유지됩니다.";
    var tag=Pattern.compile("GEMINI_PERIOD_[A-Z_]+").matcher(message);if(tag.find())java.util.logging.Logger.getLogger(GeminiPeriodService.class.getName()).warning("SmartNF Gemini period validation code="+tag.group());
    jdbc.update("UPDATE gemini_period_requests SET status='FAILED',error_status=?,response_data=? WHERE member_id=? AND request_key=? AND status='PROCESSING'",code,json.writeValueAsString(Map.of("message",message)),member,request.requestId().toString());
    if(e instanceof ResponseStatusException r)throw r;throw error(HttpStatus.BAD_GATEWAY,"식단 검증 또는 저장을 완료하지 못했습니다. 기존 식단은 유지됩니다.");
   }finally{validatedRecipes.remove();validatedKinds.remove();}
  }finally{running.remove(member);}
 }
 // Never accept an incomplete meal or persist a partially validated first response.
 private Result recommend(Map<String,Object> input,Request request,List<Dish> pool){
  String response=gemini.generate(json.writeValueAsString(input),schema());
  try{return parse(response,request,pool);}catch(ResponseStatusException failure){
   if(failure.getReason()==null||!(failure.getReason().contains("[GEMINI_PERIOD_COMBINATION_MISSING]")||failure.getReason().contains("[GEMINI_PERIOD_COMPOSITION_SHAPE]")||failure.getReason().contains("[GEMINI_PERIOD_REFERENCE]")||failure.getReason().contains("[GEMINI_PERIOD_FIXED_DISH]")))throw failure;
   java.util.logging.Logger.getLogger(GeminiPeriodService.class.getName()).info("SmartNF Gemini period category=PERIOD_RESPONSE_REPAIR; one bounded repair");
   var repair=new LinkedHashMap<String,Object>();repair.put("task","repair_composition");repair.put("availableStoredRecipeIds",pool.stream().map(Dish::id).toList());repair.put("originalInput",input);
   repair.put("previousResponse",json.readTree(response));repair.put("validationFeedback",failure.getReason());
   // Full replacement must pass every date, reference, role, amount and exclusion check again.
   return parse(gemini.generate(json.writeValueAsString(repair),schema()),request,pool);
  }
 }
 private final ThreadLocal<Map<String,MyRecipeService.Snapshot>> validatedRecipes=new ThreadLocal<>();
 private final ThreadLocal<Map<String,String>> validatedKinds=new ThreadLocal<>();
 private Reservation reservation(long member,UUID key){return jdbc.query("SELECT request_hash,status,response_data,error_status,created_at FROM gemini_period_requests WHERE member_id=? AND request_key=?",(r,i)->new Reservation(r.getString(1),r.getString(2),r.getString(3),(Integer)r.getObject(4),r.getTimestamp(5).toInstant()),member,key.toString()).stream().findFirst().orElse(null);}
 private Result replay(Reservation r,String hash){
  if(r==null||!r.hash().equals(hash))throw error(HttpStatus.CONFLICT,"동일한 요청 번호의 조건이 달라졌습니다.");
  if("DONE".equals(r.status())){var result=json.readValue(r.response(),Result.class);return new Result(result.slots(),result.notes(),result.provider(),result.model(),true);}
  if("FAILED".equals(r.status())){String message="이 요청은 실패했습니다. 추천 버튼으로 실패한 구간을 다시 요청해 주세요.";if(r.response()!=null)try{String saved=json.readTree(r.response()).path("message").asText("");if(!saved.isBlank()&&saved.length()<=1000)message=saved;}catch(Exception ignored){}throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(r.error()==null?502:r.error()),message);}
  if(Duration.between(r.created(),Instant.now()).toSeconds()>180)throw error(HttpStatus.GONE,"중단된 식단 요청입니다. 추천 버튼을 다시 눌러 새 요청을 시작해 주세요.");
  throw error(HttpStatus.CONFLICT,"이 식단 요청의 처리가 아직 끝나지 않았습니다. 잠시 후 같은 요청을 다시 확인해 주세요.");
 }
 List<Dish> pool(long member,Criteria criteria){
  var rows=jdbc.query("SELECT l.recipe_id,l.recipe_data,l.period_kind FROM recipe_library l ORDER BY CASE WHEN EXISTS (SELECT 1 FROM my_recipes m WHERE m.member_id=? AND m.recipe_id=l.recipe_id) THEN 0 ELSE 1 END,l.recipe_id LIMIT 80",(r,i)->new String[]{r.getString(1),r.getString(2),r.getString(3)},member);
  List<Dish> pool=new ArrayList<>();int characters=0;for(var row:rows)try{var recipe=canonicalRecipe(json.readValue(row[1],MyRecipeService.Snapshot.class),criteria,"catalog");int size=recipe.name().length()+String.join("",recipe.ingredients()).length()+100;if(characters+size>50000)continue;characters+=size;pool.add(new Dish(row[0],row[2]!=null&&KINDS.contains(row[2])?row[2]:kind(recipe.name()),recipe));}catch(Exception ignored){}return List.copyOf(pool);
 }
 static void validateRequest(Request r){
  if(r==null||r.requestId()==null||r.first()==null||r.first().getYear()<1900||r.first().getYear()>2100||r.days()<1||r.days()>7||r.first().plusDays(r.days()-1).getYear()>2100||r.meals()==null||r.meals().isEmpty()||r.meals().size()>3||!MEALS.containsAll(r.meals())||new HashSet<>(r.meals()).size()!=r.meals().size()||!r.consent()||r.criteria()==null)throw error(HttpStatus.BAD_REQUEST,"추천 기간·끼니·Gemini 전송 안내를 확인해 주세요.");
  var c=r.criteria();if(c.excluded()==null||c.excluded().size()>20||c.excluded().stream().anyMatch(s->!text(s,60)))throw error(HttpStatus.BAD_REQUEST,"제외 재료는 20개 이내로 입력해 주세요.");
  if(c.energy()!=null&&(!Double.isFinite(c.energy())||c.energy()<500||c.energy()>6000)||c.sodium()!=null&&(!Double.isFinite(c.sodium())||c.sodium()<100||c.sodium()>10000))throw error(HttpStatus.BAD_REQUEST,"하루 목표의 범위를 확인해 주세요.");
  if((c.energy()!=null||c.sodium()!=null)&&!Set.of("personal","clinician").contains(c.targetSource()==null?"":c.targetSource()))throw error(HttpStatus.BAD_REQUEST,"목표 출처를 확인해 주세요.");
  var limits=Map.of("carbohydrate",1500d,"protein",500d,"fat",500d,"saturated_fat",200d,"sugars",500d,"fiber",200d);
  if(c.personal()!=null&&c.personal().entrySet().stream().anyMatch(e->!limits.containsKey(e.getKey())||e.getValue()==null||!Double.isFinite(e.getValue())||e.getValue()<=0||e.getValue()>limits.get(e.getKey())))throw error(HttpStatus.BAD_REQUEST,"개인 목표량을 확인해 주세요.");
  if(c.special()&&(c.general()||c.lowerSodium()||c.fiber()||c.energy()!=null||c.sodium()!=null||c.personal()!=null&&!c.personal().isEmpty()))throw error(HttpStatus.BAD_REQUEST,"별도 식사 제한이 있으면 영양 조건 없이 메뉴 배치만 이용하세요.");
  fixedDishes(r);
  if(r.excludedRecipeNames()!=null&&(r.excludedRecipeNames().size()>30||r.excludedRecipeNames().stream().anyMatch(n->!text(n,100))||!r.excludedRecipeNames().isEmpty()&&(r.fixedDishes()==null||r.fixedDishes().isEmpty())))throw error(HttpStatus.BAD_REQUEST,"한 끼 추천에서 제외한 요리 목록을 확인해 주세요.");
  if(r.previousNames()!=null&&(r.previousNames().size()>100||r.previousNames().stream().anyMatch(s->!text(s,100))))throw error(HttpStatus.BAD_REQUEST,"이전 구간의 요리 목록을 확인해 주세요.");
 }
 private static Set<String> excludedRecipeNames(Request r){return r.excludedRecipeNames()==null?Set.of():r.excludedRecipeNames().stream().map(GeminiPeriodService::norm).collect(java.util.stream.Collectors.toSet());}
 private static List<FixedDish> fixedDishes(Request r){
  if(r.fixedDishes()==null||r.fixedDishes().isEmpty())return List.of();
  if(r.days()!=1||r.meals().size()!=1||r.fixedDishes().size()>4)throw error(HttpStatus.BAD_REQUEST,"선택한 요리를 유지하는 추천은 한 끼에서 4개 이하로 이용해 주세요.");
  List<FixedDish> fixed=new ArrayList<>();Set<String> ids=new HashSet<>(),names=new HashSet<>();
  for(var d:r.fixedDishes()){
   if(d==null||d.id()==null||!d.id().matches("fixed-[1-4]")||!ids.add(d.id())||!KINDS.contains(d.role()==null?"":d.role())||d.recipe()==null||d.recipe().servings()!=1)throw error(HttpStatus.BAD_REQUEST,"유지할 음식의 식별자·역할·분량을 확인해 주세요.");
   // A fixed plate snapshot may have unknown cooking time (0); it is never published as a new recipe.
   MyRecipeService.Snapshot recipe;try{var supplied=d.recipe();var checked=supplied.minutes()==0?new MyRecipeService.Snapshot(supplied.name(),1,1,supplied.ingredients(),supplied.steps()):supplied;recipe=canonicalRecipe(checked,r.criteria(),"fixedDishes");if(supplied.minutes()==0)recipe=new MyRecipeService.Snapshot(recipe.name(),1,0,recipe.ingredients(),recipe.steps());}catch(ResponseStatusException e){throw error(HttpStatus.BAD_REQUEST,"유지할 음식의 재료·g 분량·제외 조건을 확인해 주세요.");}
   if(!names.add(norm(recipe.name())))throw error(HttpStatus.BAD_REQUEST,"현재 구성에 같은 음식이 중복되어 있습니다.");fixed.add(new FixedDish(d.id(),d.role(),recipe));
  }
  if(!Set.of("main","soup","bowl").contains(fixed.getFirst().role()))throw error(HttpStatus.BAD_REQUEST,"먼저 중심 요리의 역할을 메인·국/찌개·한그릇 중에서 선택해 주세요.");
  return List.copyOf(fixed);
 }
 Result parse(String payload,Request request,List<Dish> pool){
  if(payload==null||payload.length()>1_000_000)throw validation("PAYLOAD","응답 크기가 올바르지 않습니다.");
  JsonNode root;try{root=json.readTree(payload);}catch(Exception e){throw validation("JSON","식단 응답의 JSON 형식을 읽지 못했습니다.");}
  if(root==null||!root.isObject())throw validation("JSON","식단 응답은 JSON 객체여야 합니다.");
  var fresh=root.path("newRecipes");var slots=root.path("slots");
  if(!fresh.isArray()||fresh.size()>18)throw validation("RECIPE_COUNT","신규 레시피 목록 형식 또는 개수가 올바르지 않습니다.");
  if(!slots.isArray()||slots.size()!=request.days()*request.meals().size())throw validation("MEAL_COUNT","요청한 날짜·끼니 수와 반환된 식단 수가 다릅니다.");
  Map<String,Dish> candidates=new LinkedHashMap<>();pool.forEach(d->candidates.put(d.id(),d));int recipeIndex=0;
  for(var node:fresh){String at="newRecipes["+recipeIndex+++"]";
   String id=checkedString(node.path("id"),60,"RECIPE_ID",at+".id"),role=checkedString(node.path("kind"),12,"RECIPE_ROLE",at+".kind");
   if(!id.matches("new-[\\p{L}\\p{N}_-]{1,56}")||candidates.containsKey(id))throw validation("RECIPE_ID",at+"의 신규 식별자가 올바르지 않거나 중복됐습니다.");
   if(!KINDS.contains(role))throw validation("RECIPE_ROLE",at+"의 요리 역할이 허용된 분류가 아닙니다.");
   var data=node.path("recipe");if(!data.isObject()||!data.path("name").isTextual()||!data.path("servings").isIntegralNumber()||!data.path("servings").canConvertToInt()||!data.path("minutes").isIntegralNumber()||!data.path("minutes").canConvertToInt()||!stringArray(data.path("ingredients"))||!stringArray(data.path("steps")))throw validation("RECIPE_SHAPE",at+".recipe의 이름·정수 인분·시간·재료·순서 형식이 올바르지 않습니다.");
   MyRecipeService.Snapshot recipe;try{recipe=json.treeToValue(data,MyRecipeService.Snapshot.class);}catch(Exception e){throw validation("RECIPE_SHAPE",at+".recipe의 필드 형식이 올바르지 않습니다.");}
   recipe=canonicalRecipe(recipe,request.criteria(),at);
   // Names such as chicken salad do not establish the meal role: use the explicit Gemini role.
   candidates.put(id,new Dish(id,role,recipe));
  }
  var used=new HashMap<String,MyRecipeService.Snapshot>();var kinds=new HashMap<String,String>();Set<String> seen=new HashSet<>();List<Slot> result=new ArrayList<>();int slotIndex=0;
  for(var node:slots){String at="slots["+slotIndex+++"]";
   String date=checkedString(node.path("date"),10,"DATE",at+".date"),meal=checkedString(node.path("meal"),12,"MEAL",at+".meal");LocalDate day;
   try{day=LocalDate.parse(date);}catch(Exception e){throw validation("DATE",at+"의 날짜는 YYYY-MM-DD여야 합니다.");}
   if(day.isBefore(request.first())||!day.isBefore(request.first().plusDays(request.days())))throw validation("DATE_RANGE",at+"의 날짜가 요청 기간 밖입니다.");
   if(!request.meals().contains(meal))throw validation("MEAL",at+"에 요청하지 않은 끼니가 있습니다.");
   if(!seen.add(date+":"+meal))throw validation("DUPLICATE_MEAL",at+"에 같은 날짜·끼니가 중복됐습니다.");
   // Per-meal roles are explicit; the shared recipe's default kind is only a hint.
   Map<String,String> roles=composition(node.path("composition"),at+" ("+date+" "+meal+")");
   var fixed=fixedDishes(request);
   for(var d:fixed)if(!d.role().equals(roles.get(d.id())))throw validation("FIXED_DISH",at+"에서 유지할 음식 또는 지정 역할이 바뀌었습니다.");
   if(!fixed.isEmpty()&&!fixed.getFirst().id().equals(node.path("composition").path("center").path("recipeId").asText()))throw validation("FIXED_DISH",at+"에서 선택한 중심 요리가 바뀌었습니다.");
   List<Dish> dishes=new ArrayList<>();Set<String> names=new HashSet<>();
   for(var entry:roles.entrySet()){String reference=entry.getKey();var dish=candidates.get(reference);
    if(dish==null)throw validation("REFERENCE",at+"의 구성에 응답 목록에 없는 레시피 식별자가 있습니다.");
    if(!names.add(norm(dish.recipe().name())))throw validation("DUPLICATE_DISH",at+"에 같은 음식이 중복됐습니다.");
    if(fixed.stream().noneMatch(f->f.id().equals(reference))&&excludedRecipeNames(request).contains(norm(dish.recipe().name())))throw validation("EXCLUDED","추가 추천에 제외한 후보 음식이 포함되어 있습니다.");
    var recipe=fixed.stream().anyMatch(f->f.id().equals(reference))?dish.recipe():canonicalRecipe(dish.recipe(),request.criteria(),at+".composition");dishes.add(new Dish(dish.id(),entry.getValue(),recipe));
   }
   List<Part> parts=new ArrayList<>();List<String> hashes=new ArrayList<>();
   for(var dish:dishes){var r=dish.recipe();String hash=MyRecipeService.fingerprint(json.writeValueAsString(r));used.put(hash,r);kinds.putIfAbsent(hash,candidates.get(dish.id()).kind());hashes.add(hash);List<Ingredient> ingredients=new ArrayList<>();
    for(String item:r.ingredients()){var amount=amount(item,at+".ingredients");double grams=amount.grams().doubleValue()/r.servings();String display=java.math.BigDecimal.valueOf(grams).stripTrailingZeros().toPlainString();ingredients.add(new Ingredient(amount.name()+" "+display+"g",amount.name(),grams,null,"unmatched"));}
    parts.add(new Part(r.name(),1,List.copyOf(ingredients),dish.kind()));
   }
   String reason=node.path("reason").isTextual()?node.path("reason").asText().replaceAll("\\s+"," ").strip():"";
   if(reason.isEmpty())reason="상세 조합 사유 미제공";if(reason.length()>240)reason=reason.substring(0,240);
   result.add(new Slot(date,meal,-1,List.copyOf(parts),"Gemini-period-v3","Gemini 조합 제안 · "+reason,List.copyOf(hashes)));
  }
  result.sort(Comparator.comparing(Slot::date).thenComparingInt(s->List.of("breakfast","lunch","dinner").indexOf(s.meal())));validatedRecipes.set(used);validatedKinds.set(kinds);
  return new Result(List.copyOf(result),List.of("Gemini가 메인·주식·반찬을 제안하고 SmartNF가 날짜·끼니·레시피·기재된 제외 재료를 검증했습니다.","영양값은 영양 DB와 저장된 AI 자료로 계산하며 자료가 부족한 성분은 평가를 보류합니다. 개인별 영양 충족·질환 적합성을 보장하지 않습니다."),"GEMINI",gemini.model(),false);
 }
 // Empty strings explicitly mark components that are not used, never a missing field.
 private static Map<String,String> composition(JsonNode node,String at){
  if(!node.isObject()||!node.path("center").isObject()||!node.path("sideRecipeIds").isArray())throw validation("COMPOSITION_SHAPE",at+"의 중심 요리·주식·반찬 항목이 필요합니다.");
  var center=node.path("center");String centerId=componentId(center.path("recipeId"),at+".center.recipeId"),centerRole=checkedString(center.path("role"),12,"COMPOSITION_SHAPE",at+".center.role");
  if(!Set.of("main","soup","bowl").contains(centerRole))throw validation("COMPOSITION_SHAPE",at+"의 중심 역할은 main/soup/bowl이어야 합니다.");
  String staple=componentId(node.path("stapleRecipeId"),at+".stapleRecipeId"),soup=componentId(node.path("soupRecipeId"),at+".soupRecipeId");var sides=node.path("sideRecipeIds");
  if(sides.size()>2)throw validation("DISH_COUNT",at+"의 반찬은 1~2개여야 합니다.");
  List<String> sideIds=new ArrayList<>();for(var side:sides)sideIds.add(checkedString(side,100,"COMPOSITION_SHAPE",at+".sideRecipeIds"));
  if(centerId.isEmpty()||sides.isEmpty()||!centerRole.equals("bowl")&&staple.isEmpty())throw validation("COMBINATION_MISSING",at+"의 구성 누락: 중심 요리="+(centerId.isEmpty()?0:1)+", 주식="+(staple.isEmpty()?0:1)+", 반찬="+sides.size()+". 중심 요리(main/soup)+주식+반찬 또는 한그릇(bowl)+반찬이 필요합니다.");
  if(centerRole.equals("bowl")&&(!staple.isEmpty()||!soup.isEmpty())||centerRole.equals("soup")&&!soup.isEmpty())throw validation("COMBINATION_CONFLICT",at+"에 한그릇·주식 또는 국·찌개가 겹칩니다.");
  Map<String,String> roles=new LinkedHashMap<>();addComponent(roles,centerId,centerRole,at);if(!soup.isEmpty())addComponent(roles,soup,"soup",at);if(!staple.isEmpty())addComponent(roles,staple,"staple",at);for(String side:sideIds)addComponent(roles,side,"side",at);
  if(roles.size()<2||roles.size()>4)throw validation("DISH_COUNT",at+"에는 2~4개 요리가 필요합니다.");return roles;
 }
 private static String componentId(JsonNode node,String at){
  if(!node.isTextual())throw validation("COMPOSITION_SHAPE",at+"는 식별자 문자열이어야 하며 사용하지 않으면 빈 문자열이어야 합니다.");
  if(node.asText().isEmpty())return "";return checkedString(node,100,"COMPOSITION_SHAPE",at);
 }
 private static void addComponent(Map<String,String> roles,String id,String role,String at){if(roles.putIfAbsent(id,role)!=null)throw validation("DUPLICATE_DISH",at+"의 한 음식이 여러 역할에 중복 지정됐습니다.");}
 private record Amount(String name,java.math.BigDecimal grams){}
 private static Amount amount(String raw,String at){
  if(raw==null||raw.length()>140)throw validation("INGREDIENT_FORMAT",at+"의 재료명이 비어 있거나 너무 깁니다.");
  String value=java.text.Normalizer.normalize(raw,java.text.Normalizer.Form.NFKC).replace('\u00a0',' ').strip();
  var m=GRAMS.matcher(value);if(!m.matches())throw validation("INGREDIENT_FORMAT",at+"의 재료는 이름과 g 분량으로 표시해야 합니다.");
  String name=m.group(1).strip();if(!text(name,100))throw validation("INGREDIENT_FORMAT",at+"의 재료명이 올바르지 않습니다.");
  java.math.BigDecimal grams;try{grams=new java.math.BigDecimal(m.group(2).replace(",",""));}catch(Exception e){throw validation("INGREDIENT_AMOUNT",at+"의 분량이 숫자가 아닙니다.");}
  if(grams.signum()<=0||grams.compareTo(java.math.BigDecimal.valueOf(5000))>0)throw validation("INGREDIENT_AMOUNT",at+"의 재료 분량은 0g 초과 5000g 이하여야 합니다.");
  return new Amount(name,grams.stripTrailingZeros());
 }
 static MyRecipeService.Snapshot canonicalRecipe(MyRecipeService.Snapshot r,Criteria c,String at){
  if(r==null||!text(r.name(),100)||r.servings()<1||r.servings()>24||r.minutes()<1||r.minutes()>1440)throw validation("RECIPE_FIELDS",at+"의 음식명·인분·조리시간 형식이 올바르지 않습니다.");
  if(r.ingredients()==null||r.ingredients().isEmpty()||r.ingredients().size()>25)throw validation("INGREDIENT_COUNT",at+"의 재료 개수가 올바르지 않습니다.");
  if(r.steps()==null||r.steps().isEmpty()||r.steps().size()>20||r.steps().stream().anyMatch(s->s==null||s.isBlank()||s.length()>500))throw validation("RECIPE_STEPS",at+"의 조리 순서 형식이 올바르지 않습니다.");
  var ingredients=new ArrayList<String>();int i=0;for(String item:r.ingredients()){var a=amount(item,at+".ingredients["+i+++ "]");ingredients.add(a.name()+" "+a.grams().toPlainString()+"g");}
  var steps=r.steps().stream().map(s->s.replaceAll("\\s+"," ").strip()).toList();
  if(steps.stream().anyMatch(s->!text(s,500)))throw validation("RECIPE_STEPS",at+"의 조리 순서에 올바르지 않은 문자가 있습니다.");
  String all=norm(r.name()+" "+String.join(" ",ingredients)+" "+String.join(" ",steps));if(c.excluded().stream().anyMatch(x->all.contains(norm(x))))throw validation("EXCLUDED",at+"에 제외 조건에 해당하는 재료 또는 표현이 있습니다.");
  return new MyRecipeService.Snapshot(r.name().strip(),r.servings(),r.minutes(),List.copyOf(ingredients),steps);
 }
 static void validateRecipe(MyRecipeService.Snapshot r,Criteria c,boolean fresh){canonicalRecipe(r,c,"recipe");}
 private static boolean stringArray(JsonNode node){if(!node.isArray())return false;for(var item:node)if(!item.isTextual())return false;return true;}
 private static String checkedString(JsonNode node,int max,String code,String at){if(!node.isTextual()||!text(node.asText(),max))throw validation(code,at+"의 문자열 형식이 올바르지 않습니다.");return node.asText();}
 private static ResponseStatusException validation(String code,String detail){return error(HttpStatus.BAD_GATEWAY,"Gemini 식단 검증 실패: "+detail+" [GEMINI_PERIOD_"+code+"] 기존 식단은 유지됩니다.");}
 static String kind(String name){String n=name.replaceAll("\\s+","");if(n.endsWith("죽")||n.matches(".*(스파게티|파스타|리조또|리조토|덮밥|볶음밥|비빔밥|국수|라면|우동|김밥|초밥|쌈밥|샌드위치|카레라이스|오므라이스).*"))return "bowl";if(n.matches(".*(국|탕)$")||n.matches(".*(찌개|전골|수프|스프).*"))return "soup";if(n.matches("(백미밥|잡곡밥|쌀밥|현미밥|흑미밥|보리밥|식빵|바게트)"))return "staple";if(n.matches(".*(나물|무침|샐러드|김치|장아찌|겉절이|브로콜리|시금치).*"))return "side";return "main";}
 static boolean text(String value,int max){return value!=null&&!value.isBlank()&&value.length()<=max&&value.chars().noneMatch(Character::isISOControl);}
 static String norm(String value){return java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFKC).replaceAll("\\s+","").toLowerCase(Locale.ROOT);}
 static String string(JsonNode node,int max){if(!node.isTextual()||!text(node.asText(),max))throw invalid();return node.asText();}
 static ResponseStatusException invalid(){return error(HttpStatus.BAD_GATEWAY,"Gemini 식단이 날짜·조합·제외 재료 또는 레시피 형식 검증을 통과하지 못했습니다. 기존 식단은 유지됩니다.");}
 static ResponseStatusException error(HttpStatus status,String message){return new ResponseStatusException(status,message);}
 static Map<String,Object> schema(){
  var str=Map.of("type","STRING");var strings=Map.of("type","ARRAY","items",str);var recipe=Map.of("type","OBJECT","properties",Map.of("name",str,"servings",Map.of("type","INTEGER"),"minutes",Map.of("type","INTEGER"),"ingredients",strings,"steps",strings),"required",List.of("name","servings","minutes","ingredients","steps"));
  var fresh=Map.of("type","OBJECT","properties",Map.of("id",str,"kind",Map.of("type","STRING","enum",List.of("bowl","soup","main","staple","side")),"recipe",recipe),"required",List.of("id","kind","recipe"));
  var center=Map.of("type","OBJECT","properties",Map.of("recipeId",Map.of("type","STRING","description","중심 요리 식별자. 반드시 선택한다."),"role",Map.of("type","STRING","enum",List.of("main","soup","bowl"))),"required",List.of("recipeId","role"));
  var unused=Map.of("type","STRING","description","기존 또는 새 레시피 식별자. 사용하지 않을 때는 빈 문자열.");
  var composition=Map.of("type","OBJECT","properties",Map.of("center",center,"stapleRecipeId",unused,"soupRecipeId",unused,"sideRecipeIds",Map.of("type","ARRAY","items",str,"description","반찬 식별자 1~2개")),"required",List.of("center","stapleRecipeId","soupRecipeId","sideRecipeIds"));
  var slot=Map.of("type","OBJECT","properties",Map.of("date",str,"meal",Map.of("type","STRING","enum",List.of("breakfast","lunch","dinner")),"composition",composition,"reason",str),"required",List.of("date","meal","composition","reason"));
  return Map.of("type","OBJECT","properties",Map.of("newRecipes",Map.of("type","ARRAY","items",fresh,"maxItems",18),"slots",Map.of("type","ARRAY","items",slot,"maxItems",21)),"required",List.of("newRecipes","slots"));
 }
}
