package com.onrender.smartnf.member;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberService {
    public static final String DOCUMENT_VERSION="dev-20261028";
    private final MemberRepository repository;
    private final PasswordEncoder encoder;
    public MemberService(MemberRepository repository,PasswordEncoder encoder){this.repository=repository;this.encoder=encoder;}
    public static String normalizeEmail(String value){return value==null?"":value.strip().toLowerCase(Locale.ROOT);}
    @Transactional
    public void signup(SignupForm form){
        if(!form.getPassword().equals(form.getPasswordConfirm()))throw new IllegalArgumentException("비밀번호 확인이 일치하지 않습니다.");
        if(form.getPassword().length()<12 || form.getPassword().length()>64 || form.getPassword().getBytes(StandardCharsets.UTF_8).length>72)
            throw new IllegalArgumentException("비밀번호는 12~64자, UTF-8 기준 72바이트 이내로 입력하세요.");
        if(!form.isTermsAccepted()||!form.isPrivacyAccepted())throw new IllegalArgumentException("필수 안내 내용을 확인하고 동의해 주세요.");
        if(!DOCUMENT_VERSION.equals(form.getDocumentVersion()))throw new IllegalArgumentException("안내 문서가 변경되었습니다. 가입 화면을 새로 열어 확인하세요.");
        var documents=repository.signupDocuments(DOCUMENT_VERSION);
        if(documents.size()!=2)throw new IllegalStateException("가입 안내 문서를 준비 중입니다.");
        String name=form.getDisplayName().strip();
        if(name.isBlank()||name.length()>50)throw new IllegalArgumentException("표시 이름을 확인하세요.");
        var now=Instant.now();
        long id=repository.insertMember(name,now);
        repository.insertCredential(id,normalizeEmail(form.getEmail()),encoder.encode(form.getPassword()),now);
        repository.grantUser(id,now);
        for(long document:documents)repository.recordAgreement(id,document,now);
    }
}
