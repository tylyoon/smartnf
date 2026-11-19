package com.onrender.smartnf.member.google;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.junit.jupiter.api.Assertions.*;

class GoogleSettingsTests {
    MockEnvironment environment(){return new MockEnvironment().withProperty("GOOGLE_LOGIN_ENABLED","true").withProperty("GOOGLE_LOGIN_CLIENT_ID","fake-key").withProperty("GOOGLE_LOGIN_CLIENT_SECRET","fake-secret").withProperty("SMARTNF_PUBLIC_BASE_URL","http://localhost:8080");}
    @Test void disabledMissingSecretAndInvalidBaseHideProvider(){
        var env=environment().withProperty("GOOGLE_LOGIN_ENABLED","false");assertFalse(new GoogleSettings(env).ready());
        env=environment().withProperty("GOOGLE_LOGIN_CLIENT_SECRET","");assertFalse(new GoogleSettings(env).ready());
        for(String origin:java.util.List.of("http://example.test","https://example.test/path","https://user@example.test","https://example.test?x=1","https://example.test#fragment","invalid","https://203.0.113.20","http://203.0.113.20","https://192.168.1.2","https://[2001:db8::1]","https://internal","https://x.googleusercontent.com","https://app.example.com:65536")){
            assertFalse(new GoogleSettings(environment().withProperty("SMARTNF_PUBLIC_BASE_URL",origin)).ready(),origin);
        }
    }
    @Test void buttonRequiresMatchingOrigin(){
        var settings=new GoogleSettings(environment());var request=new MockHttpServletRequest();request.setServerPort(8080);
        assertTrue(settings.availableAt(request));assertEquals("http://localhost:8080/login/oauth2/code/google",settings.redirectUri());
        request.setServerName("127.0.0.1");assertFalse(settings.availableAt(request));
        request.setServerName("localhost");request.setServerPort(8081);assertFalse(settings.availableAt(request));
        assertTrue(new GoogleSettings(environment().withProperty("SMARTNF_PUBLIC_BASE_URL","https://app.example.com")).ready());
    }
    @Test void pendingProofExpiresAndRejectsMalformedId(){
        assertTrue(new PendingGoogle("123",System.currentTimeMillis()).valid());
        assertFalse(new PendingGoogle("123",System.currentTimeMillis()-600001).valid());
        assertFalse(new PendingGoogle("123",System.currentTimeMillis()+60000).valid());
        assertFalse(new PendingGoogle("invalid id",System.currentTimeMillis()).valid());
    }
}
