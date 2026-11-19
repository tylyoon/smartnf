package com.onrender.smartnf.member.naver;

import java.util.Map;
import org.springframework.security.oauth2.core.*;

/** Naver response.id is an opaque case-sensitive string, not a numeric Kakao ID. */
public final class NaverIdentity {
    private NaverIdentity(){}
    public static boolean valid(String id){return id!=null&&!id.isBlank()&&id.length()<=255&&id.codePoints().noneMatch(c->Character.isWhitespace(c)||Character.isISOControl(c));}
    public static Map<String,Object> minimalAttributes(Map<String,Object> attributes){
        if(!"00".equals(attributes.get("resultcode"))||!(attributes.get("response") instanceof Map<?,?> response)
            ||!(response.get("id") instanceof String id)||!valid(id)){
            throw new OAuth2AuthenticationException(new OAuth2Error("naver_profile_unavailable"));
        }
        return Map.of("id",id);
    }
}
