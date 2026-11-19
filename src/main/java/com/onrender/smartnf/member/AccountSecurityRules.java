package com.onrender.smartnf.member;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
final class AccountSecurityRules {
 private AccountSecurityRules(){}
 private static final SecureRandom RANDOM=new SecureRandom();
 static boolean validPassword(String s){return s!=null&&s.length()>=12&&s.length()<=64&&s.getBytes(StandardCharsets.UTF_8).length<=72;}
 static boolean validEmail(String email){return email!=null&&email.length()<=254&&email.matches("[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\\.[a-z]{2,63}")&&!email.contains("..");}
 static String token(){byte[] bytes=new byte[16];RANDOM.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
 static String hash(String s){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
 static boolean matches(String code,String digest){return code!=null&&code.matches("[A-Za-z0-9_-]{22}")&&MessageDigest.isEqual(hash(code).getBytes(StandardCharsets.US_ASCII),digest.getBytes(StandardCharsets.US_ASCII));}
}
