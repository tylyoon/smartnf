package com.onrender.smartnf.member.kakao;

import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class KakaoUserService implements OAuth2UserService<OAuth2UserRequest,OAuth2User> {
    private final KakaoMemberService members;
    private final DefaultOAuth2UserService delegate=new DefaultOAuth2UserService();
    public KakaoUserService(KakaoMemberService members){this.members=members;}
    @Override public OAuth2User loadUser(OAuth2UserRequest request){
        if(!request.getClientRegistration().getRegistrationId().equals("kakao"))throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        Object raw=delegate.loadUser(request).getAttribute("id");
        // Kakao's numeric member ID is used directly. Email/profile fields are ignored.
        return members.resolve(raw==null?null:String.valueOf(raw));
    }
}
