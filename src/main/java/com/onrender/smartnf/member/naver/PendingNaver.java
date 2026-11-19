package com.onrender.smartnf.member.naver;

public record PendingNaver(String providerId,long verifiedAt) implements java.io.Serializable {
    public static final String KEY="smartnf.pending-naver-signup.v1";
    public boolean valid(){long age=System.currentTimeMillis()-verifiedAt;return NaverIdentity.valid(providerId)&&age>=0&&age<600000;}
}
