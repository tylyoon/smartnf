package com.onrender.smartnf.member.google;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.authentication.*;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

@Component
public class GoogleLoginHandlers implements AuthenticationSuccessHandler,AuthenticationFailureHandler {
    @Override public void onAuthenticationSuccess(HttpServletRequest request,HttpServletResponse response,Authentication authentication)throws IOException,ServletException{
        var principal=(GooglePrincipal)authentication.getPrincipal();
        var session=request.getSession();session.removeAttribute(PendingGoogle.KEY);
        if(principal.getMemberId()==null){
            SecurityContextHolder.clearContext();
            new HttpSessionSecurityContextRepository().saveContext(SecurityContextHolder.createEmptyContext(),request,response);
            session.setAttribute(PendingGoogle.KEY,new PendingGoogle(principal.providerId(),System.currentTimeMillis()));
            response.sendRedirect("/signup/google");return;
        }
        response.sendRedirect("/");
    }
    @Override public void onAuthenticationFailure(HttpServletRequest request,HttpServletResponse response,AuthenticationException error)throws IOException{
        var session=request.getSession(false);if(session!=null)session.removeAttribute(PendingGoogle.KEY);
        response.sendRedirect("/login?socialError");
    }
}
