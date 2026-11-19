package com.onrender.smartnf.member;

import java.util.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.onrender.smartnf.health.*;
import static com.onrender.smartnf.member.AccountSecurityRules.*;

@Service
@Transactional
public class AccountSettingsService {
 private final JdbcTemplate jdbc;private final PasswordEncoder encoder;private final AccountMail mail;private final HealthService health;
 public AccountSettingsService(JdbcTemplate jdbc,PasswordEncoder encoder,AccountMail mail,HealthService health){this.jdbc=jdbc;this.encoder=encoder;this.mail=mail;this.health=health;}
 public record Snapshot(String name,String email,List<String> providers,boolean mailReady){}
 public record Result(boolean ok,String message,boolean logout){
  static Result fail(String s){return new Result(false,s,false);}
  static Result success(String s,boolean logout){return new Result(true,s,logout);}
 }
 private record Credential(String email,String hash){}
 private LocalDateTime now(){return LocalDateTime.now(ZoneOffset.UTC);}
 private void lock(long id,long version){
  var rows=jdbc.query("SELECT status,auth_version FROM members WHERE id=? FOR UPDATE",(rs,n)->rs.getString(1).equals("ACTIVE")&&rs.getLong(2)==version,id);
  if(rows.size()!=1||!rows.get(0))throw new HealthException(403,"다시 로그인해 주세요.");
 }
 private Credential credential(long id){return jdbc.query("SELECT login_email,password_hash FROM local_credentials WHERE member_id=?",(rs,n)->new Credential(rs.getString(1),rs.getString(2)),id).stream().findFirst().orElse(null);}
 public Snapshot snapshot(long id,long version){
  lock(id,version);var c=credential(id);
  return new Snapshot(jdbc.queryForObject("SELECT display_name FROM members WHERE id=?",String.class,id),c==null?null:c.email(),jdbc.queryForList("SELECT provider FROM social_accounts WHERE member_id=? ORDER BY provider",String.class,id),mail.ready());
 }
 // Failure counters are returned as normal results so the surrounding transaction commits them.
 private boolean verify(long id,Credential c,String password){
  var rows=jdbc.query("SELECT failed_count,window_start FROM member_account_security WHERE member_id=?",(rs,n)->Map.entry(rs.getInt(1),rs.getTimestamp(2).toLocalDateTime()),id);
  int count=0;var start=now();
  if(rows.isEmpty())jdbc.update("INSERT INTO member_account_security(member_id,failed_count,window_start) VALUES (?,0,?)",id,start);
  else{count=rows.get(0).getKey();start=rows.get(0).getValue();if(start.plusMinutes(15).isBefore(now())){count=0;start=now();}}
  if(count>=5)return false;
  boolean ok=c!=null&&password!=null&&password.length()<=64&&password.getBytes(StandardCharsets.UTF_8).length<=72&&encoder.matches(password,c.hash());
  jdbc.update("UPDATE member_account_security SET failed_count=?,window_start=? WHERE member_id=?",ok?0:count+1,start,id);return ok;
 }
 private Result passwordError(){return Result.fail("본인 확인에 실패했습니다. 현재 비밀번호를 확인하세요. 15분 동안 5회 실패하면 해당 기간에는 계정 변경을 제한합니다.");}

 private void bump(long id){jdbc.update("UPDATE members SET auth_version=auth_version+1,updated_at=? WHERE id=?",now(),id);jdbc.update("DELETE FROM member_email_changes WHERE member_id=?",id);}
 public Result password(long id,long version,String current,String next,String confirm){
  lock(id,version);var c=credential(id);if(c==null)return Result.fail("SNS 전용 계정의 비밀번호는 해당 SNS에서 관리합니다.");
  if(!verify(id,c,current))return passwordError();
  if(!validPassword(next)||!next.equals(confirm))return Result.fail("새 비밀번호는 12~64자·UTF-8 72바이트 이내이며 확인 값과 같아야 합니다.");
  if(encoder.matches(next,c.hash()))return Result.fail("현재 비밀번호와 다른 비밀번호를 입력하세요.");
  jdbc.update("UPDATE local_credentials SET password_hash=?,password_changed_at=? WHERE member_id=?",encoder.encode(next),now(),id);bump(id);
  return Result.success("비밀번호를 변경했습니다. 다시 로그인해 주세요.",true);
 }
 public Result requestEmail(long id,long version,String password,String proposed){
  lock(id,version);var c=credential(id);if(c==null)return Result.fail("SNS 전용 계정에는 SmartNF 로그인 이메일이 없습니다. SNS 계정의 이메일은 해당 서비스에서 변경하세요.");
  if(!mail.ready())return Result.fail("메일 발송 설정이 필요합니다. 이메일은 변경되지 않았습니다.");
  if(!verify(id,c,password))return passwordError();
  String email=MemberService.normalizeEmail(proposed);
  if(!validEmail(email)||email.equals(c.email()))return Result.fail("현재와 다른 올바른 이메일을 입력하세요.");
  var sent=jdbc.queryForList("SELECT created_at FROM member_email_changes WHERE member_id=?",LocalDateTime.class,id);
  if(!sent.isEmpty()&&sent.get(0).plusSeconds(60).isAfter(now()))return Result.fail("새 확인 메일은 60초 후 요청할 수 있습니다.");
  if(!jdbc.queryForList("SELECT member_id FROM local_credentials WHERE login_email=?",Long.class,email).isEmpty())return Result.fail("이 이메일로 변경할 수 없습니다.");
  String oldCode=token(),newCode=token();var created=now();
  jdbc.update("DELETE FROM member_email_changes WHERE member_id=?",id);
  jdbc.update("INSERT INTO member_email_changes(member_id,proposed_email,old_code_hash,new_code_hash,auth_version,created_at,expires_at,failed_count) VALUES (?,?,?,?,?,?,?,0)",id,email,hash(oldCode),hash(newCode),version,created,created.plusMinutes(10));
  // Do not log mail exceptions or codes. A partial SMTP send never changes the login address.
  mail.send(c.email(),oldCode,"기존 이메일");mail.send(email,newCode,"새 이메일");
  return Result.success("기존·새 이메일에 확인 코드를 보냈습니다. 10분 이내에 두 코드를 모두 입력하세요.",false);
 }
 private record Pending(String email,String oldHash,String newHash,long version,LocalDateTime expires,int failures){}
 public Result confirmEmail(long id,long version,String password,String oldCode,String newCode){
  lock(id,version);var c=credential(id);if(!verify(id,c,password))return passwordError();
  var rows=jdbc.query("SELECT proposed_email,old_code_hash,new_code_hash,auth_version,expires_at,failed_count FROM member_email_changes WHERE member_id=?",(rs,n)->new Pending(rs.getString(1),rs.getString(2),rs.getString(3),rs.getLong(4),rs.getTimestamp(5).toLocalDateTime(),rs.getInt(6)),id);
  if(rows.isEmpty())return Result.fail("유효한 이메일 변경 요청이 없습니다.");
  var pending=rows.get(0);
  if(pending.version()!=version||!pending.expires().isAfter(now())||pending.failures()>=5){jdbc.update("DELETE FROM member_email_changes WHERE member_id=?",id);return Result.fail("확인 요청이 만료되었거나 시도 횟수를 초과했습니다. 다시 요청하세요.");}
  if(!matches(oldCode,pending.oldHash())||!matches(newCode,pending.newHash())){jdbc.update("UPDATE member_email_changes SET failed_count=failed_count+1 WHERE member_id=?",id);return Result.fail("두 확인 코드를 확인하세요. 코드 확인은 최대 5회 가능합니다.");}
  if(!jdbc.queryForList("SELECT member_id FROM local_credentials WHERE login_email=?",Long.class,pending.email()).isEmpty())return Result.fail("이 이메일로 변경할 수 없습니다. 다시 요청하세요.");
  jdbc.update("UPDATE local_credentials SET login_email=? WHERE member_id=?",pending.email(),id);bump(id);
  return Result.success("로그인 이메일을 변경했습니다. 새 이메일로 다시 로그인해 주세요.",true);
 }
 public Result withdraw(long id,long version,String password,String confirmation,boolean accepted){
  lock(id,version);var c=credential(id);
  if(c==null)return Result.fail("SNS 전용 계정의 탈퇴는 공급자 본인 재확인 연결 후 제공됩니다. 건강기록은 저장 동의 철회에서 삭제할 수 있습니다.");
  if(!verify(id,c,password))return passwordError();
  if(!accepted||!"회원탈퇴".equals(confirmation))return Result.fail("삭제 범위를 확인하고 회원탈퇴를 정확히 입력하세요.");
  if(jdbc.queryForObject("SELECT COUNT(*) FROM member_roles WHERE member_id=? AND role='ADMIN'",Integer.class,id)>0)return Result.fail("관리자 계정은 별도의 권한 이관 절차가 필요합니다.");
  health.eraseForAccountWithdrawal(id);
  jdbc.update("DELETE FROM food_plan_requests WHERE member_id=?",id);jdbc.update("DELETE FROM food_plan_days WHERE member_id=?",id);
  jdbc.update("DELETE FROM member_mypage_layouts WHERE member_id=?",id);bump(id);
  jdbc.update("DELETE FROM local_credentials WHERE member_id=?",id);
  jdbc.update("DELETE FROM social_accounts WHERE member_id=?",id);
  jdbc.update("DELETE FROM member_roles WHERE member_id=?",id);
  jdbc.update("DELETE FROM member_account_security WHERE member_id=?",id);
  jdbc.update("UPDATE members SET display_name='탈퇴 회원',status='WITHDRAWN',updated_at=? WHERE id=?",now(),id);
  return Result.success("회원 탈퇴를 처리했습니다.",true);
 }
}
