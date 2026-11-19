package com.onrender.smartnf.member.naver;

import java.util.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

/** Never retain the provider's whole response or its tokens in the principal. */
public class NaverPrincipal implements OAuth2User,java.io.Serializable {
    private final String providerId;
    private final Long memberId;
    private final long authVersion;
    private final String displayName;
    private final Collection<GrantedAuthority> authorities;
    public NaverPrincipal(String providerId,Long memberId,String displayName,List<String> roles){
        this(providerId,memberId,displayName,roles,0);
    }
    public NaverPrincipal(String providerId,Long memberId,String displayName,List<String> roles,long authVersion){
        this.authVersion=authVersion;this.providerId=providerId;this.memberId=memberId;this.displayName=displayName;
        this.authorities=roles.stream().filter(role->role.equals("USER")||role.equals("ADMIN"))
            .map(role->(GrantedAuthority)new SimpleGrantedAuthority("ROLE_"+role)).toList();
    }
    public long getAuthVersion(){return authVersion;}
    public Long getMemberId(){return memberId;}
    public String getDisplayName(){return displayName;}
    public String providerId(){return providerId;}
    @Override public String getName(){return "naver:"+providerId;}
    @Override public Map<String,Object> getAttributes(){return Map.of("id",providerId);}
    @Override public Collection<? extends GrantedAuthority> getAuthorities(){return authorities;}
}
