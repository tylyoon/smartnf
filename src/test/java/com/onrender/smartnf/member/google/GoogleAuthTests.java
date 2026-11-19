package com.onrender.smartnf.member.google;

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
    "spring.datasource.url=jdbc:h2:mem:smartnf-google;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa","spring.datasource.password=","spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false","spring.sql.init.mode=always","spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none","GOOGLE_LOGIN_ENABLED=true", "KAKAO_LOGIN_ENABLED=false", "NAVER_LOGIN_ENABLED=false","GOOGLE_LOGIN_CLIENT_ID=fake-key",
    "GOOGLE_LOGIN_CLIENT_SECRET=fake-secret","SMARTNF_PUBLIC_BASE_URL=http://localhost:8080"
})
class GoogleAuthTests {
    @Autowired WebApplicationContext context;
    @Autowired GoogleMemberService members;
    @Autowired MemberRepository repository;
    @Autowired MemberService localMembers;
    @Autowired JdbcTemplate jdbc;
    @Autowired GoogleLoginHandlers handlers;
    MockMvc mvc;
    @BeforeEach void setup(){mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();}
    String id(){return "Nv_"+UUID.randomUUID();}
    GoogleSignupForm form(){var f=new GoogleSignupForm();f.setDisplayName("구글 시험회원");f.setTermsAccepted(true);f.setPrivacyAccepted(true);f.setDocumentVersion(GoogleMemberService.DOCUMENT_VERSION);return f;}

    @Test void enabledButtonUsesConfiguredOriginAndDoesNotExposeSecrets() throws Exception{
        mvc.perform(get("/login").with(r->{r.setServerPort(8080);return r;}))
            .andExpect(content().string(containsString("href=\"/oauth2/authorization/google\"")))
            .andExpect(content().string(not(containsString("fake-secret"))))
            .andExpect(content().string(not(containsString("/oauth2/authorization/naver"))))
            .andExpect(content().string(not(containsString("href=\"/oauth2/authorization/kakao\""))));
        mvc.perform(get("/login").with(r->{r.setServerPort(8081);return r;}))
            .andExpect(content().string(not(containsString("href=\"/oauth2/authorization/google\""))));
    }
    @Test void authorizationUsesStateAndFixedCallback() throws Exception{
        mvc.perform(get("/oauth2/authorization/google").with(r->{r.setServerPort(8080);return r;}))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location",startsWith("https://accounts.google.com/o/oauth2/v2/auth?")))
            .andExpect(header().string("Location",containsString("state=")))
            .andExpect(header().string("Location",containsString("nonce=")))
            .andExpect(header().string("Location",containsString("scope=openid")))
            .andExpect(header().string("Location",not(containsString("fake-secret"))));
        mvc.perform(get("/login/oauth2/code/google").param("code","not-a-real-code").param("state","wrong-state"))
            .andExpect(redirectedUrl("/login?socialError"));
    }
    @Test void signupCreatesOnlySocialCredentialsAndReusesMemberOnLogin(){
        String id=id();var pending=new PendingGoogle(id,System.currentTimeMillis());
        assertNull(members.resolve(id).getMemberId());members.signup(pending,form());
        var principal=members.resolve(id);assertNotNull(principal.getMemberId());
        assertEquals(java.util.List.of("USER"),repository.roles(principal.getMemberId()));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM local_credentials WHERE member_id=?",Integer.class,principal.getMemberId()));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM member_consents WHERE member_id=?",Integer.class,principal.getMemberId()));
        assertThrows(IllegalArgumentException.class,()->members.signup(pending,form()));
        jdbc.update("UPDATE members SET status='SUSPENDED' WHERE id=?",principal.getMemberId());
        assertThrows(OAuth2AuthenticationException.class,()->members.resolve(id));
    }
    @Test void sameOpaqueValueAcrossProvidersDoesNotMergeAccounts(){
        String shared=Long.toString((UUID.randomUUID().getMostSignificantBits()&Long.MAX_VALUE)|1L);
        var kakao=context.getBean(com.onrender.smartnf.member.kakao.KakaoMemberService.class);
        var f=new com.onrender.smartnf.member.kakao.KakaoSignupForm();f.setDisplayName("kakao test");
        f.setTermsAccepted(true);f.setPrivacyAccepted(true);f.setDocumentVersion(com.onrender.smartnf.member.kakao.KakaoMemberService.DOCUMENT_VERSION);
        kakao.signup(new com.onrender.smartnf.member.kakao.PendingKakao(shared,System.currentTimeMillis()),f);
        members.signup(new PendingGoogle(shared,System.currentTimeMillis()),form());
        assertNotEquals(repository.findSocial("kakao",shared).orElseThrow().id(),repository.findSocial("google",shared).orElseThrow().id());
    }
    @Test void authenticatedViewUsesInternalMemberKeyAndDisplayName() throws Exception{
        String key=id();members.signup(new PendingGoogle(key,System.currentTimeMillis()),form());
        var principal=members.resolve(key);var auth=new OAuth2AuthenticationToken(principal,principal.getAuthorities(),"google");
        mvc.perform(get("/").with(authentication(auth))).andExpect(status().isOk())
            .andExpect(content().string(containsString("data-account-key=\"member:"+principal.getMemberId()+"\"")))
            .andExpect(content().string(containsString("구글 시험회원")));
    }
    @Test void pendingUsersCannotReadProtectedEndpoints() throws Exception{
        var principal=members.resolve(id());
        var auth=new OAuth2AuthenticationToken(principal,principal.getAuthorities(),"google");
        mvc.perform(get("/private/member-check").with(authentication(auth))).andExpect(status().isForbidden());
    }
    @Test void pendingSignupNeedsCsrfValidProofAndConsent() throws Exception{
        var session=new MockHttpSession();String id=id();session.setAttribute(PendingGoogle.KEY,new PendingGoogle(id,System.currentTimeMillis()));
        mvc.perform(post("/signup/google").session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/signup/google").session(session).with(csrf()).with(r->{r.setServerPort(8080);return r;})
            .param("displayName","test").param("documentVersion",GoogleMemberService.DOCUMENT_VERSION))
            .andExpect(view().name("account/google-signup"));
        assertTrue(repository.findSocial("google",id).isEmpty());
        session.setAttribute(PendingGoogle.KEY,new PendingGoogle(id,System.currentTimeMillis()-600001));
        mvc.perform(get("/signup/google").session(session).with(r->{r.setServerPort(8080);return r;})).andExpect(redirectedUrl("/login?googleExpired"));
    }
    @Test void submittedProviderIdAndRoleCannotOverrideVerifiedIdentity() throws Exception{
        String verified=id(),forged=id();var session=new MockHttpSession();session.setAttribute(PendingGoogle.KEY,new PendingGoogle(verified,System.currentTimeMillis()));
        mvc.perform(post("/signup/google").session(session).with(csrf()).with(r->{r.setServerPort(8080);return r;})
            .param("displayName","test").param("termsAccepted","true").param("privacyAccepted","true")
            .param("documentVersion",GoogleMemberService.DOCUMENT_VERSION).param("providerId",forged).param("role","ADMIN"))
            .andExpect(redirectedUrl("/login?googleRegistered"));
        assertTrue(repository.findSocial("google",forged).isEmpty());
        assertEquals(java.util.List.of("USER"),repository.roles(repository.findSocial("google",verified).orElseThrow().id()));
        assertNull(session.getAttribute(PendingGoogle.KEY));
    }
    @Test void newOAuthIdentityIsNotKeptAuthenticatedBeforeSignup() throws Exception{
        var principal=members.resolve(id());var auth=new OAuth2AuthenticationToken(principal,principal.getAuthorities(),"google");
        var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
        SecurityContextHolder.getContext().setAuthentication(auth);
        try{
            handlers.onAuthenticationSuccess(request,response,auth);
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            assertNotNull(request.getSession().getAttribute(PendingGoogle.KEY));
            assertEquals("/signup/google",response.getRedirectedUrl());
        }finally{SecurityContextHolder.clearContext();}
    }
}
