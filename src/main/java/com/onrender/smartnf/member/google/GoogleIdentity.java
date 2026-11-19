package com.onrender.smartnf.member.google;

/** Google subject is stable and case sensitive; never identify or merge by email. */
public final class GoogleIdentity {
    private GoogleIdentity(){}
    public static boolean valid(String id){
        return id!=null&&!id.isBlank()&&id.length()<=255
            &&id.codePoints().noneMatch(c->Character.isWhitespace(c)||Character.isISOControl(c));
    }
}
