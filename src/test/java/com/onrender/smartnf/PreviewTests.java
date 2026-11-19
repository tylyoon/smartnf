package com.onrender.smartnf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.HttpMethod;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsString;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:smartnf-auth;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false", "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none", "GOOGLE_LOGIN_ENABLED=false", "KAKAO_LOGIN_ENABLED=false", "NAVER_LOGIN_ENABLED=false"
})
class PreviewTests {
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    @BeforeEach void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @Test void publicScreensRenderAndShowPreviewNotice() throws Exception {
        for (String path : java.util.List.of("/preview/health", "/preview/recipes",
                "/preview/business", "/preview/community", "/preview/mypage", "/preview/mypage/review",
                "/preview/account/signup", "/preview/business/documents", "/preview/about/location",
                "/preview/health/info", "/preview/health/foods", "/preview/health/diet",
                "/preview/mypage/state", "/preview/mypage/meals", "/preview/mypage/weight")) {
            var response = mvc.perform(get(path)).andExpect(status().isOk())
                .andExpect(content().string(containsString("smartnf-chat-root")));
            // Data-backed guides have their own content rather than the generic preview notice.
            if (path.equals("/preview/health/foods")) {
                response.andExpect(view().name("preview/health/foods"))
                    .andExpect(content().string(containsString("무엇을 먹는지,")))
                    .andExpect(content().string(containsString("성분부터 살펴보세요.")))
                    .andExpect(content().string(containsString("/js/food-nutrition.js")));
            } else if (path.equals("/preview/health/diet")) {
                response.andExpect(view().name("preview/health/diet"))
                    .andExpect(content().string(containsString("선택한 식품을,")))
                    .andExpect(content().string(containsString("나의 식생활로.")))
                    .andExpect(content().string(containsString("id=\"health-living\"")));
            } else {
                response.andExpect(content().string(containsString("프론트엔드 검토본")));
            }
        }
    }
    @Test void previewWritesDeniedEvenWithAdminAndCsrf() throws Exception {
        for (HttpMethod method : java.util.List.of(HttpMethod.POST, HttpMethod.PUT,
                HttpMethod.PATCH, HttpMethod.DELETE)) {
            mvc.perform(request(method, "/preview/account/signup")
                    .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isForbidden());
        }
    }
    @Test void unknownScreenIs404() throws Exception {
        mvc.perform(get("/preview/health/unknown")).andExpect(status().isNotFound());
    }
    @Test void realAdminRemainsProtected() throws Exception {
        mvc.perform(get("/admin").with(user("member").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test void healthcareExplainsServicesAndRecordsLiveInMyPage() throws Exception {
        mvc.perform(get("/preview/health"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("식재료·식품 영양정보")))
            .andExpect(content().string(containsString("건강별 식품 선택 가이드")))
            .andExpect(content().string(containsString("/preview/mypage/feedback")));
        mvc.perform(get("/preview/health/profile"))
            .andExpect(redirectedUrl("/preview/mypage/state"));
        mvc.perform(get("/preview/health/meals"))
            .andExpect(redirectedUrl("/preview/mypage/meals"));
        mvc.perform(get("/preview/health/weight"))
            .andExpect(redirectedUrl("/preview/mypage/weight"));
    }

    @Test void feedbackAttributionAndMissingDataAreExplicit() throws Exception {
        mvc.perform(get("/preview/mypage/feedback"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("헬스케어가 제공하는 피드백")))
            .andExpect(content().string(containsString("가상 결과")))
            .andExpect(content().string(containsString("비교 기준")))
            .andExpect(content().string(containsString("정보 부족")));
    }
}
