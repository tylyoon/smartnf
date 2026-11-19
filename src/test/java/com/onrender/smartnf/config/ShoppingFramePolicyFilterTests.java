package com.onrender.smartnf.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter;

class ShoppingFramePolicyFilterTests {
    private MockHttpServletResponse apply(String method,String path,String context) throws Exception {
        var request=new MockHttpServletRequest(method,path);request.setContextPath(context);
        var response=new MockHttpServletResponse();
        new ShoppingFramePolicyFilter().doFilter(request,response,(req,res)->{
            // Exercise the real default Spring Security header writer, not a stub.
            new XFrameOptionsHeaderWriter().writeHeaders((jakarta.servlet.http.HttpServletRequest)req,
                (jakarta.servlet.http.HttpServletResponse)res);
        });return response;
    }
    @Test void shoppingEditorAllowsOnlySameOrigin() throws Exception {
        var response=apply("GET","/mypage/shopping","");
        assertEquals("SAMEORIGIN",response.getHeader("X-Frame-Options"));
        assertEquals(1,response.getHeaders("X-Frame-Options").size());
    }
    @Test void otherPagesRetainDefaultDeny() throws Exception {
        for(String path:new String[]{"/mypage","/login","/mypage/plans","/mypage/shopping-other","/mypage/shopping/child","/api/me/shopping-lists"})
            assertEquals("DENY",apply("GET",path,"").getHeader("X-Frame-Options"),path);
    }
    @Test void postIsNotRelaxed() throws Exception {
        assertEquals("DENY",apply("POST","/mypage/shopping","").getHeader("X-Frame-Options"));
    }
    @Test void contextPathIsHandledWithoutBroadeningRoutes() throws Exception {
        assertEquals("SAMEORIGIN",apply("GET","/smartnf/mypage/shopping","/smartnf").getHeader("X-Frame-Options"));
        assertEquals("DENY",apply("GET","/smartnf/mypage/shopping-else","/smartnf").getHeader("X-Frame-Options"));
    }
    @Test void otherHeadersAreUnchangedAndAdditionalFrameHeaderCannotReblockEditor() throws Exception {
        var request=new MockHttpServletRequest("GET","/mypage/shopping");
        var response=new MockHttpServletResponse();
        new ShoppingFramePolicyFilter().doFilter(request,response,(req,res)->{
            var http=(jakarta.servlet.http.HttpServletResponse)res;
            http.setHeader("Content-Security-Policy","default-src 'self'");
            http.setHeader("Cache-Control","no-store");
            http.addHeader("X-Frame-Options","DENY");
        });
        assertEquals("SAMEORIGIN",response.getHeader("X-Frame-Options"));
        assertEquals(1,response.getHeaders("X-Frame-Options").size());
        assertEquals("default-src 'self'",response.getHeader("Content-Security-Policy"));
        assertEquals("no-store",response.getHeader("Cache-Control"));
    }

}
