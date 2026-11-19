package com.onrender.smartnf.member;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Every subsequent request checks the DB generation, across all application instances. */
public class AccountSessionFilter extends OncePerRequestFilter {
 private final JdbcTemplate jdbc;
 public AccountSessionFilter(JdbcTemplate jdbc){this.jdbc=jdbc;}
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  var auth=SecurityContextHolder.getContext().getAuthentication();
  Long id=auth==null?null:AccountIdentity.id(auth.getPrincipal());
  if(id!=null&&auth.isAuthenticated()){
   try{
    var rows=jdbc.query("SELECT status,auth_version FROM members WHERE id=?",(rs,n)->rs.getString(1).equals("ACTIVE")&&rs.getLong(2)==AccountIdentity.version(auth.getPrincipal()),id);
    if(rows.size()!=1||!rows.get(0)){
     SecurityContextHolder.clearContext();var session=request.getSession(false);if(session!=null)session.invalidate();
     response.setHeader("Cache-Control","no-store, private");
     if(request.getRequestURI().startsWith(request.getContextPath()+"/api/"))response.sendError(401);
     else response.sendRedirect(request.getContextPath()+"/login");return;
    }
   }catch(org.springframework.dao.DataAccessException error){response.setHeader("Cache-Control","no-store, private");response.sendError(503);return;}
  }
  chain.doFilter(request,response);
 }
}
