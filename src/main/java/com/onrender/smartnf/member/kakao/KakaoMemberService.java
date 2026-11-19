package com.onrender.smartnf.member.kakao;

import java.time.Instant;
import org.springframework.security.oauth2.core.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.onrender.smartnf.member.*;

@Service
public class KakaoMemberService {
    public static final String DOCUMENT_VERSION="dev-kakao-20261028";
    private final MemberRepository repository;
    public KakaoMemberService(MemberRepository repository){this.repository=repository;}
    public KakaoPrincipal resolve(String id){
        if(id==null||!id.matches("[1-9][0-9]{0,19}"))throw rejected();
        var member=repository.findSocial("kakao",id);
        if(member.isEmpty())return new KakaoPrincipal(id,null,"",java.util.List.of());
        var m=member.get();var roles=repository.roles(m.id());
        if(!m.status().equals("ACTIVE")||roles.stream().noneMatch(r->r.equals("USER")||r.equals("ADMIN")))throw rejected();
        return new KakaoPrincipal(id,m.id(),m.name(),roles,m.authVersion());
    }
    @Transactional public void signup(PendingKakao pending,KakaoSignupForm form){
        if(pending==null||!pending.valid())throw new IllegalArgumentException("카카오 인증이 만료되었습니다. 다시 로그인하세요.");
        if(!DOCUMENT_VERSION.equals(form.getDocumentVersion())||!form.isTermsAccepted()||!form.isPrivacyAccepted())throw new IllegalArgumentException("현재 안내 문서를 확인하고 동의해 주세요.");
        String name=form.getDisplayName()==null?"":form.getDisplayName().strip();
        if(name.isBlank()||name.length()>50)throw new IllegalArgumentException("표시 이름을 확인하세요.");
        if(repository.findSocial("kakao",pending.providerId()).isPresent())throw new IllegalArgumentException("이미 가입된 계정입니다. 카카오 로그인을 다시 진행하세요.");
        var documents=repository.signupDocuments(DOCUMENT_VERSION);
        if(documents.size()!=2)throw new IllegalStateException("가입 안내 문서를 준비 중입니다.");
        Instant now=Instant.now();long memberId=repository.insertMember(name,now);
        repository.insertSocial(memberId,"kakao",pending.providerId(),now);
        repository.grantUser(memberId,now);
        for(long document:documents)repository.recordAgreement(memberId,document,now);
    }
    private OAuth2AuthenticationException rejected(){return new OAuth2AuthenticationException(new OAuth2Error("kakao_account_unavailable"));}
}
