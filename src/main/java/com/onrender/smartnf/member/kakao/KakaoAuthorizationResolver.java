package com.onrender.smartnf.member.kakao;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.*;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

public class KakaoAuthorizationResolver implements OAuth2AuthorizationRequestResolver {
    private final DefaultOAuth2AuthorizationRequestResolver delegate;
    private final KakaoSettings kakao;
    private final com.onrender.smartnf.member.naver.NaverSettings naver;
    private final com.onrender.smartnf.member.google.GoogleSettings google;
    public KakaoAuthorizationResolver(ClientRegistrationRepository registrations,KakaoSettings kakao,com.onrender.smartnf.member.naver.NaverSettings naver,com.onrender.smartnf.member.google.GoogleSettings google){this.delegate=new DefaultOAuth2AuthorizationRequestResolver(registrations,"/oauth2/authorization");this.kakao=kakao;this.naver=naver;this.google=google;}
    @Override public OAuth2AuthorizationRequest resolve(HttpServletRequest request){
        String path=request.getRequestURI();
        if(path.equals("/oauth2/authorization/kakao"))return resolve(request,"kakao");
        if(path.equals("/oauth2/authorization/naver"))return resolve(request,"naver");
        if(path.equals("/oauth2/authorization/google"))return resolve(request,"google");
        return null;
    }
    @Override public OAuth2AuthorizationRequest resolve(HttpServletRequest request,String registrationId){
        boolean available=("kakao".equals(registrationId)&&kakao.availableAt(request))||("naver".equals(registrationId)&&naver.availableAt(request))||("google".equals(registrationId)&&google.availableAt(request));
        return available?delegate.resolve(request,registrationId):null;
    }
}
