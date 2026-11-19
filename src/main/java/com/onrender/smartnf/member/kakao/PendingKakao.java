package com.onrender.smartnf.member.kakao;

public record PendingKakao(String providerId,long verifiedAt) implements java.io.Serializable {
    public static final String KEY="smartnf.pending-kakao-signup.v1";
    public boolean valid(){long age=System.currentTimeMillis()-verifiedAt;return providerId!=null&&providerId.matches("[1-9][0-9]{0,19}")&&age>=0&&age<600000;}
}
