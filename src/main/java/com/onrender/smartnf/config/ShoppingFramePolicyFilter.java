package com.onrender.smartnf.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/** Allow the authenticated shopping editor inside MyPage, without relaxing other pages. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 40)
public class ShoppingFramePolicyFilter extends OncePerRequestFilter {
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"GET".equals(request.getMethod())
            || !(request.getContextPath() + "/mypage/shopping").equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        // Preserve SAMEORIGIN even when the security header writer runs on response commit.
        var scoped = new HttpServletResponseWrapper(response) {
            @Override public void setHeader(String name, String value) {
                super.setHeader(name, "X-Frame-Options".equalsIgnoreCase(name) ? "SAMEORIGIN" : value);
            }
            @Override public void addHeader(String name, String value) {
                if ("X-Frame-Options".equalsIgnoreCase(name)) super.setHeader(name, "SAMEORIGIN");
                else super.addHeader(name, value);
            }
        };
        scoped.setHeader("X-Frame-Options", "SAMEORIGIN");
        chain.doFilter(request, scoped);
    }
}
