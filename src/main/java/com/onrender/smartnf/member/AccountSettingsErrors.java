package com.onrender.smartnf.member;
import com.onrender.smartnf.health.HealthException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
@ControllerAdvice(assignableTypes=AccountSettingsController.class)
public class AccountSettingsErrors {
 private String page(String message,int status,Model model,HttpServletResponse response){response.setStatus(status);model.addAttribute("title","계정 설정 안내");model.addAttribute("description",message);return "information";}
 @ExceptionHandler(HealthException.class) String health(HealthException e,Model m,HttpServletResponse r){return page(e.getMessage(),e.status(),m,r);}
 @ExceptionHandler(org.springframework.mail.MailException.class) String mail(Model m,HttpServletResponse r){return page("확인 메일 발송을 완료하지 못했습니다. 로그인 이메일은 변경되지 않았습니다. 잠시 후 계정 설정에서 다시 시도하세요.",503,m,r);}
 @ExceptionHandler(org.springframework.dao.DataAccessException.class) String database(Model m,HttpServletResponse r){return page("변경을 완료하지 못했습니다. 다시 로그인하여 현재 상태를 확인하세요.",503,m,r);}
 @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class) String missing(Model m,HttpServletResponse r){return page("필수 입력을 확인하세요.",400,m,r);}
}
