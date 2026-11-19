package com.onrender.smartnf.member.kakao;

import com.onrender.smartnf.member.naver.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.junit.jupiter.api.Assertions.*;

class SocialProviderRegistrationTests {
    MockEnvironment environment(){return new MockEnvironment().withProperty("KAKAO_LOGIN_ENABLED","true").withProperty("KAKAO_REST_API_KEY","fake-kakao")
        .withProperty("KAKAO_CLIENT_SECRET","fake-kakao-secret").withProperty("NAVER_LOGIN_ENABLED","true").withProperty("NAVER_LOGIN_CLIENT_ID","fake-naver")
        .withProperty("NAVER_LOGIN_CLIENT_SECRET","fake-naver-secret").withProperty("SMARTNF_PUBLIC_BASE_URL","http://localhost:8080");}
    @Test void repositoryIncludesBothReadyProvidersOnly(){
        var env=environment();var factory=new KakaoOAuthConfiguration();
        var registrations=factory.kakaoRegistrations(new KakaoSettings(env),new NaverSettings(env),new com.onrender.smartnf.member.google.GoogleSettings(env));
        assertNotNull(registrations.findByRegistrationId("kakao"));assertNotNull(registrations.findByRegistrationId("naver"));assertNull(registrations.findByRegistrationId("google"));
        env.withProperty("KAKAO_LOGIN_ENABLED","false");registrations=factory.kakaoRegistrations(new KakaoSettings(env),new NaverSettings(env),new com.onrender.smartnf.member.google.GoogleSettings(env));
        assertNull(registrations.findByRegistrationId("kakao"));assertNotNull(registrations.findByRegistrationId("naver"));
        env.withProperty("KAKAO_LOGIN_ENABLED","true").withProperty("NAVER_LOGIN_ENABLED","false");registrations=factory.kakaoRegistrations(new KakaoSettings(env),new NaverSettings(env),new com.onrender.smartnf.member.google.GoogleSettings(env));
        assertNotNull(registrations.findByRegistrationId("kakao"));assertNull(registrations.findByRegistrationId("naver"));
    }
    @Test void googleOnlyUsesOidcAndIsOmittedOnPublicIp(){
        var env=environment().withProperty("GOOGLE_LOGIN_ENABLED","true")
            .withProperty("GOOGLE_LOGIN_CLIENT_ID","google-client").withProperty("GOOGLE_LOGIN_CLIENT_SECRET","secret");
        var factory=new KakaoOAuthConfiguration();
        var registrations=factory.kakaoRegistrations(new KakaoSettings(env),new NaverSettings(env),new com.onrender.smartnf.member.google.GoogleSettings(env));
        var google=registrations.findByRegistrationId("google");assertNotNull(google);
        assertEquals(java.util.Set.of("openid"),google.getScopes());
        assertEquals("https://accounts.google.com",google.getProviderDetails().getIssuerUri());
        assertNotNull(google.getProviderDetails().getJwkSetUri());
        env.withProperty("SMARTNF_PUBLIC_BASE_URL","https://203.0.113.20");
        registrations=factory.kakaoRegistrations(new KakaoSettings(env),new NaverSettings(env),new com.onrender.smartnf.member.google.GoogleSettings(env));
        assertNull(registrations.findByRegistrationId("google"));
        assertNotNull(registrations.findByRegistrationId("kakao"));assertNotNull(registrations.findByRegistrationId("naver"));
    }
}
