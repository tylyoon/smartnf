package com.onrender.smartnf.member.kakao;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import com.onrender.smartnf.member.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:smartnf-kakao;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa","spring.datasource.password=","spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false","spring.sql.init.mode=always","spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none","GOOGLE_LOGIN_ENABLED=false", "KAKAO_LOGIN_ENABLED=true", "NAVER_LOGIN_ENABLED=false","KAKAO_REST_API_KEY=fake-key",
    "KAKAO_CLIENT_SECRET=fake-secret","SMARTNF_PUBLIC_BASE_URL=http://localhost:8080"
})
class KakaoAuthTests {
    @Autowired WebApplicationContext context;
    @Autowired KakaoMemberService members;
    @Autowired MemberRepository repository;
    @Autowired MemberService localMembers;
    @Autowired JdbcTemplate jdbc;
    @Autowired KakaoLoginHandlers handlers;
    MockMvc mvc;
    @BeforeEach void setup(){mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();}
    String id(){return Long.toString((UUID.randomUUID().getMostSignificantBits()&Long.MAX_VALUE)|1L);}
    KakaoSignupForm form(){var f=new KakaoSignupForm();f.setDisplayName("카카오 시험회원");f.setTermsAccepted(true);f.setPrivacyAccepted(true);f.setDocumentVersion(KakaoMemberService.DOCUMENT_VERSION);return f;}

    @Test void enabledButtonUsesConfiguredOriginAndDoesNotExposeSecrets() throws Exception{
        mvc.perform(get("/login").with(r->{r.setServerPort(8080);return r;}))
            .andExpect(content().string(containsString("href=\"/oauth2/authorization/kakao\"")))
            .andExpect(content().string(not(containsString("fake-secret"))))
            .andExpect(content().string(not(containsString("/oauth2/authorization/google"))));
        mvc.perform(get("/login").with(r->{r.setServerPort(8081);return r;}))
            .andExpect(content().string(not(containsString("href=\"/oauth2/authorization/kakao\""))));
    }
    @Test void authorizationUsesStateAndFixedCallback() throws Exception{
        mvc.perform(get("/oauth2/authorization/kakao").with(r->{r.setServerPort(8080);return r;}))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location",startsWith("https://kauth.kakao.com/oauth/authorize?")))
            .andExpect(header().string("Location",containsString("state=")))
            .andExpect(header().string("Location",not(containsString("fake-secret"))));
        mvc.perform(get("/login/oauth2/code/kakao").param("code","not-a-real-code").param("state","wrong-state"))
            .andExpect(redirectedUrl("/login?socialError"));
    }
    @Test void signupCreatesOnlySocialCredentialsAndReusesMemberOnLogin(){
        String id=id();var pending=new PendingKakao(id,System.currentTimeMillis());
        assertNull(members.resolve(id).getMemberId());members.signup(pending,form());
        var principal=members.resolve(id);assertNotNull(principal.getMemberId());
        assertEquals(java.util.List.of("USER"),repository.roles(principal.getMemberId()));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM local_credentials WHERE member_id=?",Integer.class,principal.getMemberId()));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM member_consents WHERE member_id=?",Integer.class,principal.getMemberId()));
        assertThrows(IllegalArgumentException.class,()->members.signup(pending,form()));
        jdbc.update("UPDATE members SET status='SUSPENDED' WHERE id=?",principal.getMemberId());
        assertThrows(OAuth2AuthenticationException.class,()->members.resolve(id));
    }
    @Test void pendingUsersCannotReadProtectedEndpoints() throws Exception{
        var principal=members.resolve(id());
        var auth=new OAuth2AuthenticationToken(principal,principal.getAuthorities(),"kakao");
        mvc.perform(get("/private/member-check").with(authentication(auth))).andExpect(status().isForbidden());
    }
    @Test void pendingSignupNeedsCsrfValidProofAndConsent() throws Exception{
        var session=new MockHttpSession();String id=id();session.setAttribute(PendingKakao.KEY,new PendingKakao(id,System.currentTimeMillis()));
        mvc.perform(post("/signup/kakao").session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/signup/kakao").session(session).with(csrf()).with(r->{r.setServerPort(8080);return r;})
            .param("displayName","test").param("documentVersion",KakaoMemberService.DOCUMENT_VERSION))
            .andExpect(view().name("account/kakao-signup"));
        assertTrue(repository.findSocial("kakao",id).isEmpty());
        session.setAttribute(PendingKakao.KEY,new PendingKakao(id,System.currentTimeMillis()-600001));
        mvc.perform(get("/signup/kakao").session(session).with(r->{r.setServerPort(8080);return r;})).andExpect(redirectedUrl("/login?socialExpired"));
    }
    @Test void submittedProviderIdAndRoleCannotOverrideVerifiedIdentity() throws Exception{
        String verified=id(),forged=id();var session=new MockHttpSession();session.setAttribute(PendingKakao.KEY,new PendingKakao(verified,System.currentTimeMillis()));
        mvc.perform(post("/signup/kakao").session(session).with(csrf()).with(r->{r.setServerPort(8080);return r;})
            .param("displayName","test").param("termsAccepted","true").param("privacyAccepted","true")
            .param("documentVersion",KakaoMemberService.DOCUMENT_VERSION).param("providerId",forged).param("role","ADMIN"))
            .andExpect(redirectedUrl("/login?socialRegistered"));
        assertTrue(repository.findSocial("kakao",forged).isEmpty());
        assertEquals(java.util.List.of("USER"),repository.roles(repository.findSocial("kakao",verified).orElseThrow().id()));
        assertNull(session.getAttribute(PendingKakao.KEY));
    }
    @Test void newOAuthIdentityIsNotKeptAuthenticatedBeforeSignup() throws Exception{
        var principal=members.resolve(id());var auth=new OAuth2AuthenticationToken(principal,principal.getAuthorities(),"kakao");
        var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
        SecurityContextHolder.getContext().setAuthentication(auth);
        try{
            handlers.onAuthenticationSuccess(request,response,auth);
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            assertNotNull(request.getSession().getAttribute(PendingKakao.KEY));
            assertEquals("/signup/kakao",response.getRedirectedUrl());
        }finally{SecurityContextHolder.clearContext();}
    }
}
