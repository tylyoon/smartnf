package com.onrender.smartnf.health;

import com.onrender.smartnf.member.MemberPrincipal;
import com.onrender.smartnf.member.kakao.KakaoPrincipal;
import com.onrender.smartnf.member.naver.NaverPrincipal;
import com.onrender.smartnf.member.google.GooglePrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CurrentHealthMember {
    public long id(Authentication authentication){
        if(authentication==null||!authentication.isAuthenticated())throw new HealthException(401,"로그인이 필요합니다.");
        boolean allowed=authentication.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_USER")||a.getAuthority().equals("ROLE_ADMIN"));
        if(!allowed)throw new HealthException(403,"회원 가입과 로그인을 완료해 주세요.");
        Object p=authentication.getPrincipal();Long id=null;
        if(p instanceof MemberPrincipal m)id=m.getMemberId();
        else if(p instanceof KakaoPrincipal m)id=m.getMemberId();
        else if(p instanceof NaverPrincipal m)id=m.getMemberId();
        else if(p instanceof GooglePrincipal m)id=m.getMemberId();
        if(id==null)throw new HealthException(403,"회원 가입과 로그인을 완료해 주세요.");
        // A browser's stale tab marker is only a precondition, never an authority source.
        var attributes=org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if(attributes instanceof org.springframework.web.context.request.ServletRequestAttributes web){
            String expected=web.getRequest().getHeader("X-SmartNF-Account");
            if(expected!=null&&!expected.isBlank()&&!expected.equals("member:"+id))throw HealthException.conflict();
        }
        return id;
    }
}
