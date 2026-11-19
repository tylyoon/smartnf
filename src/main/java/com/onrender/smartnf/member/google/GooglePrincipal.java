package com.onrender.smartnf.member.google;

import java.util.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/** Retains the validated ID token only in the authenticated server session, never in DB. */
public class GooglePrincipal implements OidcUser,java.io.Serializable {
    private final String providerId;
    private final Long memberId;
    private final long authVersion;
    private final String displayName;
    private final Collection<GrantedAuthority> authorities;
    private final OidcIdToken idToken;
    public GooglePrincipal(String providerId,Long memberId,String displayName,List<String> roles){
        this(providerId,memberId,displayName,roles,null,0);
    }
    public GooglePrincipal(String providerId,Long memberId,String displayName,List<String> roles,long version){
        this(providerId,memberId,displayName,roles,null,version);
    }
    private GooglePrincipal(String providerId,Long memberId,String displayName,List<String> roles,OidcIdToken idToken,long authVersion){
        this.authVersion=authVersion;this.providerId=providerId;this.memberId=memberId;this.displayName=displayName;this.idToken=idToken;
        this.authorities=roles.stream().filter(role->role.equals("USER")||role.equals("ADMIN"))
            .map(role->(GrantedAuthority)new SimpleGrantedAuthority("ROLE_"+role)).toList();
    }
    GooglePrincipal withIdToken(OidcIdToken token){return new GooglePrincipal(providerId,memberId,displayName,authorities.stream()
        .map(a->a.getAuthority().substring(5)).toList(),token,authVersion);}
    public long getAuthVersion(){return authVersion;}
    public Long getMemberId(){return memberId;}
    public String getDisplayName(){return displayName;}
    public String providerId(){return providerId;}
    @Override public String getName(){return "google:"+providerId;}
    @Override public Map<String,Object> getAttributes(){return Map.of("sub",providerId);}
    @Override public Map<String,Object> getClaims(){return idToken==null?getAttributes():idToken.getClaims();}
    @Override public OidcIdToken getIdToken(){return idToken;}
    @Override public OidcUserInfo getUserInfo(){return null;}
    @Override public Collection<? extends GrantedAuthority> getAuthorities(){return authorities;}
}
