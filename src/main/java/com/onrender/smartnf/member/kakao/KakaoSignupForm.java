package com.onrender.smartnf.member.kakao;

import jakarta.validation.constraints.*;

public class KakaoSignupForm {
    @NotBlank(message="표시 이름을 입력하세요.") @Size(max=50,message="표시 이름은 50자 이하여야 합니다.")
    private String displayName="";
    @AssertTrue(message="개발용 이용 안내 동의가 필요합니다.") private boolean termsAccepted;
    @AssertTrue(message="개발용 개인정보 처리 안내 동의가 필요합니다.") private boolean privacyAccepted;
    private String documentVersion="";
    public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
    public boolean isTermsAccepted(){return termsAccepted;} public void setTermsAccepted(boolean v){termsAccepted=v;}
    public boolean isPrivacyAccepted(){return privacyAccepted;} public void setPrivacyAccepted(boolean v){privacyAccepted=v;}
    public String getDocumentVersion(){return documentVersion;} public void setDocumentVersion(String v){documentVersion=v;}
}
