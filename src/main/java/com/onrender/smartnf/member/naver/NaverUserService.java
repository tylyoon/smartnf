package com.onrender.smartnf.member.naver;

import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class NaverUserService implements OAuth2UserService<OAuth2UserRequest,OAuth2User> {
    private final NaverMemberService members;
    private final DefaultOAuth2UserService delegate=new DefaultOAuth2UserService();
    public NaverUserService(NaverMemberService members){
        this.members=members;
        delegate.setAttributesConverter(request->NaverIdentity::minimalAttributes);
    }
    @Override public OAuth2User loadUser(OAuth2UserRequest request){
        if(!"naver".equals(request.getClientRegistration().getRegistrationId()))throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        return members.resolve(delegate.loadUser(request).getAttribute("id"));
    }
}
