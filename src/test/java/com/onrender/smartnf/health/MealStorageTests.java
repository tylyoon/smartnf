package com.onrender.smartnf.health;
import java.util.*;import java.time.*;import java.math.BigDecimal;
import org.junit.jupiter.api.*;import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;import org.springframework.jdbc.core.JdbcTemplate;
import com.onrender.smartnf.member.MemberRepository;
import static org.junit.jupiter.api.Assertions.*;import static com.onrender.smartnf.health.MealModels.*;
@SpringBootTest(properties={
 "spring.datasource.url=jdbc:h2:mem:smartnf-meals;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","spring.datasource.driver-class-name=org.h2.Driver",
 "spring.flyway.enabled=false","spring.sql.init.mode=always","spring.sql.init.schema-locations=classpath:auth-test-schema.sql,classpath:health-test-schema.sql","spring.jpa.hibernate.ddl-auto=none","GOOGLE_LOGIN_ENABLED=false","KAKAO_LOGIN_ENABLED=false","NAVER_LOGIN_ENABLED=false"
})
class MealStorageTests {
 @Autowired org.springframework.web.context.WebApplicationContext web;
 @Autowired MealService meals;@Autowired HealthService health;@Autowired MemberRepository members;@Autowired JdbcTemplate jdbc;
 final LocalDate date=LocalDate.of(2026,10,25);
 long member(){long id=members.insertMember("meal test",Instant.now());members.grantUser(id,Instant.now());return id;}
 long agree(long id){return health.changeConsent(id,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"AGREED",health.consent(id).eventId())).eventId();}
 List<Input> input(){return List.of(new Input("breakfast","밥과 반찬","08:00","note",List.of(MealCatalog.FOODS.get(0).id()),true),new Input("lunch","외식 메뉴 · 재료 미확인","","",List.of(),false));}
 Save save(long epoch,long rev){return new Save(UUID.randomUUID(),rev,epoch,date,input());}
 void code(int status,org.junit.jupiter.api.function.Executable run){assertEquals(status,assertThrows(HealthException.class,run).status());}
 @Test void serverCatalogSnapshotsOwnershipAndNullNutrients(){
  long a=member(),b=member();code(403,()->meals.day(a,date));long epoch=agree(a);agree(b);var saved=meals.save(a,save(epoch,0));
  assertEquals("밥과 반찬",saved.items().get(0).name());assertTrue(saved.items().get(0).ingredientsConfirmed());assertEquals(0,MealCatalog.FOODS.get(0).nutrients().get("energy").compareTo(saved.items().get(0).ingredients().get(0).nutrients().get("energy")));assertTrue(saved.items().get(1).ingredients().isEmpty());assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_items WHERE grams IS NOT NULL AND day_id IN (SELECT id FROM health_meal_days WHERE member_id=?)",Integer.class,a));assertEquals(0,meals.day(b,date).items().size());assertEquals(1,meals.range(a,date,date).size());
 }
 @Test void fullCatalogSavesHairtailAndLiquidBasisWithoutConverting(){
  long id=member(),epoch=agree(id);
  var hairtail=MealCatalog.all().stream().filter(f->f.name().contains("갈치")).findFirst().orElseThrow();
  var liquid=MealCatalog.all().stream().filter(f->f.basis().equals("100ml")).findFirst().orElseThrow();
  var saved=meals.save(id,new Save(UUID.randomUUID(),0L,epoch,date,List.of(new Input("dinner","직접 확인한 식품","","",List.of(hairtail.id(),liquid.id()),true))));
  var refs=saved.items().get(0).ingredients();assertEquals(2,refs.size());
  var actual=refs.stream().filter(f->f.foodId().equals(liquid.id())).findFirst().orElseThrow();
  assertEquals("100ml",actual.basis());assertEquals(liquid.nutrients().get("energy").stripTrailingZeros(),actual.nutrients().get("energy"));
  assertEquals(22983,MealCatalog.all().size());
 }
 @Test void repeatedRequestAndConflictsAndDeleteCannotResurrect(){
  long id=member(),epoch=agree(id);var request=save(epoch,0);var first=meals.save(id,request);assertEquals(first,meals.save(id,request));code(409,()->meals.save(id,save(epoch,0)));
  code(409,()->meals.save(id,new Save(request.requestId(),0L,epoch,date.plusDays(1),input())));
  var remove=new Delete(UUID.randomUUID(),first.revision(),epoch,date);var deleted=meals.delete(id,remove);assertEquals(2,deleted.revision());assertTrue(deleted.items().isEmpty());assertEquals(deleted,meals.delete(id,remove));code(409,()->meals.save(id,request));assertEquals(0,meals.range(id,date,date).size());
 }
 @Test void withdrawalErasesMealsRequestsAndOnlyOwnerThenOldEpochFails(){
  long a=member(),b=member(),epoch=agree(a);long other=agree(b);meals.save(a,save(epoch,0));meals.save(b,save(other,0));
  var withdrawn=health.changeConsent(a,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"WITHDRAWN",epoch));assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_days WHERE member_id=?",Integer.class,a));assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_requests WHERE member_id=?",Integer.class,a));
  assertEquals(2,meals.day(b,date).items().size());health.changeConsent(a,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"AGREED",withdrawn.eventId()));code(409,()->meals.save(a,save(epoch,0)));assertTrue(meals.day(a,date).items().isEmpty());
 }
 @Test void invalidRowsDatesAndRangeAreRejected(){
  long id=member(),epoch=agree(id);code(400,()->meals.save(id,new Save(UUID.randomUUID(),0L,epoch,date,List.of(new Input("invalid","name","","",List.of(),false)))));
  code(400,()->meals.save(id,new Save(UUID.randomUUID(),0L,epoch,date,List.of(new Input("breakfast","name","","",List.of("bad-id"),true)))));
  code(400,()->meals.save(id,new Save(UUID.randomUUID(),0L,epoch,date,List.of(new Input("breakfast","name","25:00","",List.of(),false)))));
  code(400,()->meals.save(id,new Save(UUID.randomUUID(),0L,epoch,date,List.of(new Input("lunch","음식","","",List.of(MealCatalog.FOODS.get(0).id()),false)))));
  code(400,()->meals.day(id,HealthDailyModels.today().plusDays(1)));code(400,()->meals.range(id,date,date.minusDays(1)));
 }
 @Test void failedChildInsertRollsBackDayAndReceipt(){
  long id=member(),epoch=agree(id);
  // Keep rows from other tests valid; fail only child inserts for a newly allocated day.
  long existingMax=jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM health_meal_days",Long.class);
  int beforeItems=jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_items",Integer.class);
  jdbc.execute("ALTER TABLE health_meal_items ADD CONSTRAINT force_meal_failure CHECK(day_id <= "+existingMax+")");
  try{
   assertThrows(org.springframework.dao.DataAccessException.class,()->meals.save(id,save(epoch,0)));
   assertEquals(0,meals.day(id,date).revision());
   assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_days WHERE member_id=?",Integer.class,id));
   assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_requests WHERE member_id=?",Integer.class,id));
   assertEquals(beforeItems,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_items",Integer.class));
  }finally{jdbc.execute("ALTER TABLE health_meal_items DROP CONSTRAINT force_meal_failure");}
 }
 @Test void failedIngredientInsertRollsBackParentRowsAndReceipt(){
  long id=member(),epoch=agree(id);long maximum=jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM health_meal_days",Long.class);
  int before=jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_ingredients",Integer.class);
  jdbc.execute("ALTER TABLE health_meal_ingredients ADD CONSTRAINT force_ingredient_failure CHECK(day_id <= "+maximum+")");
  try{assertThrows(org.springframework.dao.DataAccessException.class,()->meals.save(id,save(epoch,0)));assertEquals(0,meals.day(id,date).revision());assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_days WHERE member_id=?",Integer.class,id));assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_requests WHERE member_id=?",Integer.class,id));assertEquals(before,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_ingredients",Integer.class));}
  finally{jdbc.execute("ALTER TABLE health_meal_ingredients DROP CONSTRAINT force_ingredient_failure");}
 }
 @Test void apiRequiresAuthenticationCsrfAndNeverCachesPersonalMeals()throws Exception{
  long id=member();agree(id);
  var principal=new com.onrender.smartnf.member.naver.NaverPrincipal("meal-"+id,id,"meal test",List.of("USER"));
  var auth=new org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken(principal,principal.getAuthorities(),"naver");
  var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(web).apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
  mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/me/health/meals/day?date=2026-10-25")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
  mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/me/health/meals").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(auth)).contentType("application/json").content("{}"))
   .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
  mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/me/health/meals/day?date=2026-10-25").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(auth)))
   .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store")));
 }

}
