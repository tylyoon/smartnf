package com.onrender.smartnf.member.google;

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
public class GoogleSignupController {
    private final GoogleSettings settings;private final GoogleMemberService members;
    public GoogleSignupController(GoogleSettings settings,GoogleMemberService members){this.settings=settings;this.members=members;}
    @InitBinder("googleSignupForm") void bind(WebDataBinder binder){binder.setAllowedFields("displayName","termsAccepted","privacyAccepted","documentVersion");}
    private PendingGoogle pending(HttpServletRequest request){
        var session=request.getSession(false);Object value=session==null?null:session.getAttribute(PendingGoogle.KEY);
        if(value instanceof PendingGoogle pending&&pending.valid())return pending;
        if(session!=null)session.removeAttribute(PendingGoogle.KEY);return null;
    }
    @GetMapping("/signup/google") String form(HttpServletRequest request,Model model){
        if(!settings.availableAt(request)||pending(request)==null)return "redirect:/login?googleExpired";
        var form=new GoogleSignupForm();form.setDocumentVersion(GoogleMemberService.DOCUMENT_VERSION);model.addAttribute("googleSignupForm",form);return "account/google-signup";
    }
    @PostMapping("/signup/google") String signup(HttpServletRequest request,@Valid @ModelAttribute GoogleSignupForm googleSignupForm,BindingResult errors){
        var pending=pending(request);if(!settings.availableAt(request)||pending==null)return "redirect:/login?googleExpired";
        if(!errors.hasErrors())try{members.signup(pending,googleSignupForm);request.getSession().removeAttribute(PendingGoogle.KEY);return "redirect:/login?googleRegistered";}
        catch(IllegalArgumentException|IllegalStateException error){errors.reject("signup.invalid",error.getMessage());}
        catch(DataAccessException error){errors.reject("signup.failed","가입을 완료하지 못했습니다. 잠시 후 구글 로그인을 다시 진행하세요.");}
        return "account/google-signup";
    }
    @PostMapping("/signup/google/cancel") String cancel(HttpServletRequest request){var session=request.getSession(false);if(session!=null)session.removeAttribute(PendingGoogle.KEY);return "redirect:/login";}
}
