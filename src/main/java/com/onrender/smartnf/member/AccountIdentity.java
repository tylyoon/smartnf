package com.onrender.smartnf.member;
import com.onrender.smartnf.member.kakao.KakaoPrincipal;
import com.onrender.smartnf.member.naver.NaverPrincipal;
import com.onrender.smartnf.member.google.GooglePrincipal;
public final class AccountIdentity {
 private AccountIdentity(){}
 public static Long id(Object p){
  if(p instanceof MemberPrincipal m)return m.getMemberId();
  if(p instanceof KakaoPrincipal m)return m.getMemberId();
  if(p instanceof NaverPrincipal m)return m.getMemberId();
  if(p instanceof GooglePrincipal m)return m.getMemberId();return null;
 }
 public static long version(Object p){
  if(p instanceof MemberPrincipal m)return m.getAuthVersion();
  if(p instanceof KakaoPrincipal m)return m.getAuthVersion();
  if(p instanceof NaverPrincipal m)return m.getAuthVersion();
  if(p instanceof GooglePrincipal m)return m.getAuthVersion();return -1;
 }
}
