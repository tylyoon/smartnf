package com.onrender.smartnf.member;

import jakarta.validation.constraints.*;

public class SignupForm {
    @NotBlank(message="이메일을 입력하세요.")
    @Email(message="이메일 형식을 확인하세요.")
    @Size(max=254, message="이메일은 254자 이하여야 합니다.")
    private String email = "";
    @NotBlank(message="표시 이름을 입력하세요.")
    @Size(max=50, message="표시 이름은 50자 이하여야 합니다.")
    private String displayName = "";
    @NotBlank(message="비밀번호를 입력하세요.")
    @Size(min=12, max=64, message="비밀번호는 12~64자로 입력하세요.")
    private String password = "";
    @NotBlank(message="비밀번호 확인을 입력하세요.")
    private String passwordConfirm = "";
    @AssertTrue(message="개발용 이용 안내 동의가 필요합니다.")
    private boolean termsAccepted;
    @AssertTrue(message="개발용 개인정보 처리 안내 동의가 필요합니다.")
    private boolean privacyAccepted;
    private String documentVersion = "";
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public String getPasswordConfirm(){return passwordConfirm;} public void setPasswordConfirm(String v){passwordConfirm=v;}
    public boolean isTermsAccepted(){return termsAccepted;} public void setTermsAccepted(boolean v){termsAccepted=v;}
    public boolean isPrivacyAccepted(){return privacyAccepted;} public void setPrivacyAccepted(boolean v){privacyAccepted=v;}
    public String getDocumentVersion(){return documentVersion;} public void setDocumentVersion(String v){documentVersion=v;}
}
