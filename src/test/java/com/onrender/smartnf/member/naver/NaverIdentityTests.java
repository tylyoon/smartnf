package com.onrender.smartnf.member.naver;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import static org.junit.jupiter.api.Assertions.*;

class NaverIdentityTests {
    @Test void onlyNestedOpaqueIdSurvivesProfileConversion(){
        var result=NaverIdentity.minimalAttributes(Map.of("resultcode","00","response",Map.of("id","AbC_-opaque-123","email","ignored@example.test","name","ignored")));
        assertEquals(Map.of("id","AbC_-opaque-123"),result);
        assertTrue(NaverIdentity.valid("AbC_-opaque-123"));assertFalse(NaverIdentity.valid("id with space"));
        assertFalse(NaverIdentity.valid("x".repeat(256)));assertFalse(NaverIdentity.valid("\n"));
    }
    @Test void providerErrorAndMalformedIdFailClosed(){
        assertThrows(OAuth2AuthenticationException.class,()->NaverIdentity.minimalAttributes(Map.of("resultcode","024","response",Map.of("id","abc"))));
        assertThrows(OAuth2AuthenticationException.class,()->NaverIdentity.minimalAttributes(Map.of("resultcode","00")));
        assertThrows(OAuth2AuthenticationException.class,()->NaverIdentity.minimalAttributes(Map.of("resultcode","00","response",Map.of("id",123))));
        assertThrows(OAuth2AuthenticationException.class,()->NaverIdentity.minimalAttributes(Map.of("resultcode","00","response",Map.of("id",""))));
    }
}
