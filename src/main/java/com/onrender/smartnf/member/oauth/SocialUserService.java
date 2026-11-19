package com.onrender.smartnf.member.oauth;

import com.onrender.smartnf.member.kakao.KakaoUserService;
import com.onrender.smartnf.member.naver.NaverUserService;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class SocialUserService implements OAuth2UserService<OAuth2UserRequest,OAuth2User> {
    private final KakaoUserService kakao;private final NaverUserService naver;
    public SocialUserService(KakaoUserService kakao,NaverUserService naver){this.kakao=kakao;this.naver=naver;}
    @Override public OAuth2User loadUser(OAuth2UserRequest request){
        return switch(request.getClientRegistration().getRegistrationId()){
            case "kakao" -> kakao.loadUser(request);
            case "naver" -> naver.loadUser(request);
            default -> throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        };
    }
}
