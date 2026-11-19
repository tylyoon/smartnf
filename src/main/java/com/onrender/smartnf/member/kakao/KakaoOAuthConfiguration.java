package com.onrender.smartnf.member.kakao;

import org.springframework.context.annotation.*;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.*;

/** Single repository for configured providers; retained class name avoids duplicate configuration on ZIP merge. */
@Configuration
public class KakaoOAuthConfiguration {
    public static class Ready implements Condition {
        @Override public boolean matches(ConditionContext context,AnnotatedTypeMetadata metadata){return new KakaoSettings(context.getEnvironment()).ready()||new com.onrender.smartnf.member.naver.NaverSettings(context.getEnvironment()).ready()||new com.onrender.smartnf.member.google.GoogleSettings(context.getEnvironment()).ready();}
    }
    @Bean @Conditional(Ready.class)
    ClientRegistrationRepository kakaoRegistrations(KakaoSettings settings,com.onrender.smartnf.member.naver.NaverSettings naver,com.onrender.smartnf.member.google.GoogleSettings google){
        var registrations=new java.util.ArrayList<ClientRegistration>();
        if(settings.ready()){
        var registration=ClientRegistration.withRegistrationId("kakao")
            .clientId(settings.clientId()).clientSecret(settings.clientSecret())
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri(settings.redirectUri())
            .authorizationUri("https://kauth.kakao.com/oauth/authorize")
            .tokenUri("https://kauth.kakao.com/oauth/token")
            .userInfoUri("https://kapi.kakao.com/v2/user/me")
            .userNameAttributeName("id").clientName("카카오").build();
            registrations.add(registration);
        }
        if(naver.ready())registrations.add(ClientRegistration.withRegistrationId("naver")
            .clientId(naver.clientId()).clientSecret(naver.clientSecret())
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri(naver.redirectUri())
            .authorizationUri("https://nid.naver.com/oauth2.0/authorize")
            .tokenUri("https://nid.naver.com/oauth2.0/token")
            .userInfoUri("https://openapi.naver.com/v1/nid/me")
            .userNameAttributeName("id").clientName("네이버").build());
        if(google.ready())registrations.add(org.springframework.security.config.oauth2.client.CommonOAuth2Provider.GOOGLE
            .getBuilder("google").clientId(google.clientId()).clientSecret(google.clientSecret())
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
            .scope("openid").redirectUri(google.redirectUri()).build());
        return new InMemoryClientRegistrationRepository(registrations);
    }
}
