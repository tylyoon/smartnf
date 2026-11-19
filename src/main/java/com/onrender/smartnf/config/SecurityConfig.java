package com.onrender.smartnf.config;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/** 공개 화면·읽기 전용 체험·실제 관리자 기능을 별도 경로로 구분합니다. */
@Configuration
public class SecurityConfig {
    @Bean
    org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            org.springframework.beans.factory.ObjectProvider<org.springframework.security.oauth2.client.registration.ClientRegistrationRepository> registrations,
            com.onrender.smartnf.member.oauth.SocialUserService socialUsers,
            com.onrender.smartnf.member.oauth.SocialLoginHandlers socialHandlers,
            com.onrender.smartnf.member.kakao.KakaoSettings kakaoSettings,
            com.onrender.smartnf.member.naver.NaverSettings naverSettings,
            com.onrender.smartnf.member.google.GoogleSettings googleSettings,
            com.onrender.smartnf.member.google.GoogleUserService googleUsers,
            com.onrender.smartnf.member.oauth.SocialTokenResponseClient socialTokens,
            org.springframework.jdbc.core.JdbcTemplate jdbc) throws Exception {
        http.authorizeHttpRequests(requests -> requests
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/business-payments/webhook/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/preview/**", "/", "/login", "/signup", "/signup/documents/**", "/signup/kakao", "/oauth2/authorization/kakao", "/login/oauth2/code/kakao", "/signup/naver", "/oauth2/authorization/naver", "/login/oauth2/code/naver", "/signup/google", "/oauth2/authorization/google", "/login/oauth2/code/google", "/css/**", "/js/**", "/images/**",
                        "/policies/privacy", "/policies/terms", "/contact",
                        "/demo/admin", "/api/demo/admin/summary",
                        "/api/places/config", "/api/places/search").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/demo/admin", "/api/demo/admin/summary").permitAll()
                 .requestMatchers(HttpMethod.POST, "/signup", "/signup/kakao", "/signup/kakao/cancel", "/signup/naver", "/signup/naver/cancel", "/signup/google", "/signup/google/cancel").permitAll()
                .requestMatchers("/preview", "/preview/**").denyAll()
                // 체험 경로의 쓰기는 ADMIN이거나 올바른 CSRF 토큰이 있어도 거부합니다.
                .requestMatchers("/demo", "/demo/**", "/api/demo", "/api/demo/**").denyAll()
                .requestMatchers("/admin", "/admin/**", "/api/admin", "/api/admin/**").hasRole("ADMIN")
                .anyRequest().hasAnyRole("USER", "ADMIN"))
            .formLogin(form -> form.loginPage("/login")
                .defaultSuccessUrl("/", true).failureUrl("/login?error").permitAll())
            .logout(logout -> logout.logoutSuccessUrl("/login?logout"));
        http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/business-payments/webhook/*"));
        // Explicit fallback avoids a single API entry point becoming the global default.
        http.exceptionHandling(errors->errors.authenticationEntryPoint((request,response,error)->{
            String path=request.getRequestURI(),healthApi=request.getContextPath()+"/api/me/health";
            if(path.equals(healthApi)||path.startsWith(healthApi+"/"))response.sendError(401);
            else response.sendRedirect(request.getContextPath()+"/login");
        }));
        http.addFilterAfter(new com.onrender.smartnf.member.AccountSessionFilter(jdbc),
            org.springframework.security.web.authentication.AnonymousAuthenticationFilter.class);
        // CSRF·세션 고정 공격 방어·기본 보안 헤더를 해제하지 않습니다.
        var repository=registrations.getIfAvailable();
        if(repository!=null){
            http.oauth2Login(oauth->oauth.loginPage("/login").clientRegistrationRepository(repository)
                .authorizationEndpoint(endpoint->endpoint.authorizationRequestResolver(
                    new com.onrender.smartnf.member.kakao.KakaoAuthorizationResolver(repository,kakaoSettings,naverSettings,googleSettings)))
                .authorizedClientRepository(new com.onrender.smartnf.member.kakao.TransientAuthorizedClients())
                .userInfoEndpoint(info->info.userService(socialUsers).oidcUserService(googleUsers))
                .tokenEndpoint(endpoint->endpoint.accessTokenResponseClient(socialTokens))
                .successHandler(socialHandlers).failureHandler(socialHandlers));
        }
        return http.build();
    }
}
