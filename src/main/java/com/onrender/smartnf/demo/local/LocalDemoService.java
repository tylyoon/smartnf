package com.onrender.smartnf.demo.local;

import java.time.*;
import java.util.*;
import com.onrender.smartnf.member.*;
import com.onrender.smartnf.health.*;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** No HTTP endpoint. Marker rows identify fixture ownership independently of editable email/name. */
@Service
@Profile("local-demo")
public class LocalDemoService {
    static final String MARKER="local-demo-20261102", PATH="local-only:fictional-five-members-v1";
    private final JdbcTemplate jdbc;private final MemberRepository members;private final MemberService signup;
    private final HealthService health;private final HealthDailyService daily;private final MyPageLayoutService layouts;
    private final PasswordEncoder passwords;private final MealService meals;
    public LocalDemoService(JdbcTemplate jdbc,MemberRepository members,MemberService signup,HealthService health,HealthDailyService daily,MyPageLayoutService layouts,PasswordEncoder passwords,MealService meals){
        this.jdbc=jdbc;this.members=members;this.signup=signup;this.health=health;this.daily=daily;this.layouts=layouts;this.passwords=passwords;this.meals=meals;
    }
    public record Result(int created,int skipped,int deleted){}
    private Long marker(boolean create){
        var rows=jdbc.queryForList("SELECT id FROM consent_documents WHERE consent_type='LOCAL_DEMO_FIXTURE' AND version=?",Long.class,MARKER);
        if(rows.isEmpty()){
            if(!create)return null;
            jdbc.update("INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at) VALUES ('LOCAL_DEMO_FIXTURE',?,FALSE,?,?)",MARKER,PATH,LocalDateTime.now(ZoneOffset.UTC));
            rows=jdbc.queryForList("SELECT id FROM consent_documents WHERE consent_type='LOCAL_DEMO_FIXTURE' AND version=?",Long.class,MARKER);
        }
        long id=rows.get(0);String path=jdbc.queryForObject("SELECT document_path FROM consent_documents WHERE id=? FOR UPDATE",String.class,id);
        if(!PATH.equals(path))throw new IllegalStateException("가상 데이터 식별 문서가 일치하지 않습니다.");return id;
    }
    private List<Long> owned(long marker,int number){return jdbc.queryForList("SELECT member_id FROM member_consents WHERE document_id=? AND decision=? ORDER BY id",Long.class,marker,"FIXTURE_"+number);}
    private Long owner(long marker,int number){var ids=owned(marker,number);if(ids.size()>1)throw new IllegalStateException("중복 가상 데이터 식별자가 있습니다.");return ids.isEmpty()?null:ids.get(0);}
    private void safe(long member){
        jdbc.queryForObject("SELECT id FROM members WHERE id=? FOR UPDATE",Long.class,member);
        if(jdbc.queryForObject("SELECT COUNT(*) FROM social_accounts WHERE member_id=?",Long.class,member)!=0||members.roles(member).stream().anyMatch(r->!r.equals("USER")))
            throw new IllegalStateException("SNS 연결 또는 추가 권한이 있는 가상 계정은 자동 처리하지 않습니다.");
    }
    @Transactional
    public Result seed(String password){
        if(password==null||password.length()<12||password.length()>64||password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new IllegalArgumentException("가상 계정 비밀번호를 12~64자, UTF-8 72바이트 이내로 입력하세요.");
        if(LocalDemoFixtures.TO.isAfter(HealthDailyModels.today()))throw new IllegalStateException("가상 기록 기간이 현재 날짜 이후입니다.");
        long marker=marker(true);int created=0,skipped=0;
        // Preflight all five identities before writing a member; the whole operation is one transaction.
        for(var p:LocalDemoFixtures.people()){
            Long id=owner(marker,p.number());
            if(id!=null){safe(id);continue;}
            if(members.findLogin(p.email()).isPresent())throw new IllegalStateException("예정 이메일과 기존 회원이 충돌합니다. 기존 회원은 변경하지 않습니다.");
        }
        for(var p:LocalDemoFixtures.people()){
            if(owner(marker,p.number())!=null){skipped++;continue;}
            var form=new SignupForm();form.setEmail(p.email());form.setDisplayName(p.name());form.setPassword(password);form.setPasswordConfirm(password);form.setTermsAccepted(true);form.setPrivacyAccepted(true);form.setDocumentVersion(MemberService.DOCUMENT_VERSION);signup.signup(form);
            long id=members.findLogin(p.email()).orElseThrow().id();
            if(!passwords.matches(password,members.findLogin(p.email()).orElseThrow().hash()))throw new IllegalStateException("가상 계정 비밀번호 검증 실패");
            jdbc.update("INSERT INTO member_consents(member_id,document_id,decision,recorded_at) VALUES (?,?,?,?)",id,marker,"FIXTURE_"+p.number(),LocalDateTime.now(ZoneOffset.UTC));
            var consent=health.changeConsent(id,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"AGREED",health.consent(id).eventId()));
            var first=health.save(id,new HealthModels.ProfileRequest(UUID.randomUUID(),null,consent.eventId(),false,true,LocalDemoFixtures.profile(p,false)));
            var latest=health.save(id,new HealthModels.ProfileRequest(UUID.randomUUID(),first.id(),consent.eventId(),false,true,LocalDemoFixtures.profile(p,true)));
            health.saveCare(id,new HealthModels.CareRequest(UUID.randomUUID(),null,latest.id(),consent.eventId(),false,true,p.care()));
            for(var entry:LocalDemoFixtures.daily(p).entrySet())daily.save(id,new HealthDailyModels.Save(UUID.randomUUID(),0L,consent.eventId(),entry.getKey(),entry.getValue()));
            layouts.save(id,new MyPageLayout.Save(0L,p.widgets()));created++;
        }
        for(var p:LocalDemoFixtures.people()){
            Long id=owner(marker,p.number());if(id==null)continue;
            if(!"ACTIVE".equals(jdbc.queryForObject("SELECT status FROM members WHERE id=?",String.class,id)))continue;
            if(jdbc.queryForObject("SELECT COUNT(*) FROM member_consents WHERE member_id=? AND document_id=? AND decision='MEAL_REFS_V2'",Integer.class,id,marker)>0)continue;
            var latestDecision=jdbc.queryForList("SELECT c.decision FROM member_consents c JOIN consent_documents d ON d.id=c.document_id WHERE c.member_id=? AND d.consent_type='HEALTH_DATA' ORDER BY c.id DESC LIMIT 1",String.class,id);
            if(latestDecision.isEmpty()||!latestDecision.get(0).equals("AGREED"))continue; // Never undo a fixture's withdrawal.
            var c=health.consent(id);if(!c.agreed())c=health.changeConsent(id,new HealthModels.ConsentRequest(HealthService.DOCUMENT_VERSION,"AGREED",c.eventId()));
            for(var e:LocalDemoMeals.days(p.number()).entrySet()){
                var day=meals.day(id,e.getKey());if(day.revision()!=0&&!untouchedLegacy(id,e.getKey(),p.number(),day.revision()))continue;
                meals.save(id,new MealModels.Save(UUID.randomUUID(),day.revision(),c.eventId(),e.getKey(),e.getValue()));
            }
            jdbc.update("INSERT INTO member_consents(member_id,document_id,decision,recorded_at) VALUES (?,?,'MEAL_REFS_V2',?)",id,marker,LocalDateTime.now(ZoneOffset.UTC));
        }
        return new Result(created,skipped,0);
    }
    private boolean untouchedLegacy(long member,LocalDate date,int person,long revision){
        if(revision!=1)return false;
        // Require the original generator marker AND exact old content, never merely a [가상] name.
        if(jdbc.queryForObject("SELECT COUNT(*) FROM member_consents c JOIN consent_documents d ON d.id=c.document_id WHERE c.member_id=? AND c.decision='MEALS_V1' AND d.consent_type='LOCAL_DEMO_FIXTURE' AND d.version=?",Integer.class,member,MARKER)!=1)return false;
        var expected=LegacyDemoMeals.days(person).get(date);if(expected==null)return false;
        var actual=jdbc.query("SELECT i.* FROM health_meal_items i JOIN health_meal_days d ON d.id=i.day_id WHERE d.member_id=? AND d.record_date=? AND d.deleted=FALSE AND i.ingredients_confirmed=FALSE ORDER BY i.position_no",(r,n)->new LegacyDemoMeals.Item(r.getString("meal"),r.getString("food_id"),r.getString("food_name"),r.getBigDecimal("grams")==null?null:r.getBigDecimal("grams").stripTrailingZeros(),r.getString("meal_time"),r.getString("note")),member,java.sql.Date.valueOf(date));
        var normalized=expected.stream().map(i->new LegacyDemoMeals.Item(i.meal(),i.foodId(),i.name(),i.grams().stripTrailingZeros(),i.time(),i.note())).toList();
        return actual.equals(normalized)&&jdbc.queryForObject("SELECT COUNT(*) FROM health_meal_items i JOIN health_meal_days d ON d.id=i.day_id WHERE d.member_id=? AND d.record_date=?",Integer.class,member,java.sql.Date.valueOf(date))==normalized.size();
    }
    @Transactional
    public Result delete(){
        Long marker=marker(false);if(marker==null)return new Result(0,0,0);var ids=new ArrayList<Long>();
        for(int n=1;n<=5;n++){Long id=owner(marker,n);if(id!=null){safe(id);ids.add(id);}}
        for(long id:ids){
            jdbc.update("DELETE FROM food_plan_requests WHERE member_id=?",id);
            jdbc.update("DELETE FROM food_plan_days WHERE member_id=?",id);
            // Also works after fixture account withdrawal; never reactivate an inactive member.
        jdbc.update("DELETE FROM health_meal_ingredients WHERE day_id IN (SELECT id FROM health_meal_days WHERE member_id=?)",id);
        jdbc.update("DELETE FROM health_meal_items WHERE day_id IN (SELECT id FROM health_meal_days WHERE member_id=?)",id);
        jdbc.update("DELETE FROM health_meal_requests WHERE member_id=?",id);
        jdbc.update("DELETE FROM health_meal_days WHERE member_id=?",id);
            jdbc.update("DELETE FROM health_daily_practices WHERE daily_id IN (SELECT id FROM health_daily_records WHERE member_id=?)",id);
            jdbc.update("DELETE FROM health_daily_requests WHERE member_id=?",id);
            jdbc.update("DELETE FROM health_daily_records WHERE member_id=?",id);
            jdbc.update("DELETE FROM member_care_item_scopes WHERE set_id IN (SELECT id FROM member_care_sets WHERE member_id=?)",id);
            jdbc.update("DELETE FROM member_care_items WHERE set_id IN (SELECT id FROM member_care_sets WHERE member_id=?)",id);
            jdbc.update("DELETE FROM member_care_sets WHERE member_id=?",id);
            jdbc.update("DELETE FROM health_measurements WHERE profile_id IN (SELECT id FROM health_profile_versions WHERE member_id=?)",id);
            jdbc.update("DELETE FROM health_profile_conditions WHERE profile_id IN (SELECT id FROM health_profile_versions WHERE member_id=?)",id);
            jdbc.update("DELETE FROM health_profile_versions WHERE member_id=?",id);
            // Table names are fixed code, and every deletion is restricted to the marked member ID.
            for(String table:List.of("member_email_changes","member_account_security","member_mypage_layouts","local_credentials","member_roles","member_consents"))jdbc.update("DELETE FROM "+table+" WHERE member_id=?",id);
            jdbc.update("DELETE FROM members WHERE id=?",id);
        }
        return new Result(0,0,ids.size());
    }
}
