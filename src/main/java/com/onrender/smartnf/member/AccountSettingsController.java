package com.onrender.smartnf.member;

import jakarta.servlet.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.onrender.smartnf.health.CurrentHealthMember;

@Controller
@RequestMapping("/mypage/account")
public class AccountSettingsController {
 private final AccountSettingsService service;private final CurrentHealthMember current;
 public AccountSettingsController(AccountSettingsService service,CurrentHealthMember current){this.service=service;this.current=current;}
 private long version(Authentication auth){return AccountIdentity.version(auth.getPrincipal());}
 @GetMapping String page(Authentication auth,Model model){model.addAttribute("account",service.snapshot(current.id(auth),version(auth)));return "account/settings";}
 private String finish(AccountSettingsService.Result result,Authentication auth,HttpServletRequest request,HttpServletResponse response,RedirectAttributes flash){
  if(result.logout()){new SecurityContextLogoutHandler().logout(request,response,auth);return "redirect:/login?accountUpdated";}
  flash.addFlashAttribute("accountMessage",result.message());return "redirect:/mypage/account";
 }
 @PostMapping("/password") String password(Authentication auth,@RequestParam String currentPassword,@RequestParam String newPassword,@RequestParam String passwordConfirm,HttpServletRequest request,HttpServletResponse response,RedirectAttributes flash){return finish(service.password(current.id(auth),version(auth),currentPassword,newPassword,passwordConfirm),auth,request,response,flash);}
 @PostMapping("/email/request") String email(Authentication auth,@RequestParam String currentPassword,@RequestParam String newEmail,HttpServletRequest request,HttpServletResponse response,RedirectAttributes flash){return finish(service.requestEmail(current.id(auth),version(auth),currentPassword,newEmail),auth,request,response,flash);}
 @PostMapping("/email/confirm") String confirm(Authentication auth,@RequestParam String currentPassword,@RequestParam String oldCode,@RequestParam String newCode,HttpServletRequest request,HttpServletResponse response,RedirectAttributes flash){return finish(service.confirmEmail(current.id(auth),version(auth),currentPassword,oldCode,newCode),auth,request,response,flash);}
 @PostMapping("/withdraw") String withdraw(Authentication auth,@RequestParam String currentPassword,@RequestParam String confirmation,@RequestParam(defaultValue="false") boolean accepted,HttpServletRequest request,HttpServletResponse response,RedirectAttributes flash){return finish(service.withdraw(current.id(auth),version(auth),currentPassword,confirmation,accepted),auth,request,response,flash);}
}
