package com.onrender.smartnf.member;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
@Component
public class AccountMail {
 private final ObjectProvider<JavaMailSender> sender;private final boolean enabled;private final String from;private final String host;
 public AccountMail(ObjectProvider<JavaMailSender> sender,@Value("${smartnf.account.mail-enabled:false}") boolean enabled,@Value("${smartnf.account.mail-from:}") String from,@Value("${spring.mail.host:}") String host){this.sender=sender;this.enabled=enabled;this.from=from;this.host=host;}
 public boolean ready(){return enabled&&!host.isBlank()&&!from.isBlank()&&!from.contains("\r")&&!from.contains("\n")&&sender.getIfAvailable()!=null;}
 public void send(String to,String code,String kind){
  if(!ready())throw new IllegalStateException("메일 서버 설정이 필요합니다.");
  var mail=new SimpleMailMessage();mail.setFrom(from);mail.setTo(to);mail.setSubject("[SmartNF] 로그인 이메일 변경 확인 ("+kind+")");
  mail.setText("로그인 이메일 변경 요청의 "+kind+" 확인 코드입니다.\n\n"+code+"\n\n10분 이내에 SmartNF 계정 설정 화면에서 두 이메일의 코드를 입력하세요. 요청하지 않았다면 코드를 공유하지 말고 비밀번호를 변경하세요. 새 요청을 보내면 이전 코드는 사용할 수 없습니다.");
  sender.getObject().send(mail);
 }
}
