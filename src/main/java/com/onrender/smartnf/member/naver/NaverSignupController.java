package com.onrender.smartnf.member.naver;

import com.onrender.smartnf.member.MemberService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;

@Controller
public class NaverSignupController {
    private final NaverSettings settings;private final NaverMemberService members;
    public NaverSignupController(NaverSettings settings,NaverMemberService members){this.settings=settings;this.members=members;}
    @InitBinder("naverSignupForm") void bind(WebDataBinder binder){binder.setAllowedFields("displayName","termsAccepted","privacyAccepted","documentVersion");}
    private PendingNaver pending(HttpServletRequest request){
        var session=request.getSession(false);Object value=session==null?null:session.getAttribute(PendingNaver.KEY);
        if(value instanceof PendingNaver pending&&pending.valid())return pending;
        if(session!=null)session.removeAttribute(PendingNaver.KEY);return null;
    }
    @GetMapping("/signup/naver") String form(HttpServletRequest request,Model model){
        if(!settings.availableAt(request)||pending(request)==null)return "redirect:/login?naverExpired";
        var form=new NaverSignupForm();form.setDocumentVersion(NaverMemberService.DOCUMENT_VERSION);model.addAttribute("naverSignupForm",form);return "account/naver-signup";
    }
    @PostMapping("/signup/naver") String signup(HttpServletRequest request,@Valid @ModelAttribute NaverSignupForm naverSignupForm,BindingResult errors){
        var pending=pending(request);if(!settings.availableAt(request)||pending==null)return "redirect:/login?naverExpired";
        if(!errors.hasErrors())try{members.signup(pending,naverSignupForm);request.getSession().removeAttribute(PendingNaver.KEY);return "redirect:/login?naverRegistered";}
        catch(IllegalArgumentException|IllegalStateException error){errors.reject("signup.invalid",error.getMessage());}
        catch(DataAccessException error){errors.reject("signup.failed","가입을 완료하지 못했습니다. 잠시 후 네이버 로그인을 다시 진행하세요.");}
        return "account/naver-signup";
    }
    @PostMapping("/signup/naver/cancel") String cancel(HttpServletRequest request){var session=request.getSession(false);if(session!=null)session.removeAttribute(PendingNaver.KEY);return "redirect:/login";}
}
