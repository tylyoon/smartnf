package com.onrender.smartnf.demo.local;

import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.onrender.smartnf.member.*;
import com.onrender.smartnf.health.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={
 "spring.datasource.url=jdbc:h2:mem:smartnf-demo;MODE=MySQL;DB_CLOSE_DELAY=-1",
 "spring.datasource.username=sa","spring.datasource.password=","spring.datasource.driver-class-name=org.h2.Driver",
 "spring.flyway.enabled=false","spring.sql.init.mode=always",
 "spring.sql.init.schema-locations=classpath:auth-test-schema.sql,classpath:health-test-schema.sql",
 "spring.jpa.hibernate.ddl-auto=none","GOOGLE_LOGIN_ENABLED=false","KAKAO_LOGIN_ENABLED=false","NAVER_LOGIN_ENABLED=false"
})
@ActiveProfiles("local-demo")
class LocalDemoTests {
 @Autowired LocalDemoService fixtures;@Autowired MemberRepository members;@Autowired JdbcTemplate jdbc;
 @Autowired MealService meals;@Autowired HealthService health;@Autowired HealthDailyService daily;@Autowired MyPageLayoutService layouts;@Autowired PasswordEncoder passwords;
 // Test-only credential; production code has no fixture password default.
 static final String PASSWORD="fixture-only-1234%";
 @BeforeEach void clean(){fixtures.delete();}
 @AfterEach void cleanup(){fixtures.delete();jdbc.update("DELETE FROM local_credentials WHERE login_email='smartnf3@smartnf.com'");}
 @Test void seedRoundTripDoesNotOverwriteAndDeletionPreservesOtherMembers(){
  long real=members.insertMember("unrelated",java.time.Instant.now());members.grantUser(real,java.time.Instant.now());
  assertEquals(new LocalDemoService.Result(5,0,0),fixtures.seed(PASSWORD));int total=0;
  for(var p:LocalDemoFixtures.people()){
   var login=members.findLogin(p.email()).orElseThrow();assertTrue(passwords.matches(PASSWORD,login.hash()));assertNotEquals(PASSWORD,login.hash());assertTrue(login.name().startsWith("[가상]"));assertEquals(List.of("USER"),members.roles(login.id()));assertTrue(health.consent(login.id()).agreed());
   assertEquals(p.number()==5?5:8,meals.range(login.id(),LocalDemoFixtures.FROM,LocalDemoFixtures.TO).size());
   assertEquals(2,health.history(login.id(),0).size());assertEquals(p.widgets(),layouts.get(login.id()).widgets());assertEquals(p.care().size(),health.latestCare(login.id()).items().size());
   var records=daily.range(login.id(),LocalDemoFixtures.FROM,LocalDemoFixtures.TO);assertEquals(p.number()==5?5:8,records.size());total+=records.size();
  }
  assertEquals(37,total);
  long id=members.findLogin("smartnf1@smartnf.com").orElseThrow().id();var day=daily.day(id,LocalDemoFixtures.FROM);var c=health.consent(id);
  daily.delete(id,new HealthDailyModels.Delete(UUID.randomUUID(),day.revision(),c.eventId(),day.date()));
  var meal=meals.day(id,LocalDemoFixtures.FROM);meals.delete(id,new MealModels.Delete(UUID.randomUUID(),meal.revision(),c.eventId(),LocalDemoFixtures.FROM));
  assertEquals(new LocalDemoService.Result(0,5,0),fixtures.seed("changed-fixture-pass%"));assertTrue(meals.day(id,LocalDemoFixtures.FROM).items().isEmpty());assertNull(daily.day(id,day.date()).record());assertTrue(passwords.matches(PASSWORD,members.findLogin("smartnf1@smartnf.com").orElseThrow().hash()));
  assertEquals(5,fixtures.delete().deleted());assertTrue(members.findLogin("smartnf1@smartnf.com").isEmpty());assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM members WHERE id=?",Integer.class,real));assertEquals(0,fixtures.delete().deleted());
 }
 @Test void collidingUnmarkedEmailRollsBackWholeBatch(){
  long id=members.insertMember("existing",java.time.Instant.now());members.grantUser(id,java.time.Instant.now());members.insertCredential(id,"smartnf3@smartnf.com",passwords.encode(PASSWORD),java.time.Instant.now());
  assertThrows(IllegalStateException.class,()->fixtures.seed(PASSWORD));assertTrue(members.findLogin("smartnf1@smartnf.com").isEmpty());assertEquals(id,members.findLogin("smartnf3@smartnf.com").orElseThrow().id());assertEquals(0,fixtures.delete().deleted());
 }
 @Test void failureAfterMemberInsertRollsBackAllFixtures(){
  jdbc.update("DELETE FROM consent_documents WHERE consent_type='HEALTH_DATA' AND version=?",HealthService.DOCUMENT_VERSION);
  try{assertThrows(RuntimeException.class,()->fixtures.seed(PASSWORD));for(var p:LocalDemoFixtures.people())assertTrue(members.findLogin(p.email()).isEmpty());}
  finally{jdbc.update("INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at) VALUES ('HEALTH_DATA',?,FALSE,'/mypage/consent/document',CURRENT_TIMESTAMP)",HealthService.DOCUMENT_VERSION);}
 }
 @Test void deletionAcceptsWithdrawnFixturesButRefusesPromotedOrSocialAccounts(){
  fixtures.seed(PASSWORD);long id=members.findLogin("smartnf5@smartnf.com").orElseThrow().id();
  jdbc.update("INSERT INTO member_roles(member_id,role,granted_at) VALUES (?,'ADMIN',CURRENT_TIMESTAMP)",id);
  assertThrows(IllegalStateException.class,()->fixtures.delete());assertTrue(members.findLogin("smartnf1@smartnf.com").isPresent());
  jdbc.update("DELETE FROM member_roles WHERE member_id=? AND role='ADMIN'",id);
  members.insertSocial(id,"KAKAO","fixture-provider-only",java.time.Instant.now());
  assertThrows(IllegalStateException.class,()->fixtures.delete());
  jdbc.update("DELETE FROM social_accounts WHERE member_id=?",id);
  jdbc.update("UPDATE members SET status='WITHDRAWN' WHERE id=?",id);
  assertEquals(5,fixtures.delete().deleted());
 }
 @Test void mealExtensionDoesNotUndoFixtureWithdrawal(){
  fixtures.seed(PASSWORD);long id=members.findLogin("smartnf1@smartnf.com").orElseThrow().id();
  var c=health.consent(id);health.changeConsent(id,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"WITHDRAWN",c.eventId()));
  jdbc.update("DELETE FROM member_consents WHERE member_id=? AND decision='MEAL_REFS_V2'",id);
  fixtures.seed(PASSWORD);assertFalse(health.consent(id).agreed());assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_days WHERE member_id=?",Integer.class,id));
 }
 @Test void onlyExactUntouchedOldDemoMealsAreUpgraded(){
  fixtures.seed(PASSWORD);long id=members.findLogin("smartnf1@smartnf.com").orElseThrow().id();long epoch=health.consent(id).eventId();
  var date=LocalDemoFixtures.FROM;long dayId=jdbc.queryForObject("SELECT id FROM health_meal_days WHERE member_id=? AND record_date=?",Long.class,id,java.sql.Date.valueOf(date));
  jdbc.update("DELETE FROM health_meal_ingredients WHERE day_id=?",dayId);jdbc.update("DELETE FROM health_meal_items WHERE day_id=?",dayId);
  int position=0;for(var i:LegacyDemoMeals.days(1).get(date))jdbc.update("INSERT INTO health_meal_items(day_id,position_no,meal,food_id,food_name,grams,meal_time,note,source_version,source_name) VALUES (?,?,?,?,?,?,?,?,'legacy','legacy')",dayId,position++,i.meal(),i.foodId(),i.name(),i.grams(),i.time(),i.note());
  jdbc.update("DELETE FROM member_consents WHERE member_id=? AND decision='MEAL_REFS_V2'",id);
  long marker=jdbc.queryForObject("SELECT id FROM consent_documents WHERE consent_type='LOCAL_DEMO_FIXTURE' AND version=?",Long.class,LocalDemoService.MARKER);
  jdbc.update("INSERT INTO member_consents(member_id,document_id,decision,recorded_at) VALUES (?,?,'MEALS_V1',CURRENT_TIMESTAMP)",id,marker);
  var next=meals.day(id,date.plusDays(1));meals.save(id,new MealModels.Save(UUID.randomUUID(),next.revision(),epoch,next.date(),List.of(new MealModels.Input("lunch","내가 수정한 식사","","",List.of(),false))));
  fixtures.seed(PASSWORD);
  assertEquals(LocalDemoMeals.days(1).get(date).get(0).name(),meals.day(id,date).items().get(0).name());assertEquals(2,meals.day(id,date).revision());assertEquals("내가 수정한 식사",meals.day(id,next.date()).items().get(0).name());assertEquals(2,health.history(id,0).size());
 }
 @Test void explicitLocalGuardRejectsRemoteDatabasePublicBindAndProduction(){
  LocalDemoRunner.guard(new String[]{"local-demo"},"127.0.0.1","jdbc:mysql://localhost:3306/smartnf?serverTimezone=Asia/Seoul","seed");
  for(String url:List.of("jdbc:mysql://db.example:3306/smartnf","jdbc:mysql://localhost:3306/other","jdbc:h2:mem:test","jdbc:mysql://localhost.attacker/smartnf","jdbc:mysql://localhost/smartnf?socketFactory=remote.Factory","jdbc:mysql://localhost/smartnf?host=remote"))assertThrows(IllegalStateException.class,()->LocalDemoRunner.guard(new String[]{"local-demo"},"127.0.0.1",url,"seed"));
  assertThrows(IllegalStateException.class,()->LocalDemoRunner.guard(new String[]{"prod","local-demo"},"127.0.0.1","jdbc:mysql://localhost/smartnf","seed"));
  assertThrows(IllegalStateException.class,()->LocalDemoRunner.guard(new String[]{"local-demo"},"0.0.0.0","jdbc:mysql://localhost/smartnf","seed"));
  assertThrows(IllegalStateException.class,()->LocalDemoRunner.guard(new String[]{"local-demo"},"127.0.0.1","jdbc:mysql://localhost/smartnf","reset"));
 }
 @Test void deletingFixturesAlsoErasesOnlyTheirFoodPlans(){fixtures.seed(PASSWORD);long fixture=members.findLogin("smartnf1@smartnf.com").orElseThrow().id(),other=members.insertMember("independent plan",java.time.Instant.now());members.grantUser(other,java.time.Instant.now());var service=new FoodPlanService(jdbc,new HealthRepository(jdbc));for(long id:List.of(fixture,other)){var c=service.changeConsent(id,new FoodPlanModels.ConsentChange(FoodPlanModels.DOCUMENT,"AGREED",null));service.save(id,new FoodPlanModels.Save(UUID.randomUUID(),0L,c.eventId(),java.time.LocalDate.of(2026,11,5),List.of(new FoodPlanModels.Input("SHOPPING","","","",List.of(new FoodPlanModels.Item("mfds_dishes:D404-197000000-0001","",List.of()))))));}fixtures.delete();assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM food_plan_days WHERE member_id=?",Integer.class,fixture));assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM food_plan_days WHERE member_id=?",Integer.class,other));}

}
