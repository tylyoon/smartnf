package com.onrender.smartnf.member.kakao;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.junit.jupiter.api.Assertions.*;

class KakaoSettingsTests {
    MockEnvironment environment(){return new MockEnvironment().withProperty("KAKAO_LOGIN_ENABLED","true").withProperty("KAKAO_REST_API_KEY","fake-key").withProperty("KAKAO_CLIENT_SECRET","fake-secret").withProperty("SMARTNF_PUBLIC_BASE_URL","http://localhost:8080");}
    @Test void disabledMissingSecretAndInvalidBaseHideProvider(){
        var env=environment().withProperty("KAKAO_LOGIN_ENABLED","false");assertFalse(new KakaoSettings(env).ready());
        env=environment().withProperty("KAKAO_CLIENT_SECRET","");assertFalse(new KakaoSettings(env).ready());
        for(String origin:java.util.List.of("http://example.test","https://example.test/path","https://user@example.test","https://example.test?x=1","https://example.test#fragment","invalid")){
            assertFalse(new KakaoSettings(environment().withProperty("SMARTNF_PUBLIC_BASE_URL",origin)).ready(),origin);
        }
    }
    @Test void buttonRequiresMatchingOrigin(){
        var settings=new KakaoSettings(environment());var request=new MockHttpServletRequest();request.setServerPort(8080);
        assertTrue(settings.availableAt(request));assertEquals("http://localhost:8080/login/oauth2/code/kakao",settings.redirectUri());
        request.setServerName("127.0.0.1");assertFalse(settings.availableAt(request));
        request.setServerName("localhost");request.setServerPort(8081);assertFalse(settings.availableAt(request));
        assertTrue(new KakaoSettings(environment().withProperty("SMARTNF_PUBLIC_BASE_URL","https://app.example.test")).ready());
    }
    @Test void pendingProofExpiresAndRejectsMalformedId(){
        assertTrue(new PendingKakao("123",System.currentTimeMillis()).valid());
        assertFalse(new PendingKakao("123",System.currentTimeMillis()-600001).valid());
        assertFalse(new PendingKakao("123",System.currentTimeMillis()+60000).valid());
        assertFalse(new PendingKakao("-1",System.currentTimeMillis()).valid());
    }
}
