package com.onrender.smartnf.member.kakao;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.authentication.*;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

@Component
public class KakaoLoginHandlers implements AuthenticationSuccessHandler,AuthenticationFailureHandler {
    @Override public void onAuthenticationSuccess(HttpServletRequest request,HttpServletResponse response,Authentication authentication)throws IOException,ServletException{
        var principal=(KakaoPrincipal)authentication.getPrincipal();
        var session=request.getSession();session.removeAttribute(PendingKakao.KEY);
        if(principal.getMemberId()==null){
            SecurityContextHolder.clearContext();
            new HttpSessionSecurityContextRepository().saveContext(SecurityContextHolder.createEmptyContext(),request,response);
            session.setAttribute(PendingKakao.KEY,new PendingKakao(principal.providerId(),System.currentTimeMillis()));
            response.sendRedirect("/signup/kakao");return;
        }
        response.sendRedirect("/");
    }
    @Override public void onAuthenticationFailure(HttpServletRequest request,HttpServletResponse response,AuthenticationException error)throws IOException{
        var session=request.getSession(false);if(session!=null)session.removeAttribute(PendingKakao.KEY);
        response.sendRedirect("/login?socialError");
    }
}
