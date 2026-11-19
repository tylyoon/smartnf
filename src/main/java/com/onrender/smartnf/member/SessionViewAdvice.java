package com.onrender.smartnf.member;

import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
public class SessionViewAdvice {
    @ModelAttribute("smartnfAccountKey") public String accountKey(Authentication authentication){
        if(authentication==null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated())return "anonymous";
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.kakao.KakaoPrincipal social && social.getMemberId()!=null)return "member:"+social.getMemberId();
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.naver.NaverPrincipal social && social.getMemberId()!=null)return "member:"+social.getMemberId();
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.google.GooglePrincipal social && social.getMemberId()!=null)return "member:"+social.getMemberId();
        return authentication.getPrincipal() instanceof MemberPrincipal member?"member:"+member.getMemberId():"authenticated:"+authentication.getName();
    }
    @ModelAttribute("smartnfDisplayName") public String displayName(Authentication authentication){
        if(authentication==null)return "";
        if(authentication.getPrincipal() instanceof MemberPrincipal member)return member.getDisplayName();
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.kakao.KakaoPrincipal social)return social.getDisplayName();
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.naver.NaverPrincipal social)return social.getDisplayName();
        if(authentication.getPrincipal() instanceof com.onrender.smartnf.member.google.GooglePrincipal social)return social.getDisplayName();
        return authentication.getName();
    }
}
