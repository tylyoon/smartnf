package com.onrender.smartnf.member.oauth;

import com.onrender.smartnf.member.kakao.*;
import com.onrender.smartnf.member.naver.*;
import com.onrender.smartnf.member.google.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.core.*;
import org.springframework.security.web.authentication.*;
import org.springframework.stereotype.Component;

@Component
public class SocialLoginHandlers implements AuthenticationSuccessHandler,AuthenticationFailureHandler {
    private final KakaoLoginHandlers kakao;private final NaverLoginHandlers naver;private final GoogleLoginHandlers google;
    public SocialLoginHandlers(KakaoLoginHandlers kakao,NaverLoginHandlers naver,GoogleLoginHandlers google){this.kakao=kakao;this.naver=naver;this.google=google;}
    private void clearPending(HttpServletRequest request){var session=request.getSession(false);if(session!=null){session.removeAttribute(PendingKakao.KEY);session.removeAttribute(PendingNaver.KEY);session.removeAttribute(PendingGoogle.KEY);}}
    @Override public void onAuthenticationSuccess(HttpServletRequest request,HttpServletResponse response,Authentication authentication)throws IOException,ServletException{
        clearPending(request);
        if(authentication.getPrincipal() instanceof KakaoPrincipal){kakao.onAuthenticationSuccess(request,response,authentication);return;}
        if(authentication.getPrincipal() instanceof NaverPrincipal){naver.onAuthenticationSuccess(request,response,authentication);return;}
        if(authentication.getPrincipal() instanceof GooglePrincipal){google.onAuthenticationSuccess(request,response,authentication);return;}
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        new org.springframework.security.web.context.HttpSessionSecurityContextRepository().saveContext(org.springframework.security.core.context.SecurityContextHolder.createEmptyContext(),request,response);
        response.sendRedirect("/login?socialError");
    }
    @Override public void onAuthenticationFailure(HttpServletRequest request,HttpServletResponse response,AuthenticationException error)throws IOException{
        clearPending(request);response.sendRedirect("/login?socialError");
    }
}
