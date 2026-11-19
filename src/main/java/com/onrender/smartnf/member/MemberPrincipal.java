package com.onrender.smartnf.member;

import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class MemberPrincipal extends User {
    private final long memberId;
    private final long authVersion;
    private final String displayName;
    public MemberPrincipal(MemberRepository.LoginMember member,Collection<? extends GrantedAuthority> authorities){
        super(member.email(),member.hash(),"ACTIVE".equals(member.status()),true,true,true,authorities);
        this.memberId=member.id();
        this.authVersion=member.authVersion();
        this.displayName=member.name();
    }
    public long getAuthVersion(){return authVersion;}
    public long getMemberId(){return memberId;}
    public String getDisplayName(){return displayName;}
}
