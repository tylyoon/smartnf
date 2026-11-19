package com.onrender.smartnf.health;

import java.util.*;
import java.time.Instant;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import com.onrender.smartnf.member.*;
import static com.onrender.smartnf.health.HealthModels.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:smartnf-health;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa","spring.datasource.password=","spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false","spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:auth-test-schema.sql,classpath:health-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none","GOOGLE_LOGIN_ENABLED=false","KAKAO_LOGIN_ENABLED=false","NAVER_LOGIN_ENABLED=false"
})
class HealthStorageTests {
    @Autowired MyPageLayoutService layouts;
    @Autowired HealthDailyService daily;
    @Autowired com.onrender.smartnf.member.AccountSettingsService accounts;
    @Autowired org.springframework.security.crypto.password.PasswordEncoder passwords;
    @org.springframework.test.context.bean.override.mockito.MockitoBean com.onrender.smartnf.member.AccountMail accountMail;
    @Autowired HealthService service;@Autowired MemberRepository members;@Autowired JdbcTemplate jdbc;
    @Autowired CurrentHealthMember current;@Autowired WebApplicationContext context;MockMvc mvc;
    @BeforeEach void setup(){org.mockito.Mockito.reset(accountMail);mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();}
    long member(){long id=members.insertMember("health test",Instant.now());members.grantUser(id,Instant.now());return id;}
    ConsentState agree(long id){return service.changeConsent(id,new ConsentRequest(HealthService.DOCUMENT_VERSION,"AGREED",service.consent(id).eventId()));}
    Map<String,List<String>> fields(){return new LinkedHashMap<>(Map.of("weight",List.of("70.0"),"height",List.of("170"),"conditions",List.of("고혈압"),"diagnosed_1",List.of("2020-05"),"visit_1",List.of("2026-01-01"),"status_1",List.of("미확인"),"drinkingDays",List.of("0"),"breakfast",List.of("0")));}
    ProfileRequest request(long id,Long previous,Map<String,List<String>> fields){return new ProfileRequest(UUID.randomUUID(),previous,service.consent(id).eventId(),false,true,fields);}
    CareRequest care(long id,Long previous,Long profile,List<CareItem> items){return new CareRequest(UUID.randomUUID(),previous,profile,service.consent(id).eventId(),false,true,items);}
    void error(int code,org.junit.jupiter.api.function.Executable action){assertEquals(code,assertThrows(HealthException.class,action).status());}
    @Test void consentRequiredAndRoundTripPreservesMonthZeroAndNull(){
        long id=member();error(403,()->service.latestProfile(id));agree(id);
        var saved=service.save(id,request(id,null,fields()));var loaded=service.latestProfile(id);
        assertEquals(saved.id(),loaded.id());assertEquals(List.of("70"),loaded.fields().get("weight"));
        assertEquals(List.of("2020-05"),loaded.fields().get("diagnosed_1"));assertEquals(List.of("0"),loaded.fields().get("breakfast"));
        assertEquals(List.of("0"),loaded.fields().get("drinkingDays"));assertFalse(loaded.fields().containsKey("glucose"));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM health_measurements WHERE profile_id=?",Integer.class,saved.id()));
        assertEquals("hypertension",jdbc.queryForObject("SELECT condition_code FROM health_profile_conditions WHERE profile_id=?",String.class,saved.id()));
    }
    @Test void idempotentRetryAndStaleUpdateDoNotDuplicateOrOverwrite(){
        long id=member();agree(id);var req=request(id,null,fields());var first=service.save(id,req);assertEquals(first.id(),service.save(id,req).id());
        var changed=fields();changed.put("weight",List.of("71"));
        error(409,()->service.save(id,new ProfileRequest(req.requestId(),null,req.consentEventId(),false,true,changed)));
        error(409,()->service.save(id,request(id,null,changed)));
        var second=service.save(id,request(id,first.id(),changed));assertNotEquals(first.id(),second.id());
        assertEquals(2,service.history(id,0).size());error(409,()->service.save(id,req));
    }
    @Test void validationAndUnauthorizedOwnershipCannotWriteAnyRows(){
        long a=member(),b=member();agree(a);agree(b);var p=service.save(a,request(a,null,fields()));
        error(404,()->service.profile(b,p.id()));error(404,()->service.saveCare(b,care(b,null,p.id(),List.of(new CareItem("salt",List.of("bp"))))));
        for(var bad:List.of(Map.of("weight",List.of("NaN")),Map.of("weight",List.of("401")),Map.of("diagnosed_0",List.of("2020-05")),Map.of("role",List.of("ADMIN")),Map.of("weight",List.of("70"),"goalStart",List.of("2026-11-02"),"goalEnd",List.of("2026-11-01")))){
            error(400,()->service.save(b,request(b,null,bad)));
        }
        assertNull(service.latestProfile(b));
        var req=request(b,null,fields());error(400,()->service.save(b,new ProfileRequest(req.requestId(),null,req.consentEventId(),true,true,req.fields())));
    }
    @Test void multiScopeRemovalEmptySetReactivationAndProfileReview(){
        long id=member();agree(id);var p=service.save(id,request(id,null,fields()));
        var first=service.saveCare(id,care(id,null,p.id(),List.of(new CareItem("balanced",List.of("bmi","bp")))));
        var second=service.saveCare(id,care(id,first.id(),p.id(),List.of(new CareItem("balanced",List.of("bp")))));
        assertEquals(List.of("bp"),second.items().get(0).scopes());
        var empty=service.saveCare(id,care(id,second.id(),p.id(),List.of()));assertTrue(empty.items().isEmpty());
        var reactivated=service.saveCare(id,care(id,empty.id(),p.id(),List.of(new CareItem("salt",List.of("bp")))));
        assertNotEquals(first.id(),reactivated.id());
        error(400,()->service.saveCare(id,care(id,reactivated.id(),p.id(),List.of(new CareItem("salt",List.of("glucose"))))));
        var newProfile=service.save(id,request(id,p.id(),fields()));assertTrue(service.latestCare(id).needsReview());
        error(409,()->service.saveCare(id,care(id,reactivated.id(),p.id(),List.of())));
        assertFalse(service.saveCare(id,care(id,reactivated.id(),newProfile.id(),List.of())).needsReview());
    }
    @Test void withdrawalDeletesOnlyOwnerRecordsAndConsentEpochPreventsResurrection(){
        long a=member(),b=member();var consent=agree(a);agree(b);var old=request(a,null,fields());var p=service.save(a,old);service.save(b,request(b,null,fields()));
        service.saveCare(a,care(a,null,p.id(),List.of(new CareItem("salt",List.of("bp")))));
        service.changeConsent(a,new ConsentRequest(HealthService.DOCUMENT_VERSION,"WITHDRAWN",consent.eventId()));
        assertFalse(service.consent(a).agreed());assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_profile_versions WHERE member_id=?",Integer.class,a));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM member_care_sets WHERE member_id=?",Integer.class,a));
        assertNotNull(service.latestProfile(b));agree(a);assertNull(service.latestProfile(a));error(409,()->service.save(a,old));
    }
    @Test void failedChildInsertRollsBackProfile(){
        long id=member();agree(id);
        // Existing fixtures remain valid. Only measurements of newly inserted profiles fail.
        long existingMax=jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM health_profile_versions",Long.class);
        int beforeMeasurements=jdbc.queryForObject("SELECT COUNT(*) FROM health_measurements",Integer.class);
        jdbc.execute("ALTER TABLE health_measurements ADD CONSTRAINT health_test_failure CHECK(metric_code <> 'height' OR profile_id <= "+existingMax+")");
        try{
            assertThrows(org.springframework.dao.DataAccessException.class,()->service.save(id,request(id,null,fields())));
            assertNull(service.latestProfile(id));
            assertEquals(beforeMeasurements,jdbc.queryForObject("SELECT COUNT(*) FROM health_measurements",Integer.class));
        }
        finally{jdbc.execute("ALTER TABLE health_measurements DROP CONSTRAINT health_test_failure");}
    }
    @Test void allPrincipalsUseInternalIdAndPendingSocialIsDenied(){
        long id=member();var roles=List.of(new SimpleGrantedAuthority("ROLE_USER"));
        var local=new MemberPrincipal(new MemberRepository.LoginMember(id,"x@example.test","hash","test","ACTIVE"),roles);
        assertEquals(id,current.id(new UsernamePasswordAuthenticationToken(local,"",roles)));
        for(var social:List.of(new com.onrender.smartnf.member.kakao.KakaoPrincipal("1",id,"test",List.of("USER")),new com.onrender.smartnf.member.naver.NaverPrincipal("naver",id,"test",List.of("USER")),new com.onrender.smartnf.member.google.GooglePrincipal("google",id,"test",List.of("USER")))){
            assertEquals(id,current.id(new OAuth2AuthenticationToken(social,social.getAuthorities(),"test")));
        }
        var pending=new com.onrender.smartnf.member.google.GooglePrincipal("google",null,"",List.of());
        error(403,()->current.id(new OAuth2AuthenticationToken(pending,pending.getAuthorities(),"google")));
    }
    org.springframework.security.core.Authentication auth(long id){var p=new com.onrender.smartnf.member.naver.NaverPrincipal("test-"+id,id,"health test",List.of("USER"));return new OAuth2AuthenticationToken(p,p.getAuthorities(),"naver");}
    @Test void apiSecurityCsrfNoStoreAndPrivateTemplateRendering()throws Exception{
        long id=member();agree(id);service.save(id,request(id,null,fields()));
        mvc.perform(get("/api/me/health/profile")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/me/health/profiles").with(authentication(auth(id))).contentType("application/json").content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/me/health/profile").with(authentication(auth(id)))).andExpect(status().isOk()).andExpect(header().string("Cache-Control",containsString("no-store")));
        mvc.perform(get("/api/me/health/profile").with(authentication(auth(id))).header("X-SmartNF-Account","member:stale-tab")).andExpect(status().isConflict());
        mvc.perform(get("/health/info").with(authentication(auth(id)))).andExpect(status().isOk()).andExpect(content().string(containsString("health-db-bootstrap"))).andExpect(content().string(containsString("2020-05")));
        mvc.perform(get("/preview/health/info")).andExpect(status().isOk()).andExpect(content().string(not(containsString("id=\"health-db-bootstrap\""))));
        mvc.perform(get("/mypage").with(authentication(auth(id)))).andExpect(status().isOk()).andExpect(content().string(containsString("personal-mypage-root")));
        jdbc.update("UPDATE members SET status='SUSPENDED' WHERE id=?",id);error(403,()->service.latestProfile(id));
    }

    @Test void personalLayoutIsolationValidationConflictAndRetry(){
        long a=member(),b=member();
        assertEquals(0,layouts.get(a).revision());
        var one=layouts.save(a,new MyPageLayout.Save(0L,List.of("bp","care")));
        assertEquals(1,one.revision());assertEquals(List.of("bp","care"),layouts.get(a).widgets());
        assertEquals(MyPageLayout.DEFAULT,layouts.get(b).widgets());
        assertEquals(one,layouts.save(a,new MyPageLayout.Save(0L,List.of("bp","care"))));
        error(409,()->layouts.save(a,new MyPageLayout.Save(0L,List.of("weight"))));
        for(var bad:List.of(List.of("bp","bp"),List.of("<script>"),List.<String>of()))
            error(400,()->layouts.save(a,new MyPageLayout.Save(1L,bad)));
        jdbc.update("UPDATE members SET status='SUSPENDED' WHERE id=?",a);
        error(403,()->layouts.get(a));
        error(403,()->layouts.save(a,new MyPageLayout.Save(1L,List.of("weight"))));
        assertEquals(MyPageLayout.DEFAULT,layouts.get(b).widgets());
    }
    @Test void personalLayoutApiUsesAuthCsrfAndNoStore(){
        long a=member();
        try{
            mvc.perform(get("/api/me/health/layout")).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/me/health/layout").with(authentication(auth(a))))
              .andExpect(status().isOk()).andExpect(header().string("Cache-Control",containsString("no-store")));
            mvc.perform(post("/api/me/health/layout").with(authentication(auth(a))).contentType("application/json")
              .content("{\"expectedRevision\":0,\"widgets\":[\"bp\"]}"))
              .andExpect(status().isForbidden());
            mvc.perform(post("/api/me/health/layout").with(authentication(auth(a))).with(csrf()).contentType("application/json")
              .content("{\"expectedRevision\":0,\"widgets\":[\"bp\"]}"))
              .andExpect(status().isOk()).andExpect(content().string(containsString("bp")));
            mvc.perform(get("/api/me/health/layout").with(authentication(auth(a))).header("X-SmartNF-Account","member:"+(a+999)))
              .andExpect(status().isConflict());
        }catch(Exception e){throw new AssertionError(e);}
    }
    @Test void localSuggestionDoesNotInventOrExecuteWidgets(){
        var result=MyPageLayout.suggest("혈압과 체중만 보여줘");
        assertEquals("LOCAL_RULES",result.mode());assertEquals(List.of("bp","weight"),result.widgets());
        assertTrue(MyPageLayout.suggest("식사 분석과 리포트").widgets().isEmpty());
        error(400,()->MyPageLayout.suggest("x".repeat(301)));
        assertEquals(List.of("bp","care","privacy"),MyPageLayout.suggest("혈압 중심으로 보여줘").widgets());
    }

    long localAccount(){long id=member();members.insertCredential(id,"account-"+id+"@example.test",passwords.encode("OriginalPass123!"),Instant.now());return id;}
    @Test void passwordChangeBumpsGenerationAndRejectsOldSessions()throws Exception{
        long id=localAccount(),other=localAccount();var oldAuth=auth(id);
        assertFalse(accounts.password(id,0,"wrong","DifferentPass123!","DifferentPass123!").ok());
        assertTrue(accounts.password(id,0,"OriginalPass123!","DifferentPass123!","DifferentPass123!").logout());
        assertTrue(passwords.matches("DifferentPass123!",members.findLogin("account-"+id+"@example.test").orElseThrow().hash()));
        assertEquals(1,members.findLogin("account-"+id+"@example.test").orElseThrow().authVersion());
        error(403,()->accounts.snapshot(id,0));
        mvc.perform(get("/api/me/health/layout").with(authentication(oldAuth))).andExpect(status().isUnauthorized());
        assertNotNull(accounts.snapshot(other,0));
    }
    @Test void emailChangeRequiresBothMailboxesAndConsumesCodes(){
        long id=localAccount();String oldEmail="account-"+id+"@example.test";var codes=new HashMap<String,String>();
        org.mockito.Mockito.when(accountMail.ready()).thenReturn(true);
        org.mockito.Mockito.doAnswer(call->{codes.put(call.getArgument(0),call.getArgument(1));return null;}).when(accountMail).send(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString());
        assertTrue(accounts.requestEmail(id,0,"OriginalPass123!","new-"+id+"@example.test").ok());
        assertNotNull(members.findLogin(oldEmail).orElse(null));
        assertFalse(accounts.confirmEmail(id,0,"OriginalPass123!",codes.get(oldEmail),"wrong").ok());
        assertEquals(1,jdbc.queryForObject("SELECT failed_count FROM member_email_changes WHERE member_id=?",Integer.class,id));
        assertTrue(accounts.confirmEmail(id,0,"OriginalPass123!",codes.get(oldEmail),codes.get("new-"+id+"@example.test")).logout());
        assertTrue(members.findLogin(oldEmail).isEmpty());assertTrue(members.findLogin("new-"+id+"@example.test").isPresent());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM member_email_changes WHERE member_id=?",Integer.class,id));
        error(403,()->accounts.confirmEmail(id,0,"OriginalPass123!",codes.get(oldEmail),codes.get("new-"+id+"@example.test")));
    }
    @Test void passwordFailureLimitAndWithdrawalAreOwnerScoped()throws Exception{
        long id=localAccount(),other=localAccount();agree(id);agree(other);service.save(id,request(id,null,fields()));service.save(other,request(other,null,fields()));
        layouts.save(id,new MyPageLayout.Save(0L,List.of("bp")));
        for(int i=0;i<5;i++)assertFalse(accounts.password(id,0,"wrong","DifferentPass123!","DifferentPass123!").ok());
        assertFalse(accounts.password(id,0,"OriginalPass123!","DifferentPass123!","DifferentPass123!").ok());
        jdbc.update("UPDATE member_account_security SET window_start=? WHERE member_id=?",java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(16),id);
        assertFalse(accounts.withdraw(id,0,"OriginalPass123!","회원탈퇴",false).ok());
        assertTrue(accounts.withdraw(id,0,"OriginalPass123!","회원탈퇴",true).logout());
        assertTrue(members.findLogin("account-"+id+"@example.test").isEmpty());
        assertEquals("WITHDRAWN",jdbc.queryForObject("SELECT status FROM members WHERE id=?",String.class,id));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_profile_versions WHERE member_id=?",Integer.class,id));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM member_mypage_layouts WHERE member_id=?",Integer.class,id));
        assertNotNull(service.latestProfile(other));assertNotNull(accounts.snapshot(other,0));
        mvc.perform(get("/mypage").with(authentication(auth(id)))).andExpect(status().is3xxRedirection());
    }
    @Test void accountPageHasCsrfAndSocialOnlySafeguards()throws Exception{
        long id=localAccount(),social=member();
        mvc.perform(get("/mypage/account").with(authentication(auth(id)))).andExpect(status().isOk())
          .andExpect(content().string(containsString("name=\"_csrf\""))).andExpect(content().string(containsString("회원정보·계정 설정")));
        mvc.perform(post("/mypage/account/password").with(authentication(auth(id))).param("currentPassword","OriginalPass123!").param("newPassword","DifferentPass123!").param("passwordConfirm","DifferentPass123!"))
          .andExpect(status().isForbidden());
        assertFalse(accounts.withdraw(social,0,"","회원탈퇴",true).ok());
        assertFalse(accounts.password(social,0,"","DifferentPass123!","DifferentPass123!").ok());
        assertFalse(accounts.requestEmail(id,0,"OriginalPass123!","unused@example.test").ok());
        mvc.perform(get("/mypage/examples").with(authentication(auth(id)))).andExpect(status().isOk());
    }

    @Test void accountWithdrawalFailureRollsBackEveryDomain(){
        long id=localAccount();agree(id);service.save(id,request(id,null,fields()));layouts.save(id,new MyPageLayout.Save(0L,List.of("bp")));
        jdbc.execute("ALTER TABLE members ADD CONSTRAINT account_test_failure CHECK(status <> 'WITHDRAWN' OR id <> "+id+")");
        try{
            assertThrows(org.springframework.dao.DataAccessException.class,()->accounts.withdraw(id,0,"OriginalPass123!","회원탈퇴",true));
            assertNotNull(service.latestProfile(id));assertTrue(service.consent(id).agreed());
            assertNotNull(members.findLogin("account-"+id+"@example.test").orElse(null));
            assertEquals(List.of("bp"),layouts.get(id).widgets());assertNotNull(accounts.snapshot(id,0));
        }finally{jdbc.execute("ALTER TABLE members DROP CONSTRAINT account_test_failure");}
    }
    @Test void expiredEmailCodesAndSmtpFailureCannotChangeLogin(){
        long id=localAccount();String oldEmail="account-"+id+"@example.test",newEmail="new-"+id+"@example.test";
        org.mockito.Mockito.when(accountMail.ready()).thenReturn(true);
        assertTrue(accounts.requestEmail(id,0,"OriginalPass123!",newEmail).ok());
        jdbc.update("UPDATE member_email_changes SET expires_at=? WHERE member_id=?",java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(1),id);
        assertFalse(accounts.confirmEmail(id,0,"OriginalPass123!","bad","bad").ok());assertTrue(members.findLogin(oldEmail).isPresent());
        org.mockito.Mockito.doThrow(new org.springframework.mail.MailSendException("simulated failure")).when(accountMail).send(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString());
        assertThrows(org.springframework.mail.MailException.class,()->accounts.requestEmail(id,0,"OriginalPass123!",newEmail));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM member_email_changes WHERE member_id=?",Integer.class,id));assertTrue(members.findLogin(oldEmail).isPresent());
    }

    HealthDailyModels.Input dailyInput(){return new HealthDailyModels.Input(new java.math.BigDecimal("70.0"),new java.math.BigDecimal("120"),new java.math.BigDecimal("80"),"HOME","AM","AM","하루 메모",List.of());}
    HealthDailyModels.Save dailySave(long id,long revision,HealthDailyModels.Input input){return new HealthDailyModels.Save(UUID.randomUUID(),revision,service.consent(id).eventId(),HealthDailyModels.today(),input);}
    @Test void dailyConsentRoundtripRetryConflictAndDeletion(){
        long a=localAccount(),b=localAccount();error(403,()->daily.day(a,HealthDailyModels.today()));agree(a);agree(b);
        var request=dailySave(a,0,dailyInput());var saved=daily.save(a,request);assertEquals(1,saved.revision());assertEquals(saved,daily.save(a,request));
        assertEquals(0,daily.day(b,request.date()).revision());assertNull(daily.day(b,request.date()).record());
        error(409,()->daily.save(a,dailySave(a,0,dailyInput())));
        var delete=new HealthDailyModels.Delete(UUID.randomUUID(),1L,service.consent(a).eventId(),request.date());
        var removed=daily.delete(a,delete);assertEquals(2,removed.revision());assertNull(removed.record());assertEquals(removed,daily.delete(a,delete));
        error(409,()->daily.save(a,request));error(409,()->daily.save(a,dailySave(a,0,dailyInput())));
        assertEquals(3,daily.save(a,dailySave(a,2,dailyInput())).revision());
        error(409,()->daily.delete(a,delete));
    }
    @Test void dailyPracticeRequiresSelectedOrExistingHistoricalAction(){
        long id=localAccount();agree(id);var p=service.save(id,request(id,null,fields()));
        var care=service.saveCare(id,care(id,null,p.id(),List.of(new CareItem("salt",List.of("bp")))));
        var input=new HealthDailyModels.Input(null,null,null,"UNKNOWN","UNKNOWN","UNKNOWN","",List.of(new HealthDailyModels.Practice("salt","NOT_DONE","쉬었다")));
        assertEquals("NOT_DONE",daily.save(id,dailySave(id,0,input)).record().input().items().get(0).status());
        service.saveCare(id,care(id,care.id(),p.id(),List.of()));
        assertEquals(2,daily.save(id,dailySave(id,1,input)).revision());
        var unknown=new HealthDailyModels.Input(null,null,null,"UNKNOWN","UNKNOWN","UNKNOWN","",List.of(new HealthDailyModels.Practice("smoking","DONE","")));
        error(409,()->daily.save(id,dailySave(id,2,unknown)));
    }
    @Test void dailyWithdrawalAndAccountWithdrawalEraseOnlyOwner(){
        long a=localAccount(),b=localAccount();agree(a);agree(b);var old=dailySave(a,0,dailyInput());daily.save(a,old);daily.save(b,dailySave(b,0,dailyInput()));
        var c=service.consent(a);service.changeConsent(a,new ConsentRequest(HealthService.DOCUMENT_VERSION,"WITHDRAWN",c.eventId()));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_daily_records WHERE member_id=?",Integer.class,a));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_daily_requests WHERE member_id=?",Integer.class,a));
        agree(a);error(409,()->daily.save(a,old));assertNotNull(daily.day(b,old.date()).record());
        assertTrue(accounts.withdraw(b,0,"OriginalPass123!","회원탈퇴",true).ok());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_daily_records WHERE member_id=?",Integer.class,b));
    }
    @Test void dailyChildFailureRollsBackParentAndReceipt(){
        long id=localAccount();agree(id);var p=service.save(id,request(id,null,fields()));service.saveCare(id,care(id,null,p.id(),List.of(new CareItem("salt",List.of("bp")))));
        long maximum=jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM health_daily_records",Long.class);
        jdbc.execute("ALTER TABLE health_daily_practices ADD CONSTRAINT daily_test_failure CHECK(action_id <> 'salt' OR daily_id <= "+maximum+")");
        try{
            var input=new HealthDailyModels.Input(null,null,null,"UNKNOWN","UNKNOWN","UNKNOWN","",List.of(new HealthDailyModels.Practice("salt","DONE","")));
            assertThrows(org.springframework.dao.DataAccessException.class,()->daily.save(id,dailySave(id,0,input)));
            assertNull(daily.day(id,HealthDailyModels.today()).record());
            assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM health_daily_requests WHERE member_id=?",Integer.class,id));
        }finally{jdbc.execute("ALTER TABLE health_daily_practices DROP CONSTRAINT daily_test_failure");}
    }
    @Test void dailyApiSecurityAndDateBounds()throws Exception{
        long id=localAccount();agree(id);daily.save(id,dailySave(id,0,dailyInput()));
        mvc.perform(get("/api/me/health/daily/options")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/me/health/daily").with(authentication(auth(id))).contentType("application/json").content("{}"))
          .andExpect(status().isForbidden());
        mvc.perform(get("/api/me/health/daily/day").param("date",HealthDailyModels.today().toString()).with(authentication(auth(id))))
          .andExpect(status().isOk()).andExpect(header().string("Cache-Control",containsString("no-store")));
        error(400,()->daily.day(id,HealthDailyModels.today().plusDays(1)));
        error(400,()->daily.range(id,HealthDailyModels.today().minusDays(366),HealthDailyModels.today()));
        assertEquals(1,daily.range(id,HealthDailyModels.today(),HealthDailyModels.today()).size());
    }
    @Test void multipleGoalsRoundTripAndLegacySingleGoalRemainReadable(){
        long id=member();agree(id);var data=fields();data.put("goal",List.of("건강한 식습관","체중 관리","만성질환 관련 관리"));
        var saved=service.save(id,request(id,null,data));assertEquals(new TreeSet<>(data.get("goal")),new TreeSet<>(service.latestProfile(id).fields().get("goal")));
        assertTrue(jdbc.queryForObject("SELECT goal FROM health_profile_versions WHERE id=?",String.class,saved.id()).length()<=40);
        jdbc.update("UPDATE health_profile_versions SET goal='V1' WHERE id=?",saved.id());assertEquals(List.of("체중 관리"),service.latestProfile(id).fields().get("goal"));
        var none=fields();none.put("goal",List.of());var updated=service.save(id,request(id,saved.id(),none));assertFalse(service.profile(id,updated.id()).fields().containsKey("goal"));
    }
    @Test void duplicateAndUnknownGoalsAreRejected(){
        long id=member();agree(id);var data=fields();data.put("goal",List.of("건강한 식습관","건강한 식습관"));error(400,()->service.save(id,request(id,null,data)));
        data.put("goal",List.of("unknown"));error(400,()->service.save(id,request(id,null,data)));
    }

}
