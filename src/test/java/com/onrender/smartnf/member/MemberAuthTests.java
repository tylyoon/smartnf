package com.onrender.smartnf.member;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:smartnf-auth;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false", "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none", "GOOGLE_LOGIN_ENABLED=false", "KAKAO_LOGIN_ENABLED=false", "NAVER_LOGIN_ENABLED=false"
})
class MemberAuthTests {
    @Autowired WebApplicationContext context;
    @Autowired MemberService service;
    @Autowired MemberRepository repository;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;
    private static final String PASSWORD="LocalTestPass-2026!";
    @BeforeEach void setup(){mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();}
    SignupForm form(String email){var f=new SignupForm();f.setEmail(email);f.setDisplayName("검증 회원");f.setPassword(PASSWORD);f.setPasswordConfirm(PASSWORD);f.setTermsAccepted(true);f.setPrivacyAccepted(true);f.setDocumentVersion(MemberService.DOCUMENT_VERSION);return f;}
    String email(){return "test-"+UUID.randomUUID()+"@example.test";}

    @Test void signupHashesPasswordRecordsConsentAndGrantsOnlyUser(){
        String email=email();service.signup(form(email.toUpperCase(java.util.Locale.ROOT)));
        var member=repository.findLogin(email).orElseThrow();
        assertNotEquals(PASSWORD,member.hash());assertTrue(encoder.matches(PASSWORD,member.hash()));
        assertEquals(java.util.List.of("USER"),repository.roles(member.id()));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM member_consents WHERE member_id=?",Integer.class,member.id()));
    }
    @Test void duplicateEmailRollsBackNewMemberAndRelatedRows(){
        String email=email();service.signup(form(email));
        int before=jdbc.queryForObject("SELECT COUNT(*) FROM members",Integer.class);
        assertThrows(org.springframework.dao.DuplicateKeyException.class,()->service.signup(form(email.toUpperCase(java.util.Locale.ROOT))));
        assertEquals(before,jdbc.queryForObject("SELECT COUNT(*) FROM members",Integer.class));
    }
    @Test void actualDatabaseLoginNormalizesEmailAndSuspendedMemberIsDenied() throws Exception {
        String email=email();service.signup(form(email));
        mvc.perform(formLogin().user(email.toUpperCase(java.util.Locale.ROOT)).password(PASSWORD))
            .andExpect(authenticated().withUsername(email)).andExpect(redirectedUrl("/"));
        jdbc.update("UPDATE members SET status='SUSPENDED' WHERE id=?",repository.findLogin(email).orElseThrow().id());
        mvc.perform(formLogin().user(email).password(PASSWORD)).andExpect(unauthenticated()).andExpect(redirectedUrl("/login?error"));
    }
    @Test void signupRequiresCsrfAndCannotAcceptAdminRole() throws Exception {
        String email=email();
        mvc.perform(post("/signup").param("email",email)).andExpect(status().isForbidden());
        mvc.perform(post("/signup").with(csrf()).param("email",email).param("displayName","member")
            .param("password",PASSWORD).param("passwordConfirm",PASSWORD).param("termsAccepted","true")
            .param("privacyAccepted","true").param("documentVersion",MemberService.DOCUMENT_VERSION).param("role","ADMIN"))
            .andExpect(redirectedUrl("/login?registered"));
        assertEquals(java.util.List.of("USER"),repository.roles(repository.findLogin(email).orElseThrow().id()));
    }
    @Test void mismatchMissingConsentAndOldVersionCreateNoAccount() throws Exception {
        for(String mode:java.util.List.of("password","consent","version")){
            String email=email();
            mvc.perform(post("/signup").with(csrf()).param("email",email).param("displayName","member")
                .param("password",PASSWORD).param("passwordConfirm",mode.equals("password")?"different":PASSWORD)
                .param("termsAccepted",mode.equals("consent")?"false":"true").param("privacyAccepted","true")
                .param("documentVersion",mode.equals("version")?"old":MemberService.DOCUMENT_VERSION))
                .andExpect(status().isOk()).andExpect(view().name("account/signup"));
            assertTrue(repository.findLogin(email).isEmpty());
        }
    }
    @Test void utf8PasswordLongerThanBcryptLimitIsRejected(){
        var f=form(email());f.setPassword("가".repeat(25));f.setPasswordConfirm(f.getPassword());
        assertThrows(IllegalArgumentException.class,()->service.signup(f));
        assertTrue(repository.findLogin(f.getEmail()).isEmpty());
    }
    @Test void unconfiguredSocialButtonsAreHidden() throws Exception {
        for(String path:java.util.List.of("/login","/signup","/preview/account/signup")) {
            mvc.perform(get(path)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("href=\"/oauth2/authorization/kakao\""))))
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("href=\"/oauth2/authorization/naver\""))))
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("href=\"/oauth2/authorization/google\""))));
        }
    }
    @Test void signupRendersCsrfAndVersionedDocuments() throws Exception {
        mvc.perform(get("/signup")).andExpect(status().isOk()).andExpect(content().string(containsString("name=\"_csrf\"")))
            .andExpect(content().string(containsString(MemberService.DOCUMENT_VERSION)));
        mvc.perform(get("/signup/documents/privacy")).andExpect(status().isOk()).andExpect(content().string(containsString("비밀번호 해시")));
    }
}
