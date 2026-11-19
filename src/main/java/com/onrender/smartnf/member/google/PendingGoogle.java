package com.onrender.smartnf.member.google;

public record PendingGoogle(String providerId,long verifiedAt) implements java.io.Serializable {
    public static final String KEY="smartnf.pending-google-signup.v1";
    public boolean valid(){long age=System.currentTimeMillis()-verifiedAt;return GoogleIdentity.valid(providerId)&&age>=0&&age<600000;}
}
