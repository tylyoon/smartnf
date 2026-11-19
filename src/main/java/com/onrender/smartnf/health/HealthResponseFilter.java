package com.onrender.smartnf.health;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Applies even when Spring Security rejects an unauthenticated/CSRF request. */
@Component
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE+20)
public class HealthResponseFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
        String p=request.getRequestURI();
        if(p.equals("/mypage")||p.startsWith("/mypage/")||p.equals("/health/info")||p.equals("/preview/health/info")||p.startsWith("/api/me/health")){
            response.setHeader("Cache-Control","no-store, private");response.setHeader("Pragma","no-cache");
        }
        chain.doFilter(request,response);
    }
}
