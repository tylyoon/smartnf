package com.onrender.smartnf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:smartnf-auth;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false", "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none", "GOOGLE_LOGIN_ENABLED=false", "KAKAO_LOGIN_ENABLED=false", "NAVER_LOGIN_ENABLED=false"
})
@Import(WebSecurityTests.ProbeController.class)
class WebSecurityTests {
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    @Autowired com.onrender.smartnf.member.MemberService members;
    @Autowired com.onrender.smartnf.member.MemberRepository repository;

    @BeforeEach
    void configureMvc() {
        if(repository.findLogin("test-user@example.test").isEmpty()) {
            var form=new com.onrender.smartnf.member.SignupForm();
            form.setEmail("test-user@example.test");form.setDisplayName("Test user");
            form.setPassword("test-password");form.setPasswordConfirm("test-password");
            form.setTermsAccepted(true);form.setPrivacyAccepted(true);
            form.setDocumentVersion(com.onrender.smartnf.member.MemberService.DOCUMENT_VERSION);
            members.signup(form);
        }
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void anonymousCanReadHomeAndBrandAsset() throws Exception {
        mvc.perform(get("/"))
                .andExpect(status().isOk()).andExpect(view().name("home"))
                .andExpect(content().string(containsString("헬스케어")))
                .andExpect(content().string(containsString("AI 레시피·식단")))
                .andExpect(content().string(containsString("스마트 푸드 비즈니스")));
        mvc.perform(get("/images/smartnf-logo.png")).andExpect(status().isOk());
        mvc.perform(get("/css/site.css")).andExpect(status().isOk());
    }

    @Test
    void loginFormIncludesCsrfAndSafeErrorMessage() throws Exception {
        mvc.perform(get("/login?error"))
                .andExpect(status().isOk()).andExpect(view().name("login"))
                .andExpect(content().string(containsString("name=\"_csrf\"")))
                .andExpect(content().string(containsString("이메일 또는 비밀번호를 확인")));
    }

    @Test
    void anonymousCannotReadProtectedRoute() throws Exception {
        mvc.perform(get("/api/member/probe"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login"));
        mvc.perform(get("/mypage"))
                .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login"));
        mvc.perform(get("/api/me/health/profile"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/healthcare/probe"))
                .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login"));
    }

    @Test
    void validLoginAuthenticatesAndReturnsToHome() throws Exception {
        mvc.perform(formLogin().user("test-user@example.test").password("test-password"))
                .andExpect(authenticated().withUsername("test-user@example.test"))
                .andExpect(redirectedUrl("/"));
    }

    @Test
    void invalidLoginDoesNotAuthenticate() throws Exception {
        mvc.perform(formLogin().user("test-user@example.test").password("wrong"))
                .andExpect(unauthenticated())
                .andExpect(redirectedUrl("/login?error"));
    }

    @Test
    void memberCannotReadAdminRoute() throws Exception {
        mvc.perform(get("/api/admin/probe").with(user("member").roles("USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin").with(user("member").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReadAdminRoute() throws Exception {
        mvc.perform(get("/api/admin/probe").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(content().string("admin"));
    }

    @Test
    void writeRequiresCsrfEvenWhenAuthenticated() throws Exception {
        mvc.perform(post("/api/member/probe").with(user("member")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/member/probe").with(user("member")).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void logoutRequiresCsrf() throws Exception {
        mvc.perform(post("/logout").with(user("member")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/logout").with(user("member")).with(csrf()))
                .andExpect(unauthenticated())
                .andExpect(redirectedUrl("/login?logout"));
    }

    @Test
    void authenticatedHomeEscapesUsernameAndIncludesLogoutCsrf() throws Exception {
        mvc.perform(get("/").with(user("<script>alert(1)</script>")))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("&lt;script&gt;")))
                .andExpect(content().string(containsString("name=\"_csrf\"")));
    }

    @Test
    void publicDemoUsesOnlyReadOnlySampleData() throws Exception {
        mvc.perform(get("/demo/admin")).andExpect(status().isOk())
                .andExpect(content().string(containsString("가상")));
        mvc.perform(get("/api/demo/admin/summary")).andExpect(status().isOk())
                .andExpect(jsonPath("$.demo").value(true))
                .andExpect(jsonPath("$.readOnly").value(true))
                .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void demoWritesAreDeniedEvenForAdminWithValidCsrf() throws Exception {
        for (var method : java.util.List.of(
                org.springframework.http.HttpMethod.POST, org.springframework.http.HttpMethod.PUT,
                org.springframework.http.HttpMethod.PATCH, org.springframework.http.HttpMethod.DELETE)) {
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .request(method, "/api/demo/admin/summary")
                    .with(user("admin").roles("ADMIN")).with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void publicInformationPagesAreAvailable() throws Exception {
        for (String path : java.util.List.of("/policies/privacy", "/policies/terms", "/contact")) {
            mvc.perform(get(path)).andExpect(status().isOk());
        }
    }

    // 이 엔드포인트는 권한 규칙 검증용이며 src/main에 배포되지 않습니다.
    @RestController
    static class ProbeController {
        @GetMapping("/api/member/probe") String member() { return "member"; }
        @PostMapping("/api/member/probe") String write() { return "written"; }
        @GetMapping("/api/admin/probe") String admin() { return "admin"; }
    }
}
