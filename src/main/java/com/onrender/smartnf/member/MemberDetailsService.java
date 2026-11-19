package com.onrender.smartnf.member;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class MemberDetailsService implements UserDetailsService {
    private final MemberRepository repository;
    public MemberDetailsService(MemberRepository repository){this.repository=repository;}
    @Override public UserDetails loadUserByUsername(String input){
        var member=repository.findLogin(MemberService.normalizeEmail(input)).orElseThrow(()->new UsernameNotFoundException("로그인 정보를 확인하세요."));
        var authorities=repository.roles(member.id()).stream().filter(role->role.equals("USER")||role.equals("ADMIN"))
            .map(role->new SimpleGrantedAuthority("ROLE_"+role)).toList();
        if(authorities.isEmpty())throw new UsernameNotFoundException("로그인 정보를 확인하세요.");
        return new MemberPrincipal(member,authorities);
    }
}
