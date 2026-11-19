package com.onrender.smartnf.member.kakao;

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
public class KakaoSignupController {
    private final KakaoSettings settings;private final KakaoMemberService members;
    public KakaoSignupController(KakaoSettings settings,KakaoMemberService members){this.settings=settings;this.members=members;}
    @InitBinder("kakaoSignupForm") void bind(WebDataBinder binder){binder.setAllowedFields("displayName","termsAccepted","privacyAccepted","documentVersion");}
    private PendingKakao pending(HttpServletRequest request){
        var session=request.getSession(false);Object value=session==null?null:session.getAttribute(PendingKakao.KEY);
        if(value instanceof PendingKakao pending&&pending.valid())return pending;
        if(session!=null)session.removeAttribute(PendingKakao.KEY);return null;
    }
    @GetMapping("/signup/kakao") String form(HttpServletRequest request,Model model){
        if(!settings.availableAt(request)||pending(request)==null)return "redirect:/login?socialExpired";
        var form=new KakaoSignupForm();form.setDocumentVersion(KakaoMemberService.DOCUMENT_VERSION);model.addAttribute("kakaoSignupForm",form);return "account/kakao-signup";
    }
    @PostMapping("/signup/kakao") String signup(HttpServletRequest request,@Valid @ModelAttribute KakaoSignupForm kakaoSignupForm,BindingResult errors){
        var pending=pending(request);if(!settings.availableAt(request)||pending==null)return "redirect:/login?socialExpired";
        if(!errors.hasErrors())try{members.signup(pending,kakaoSignupForm);request.getSession().removeAttribute(PendingKakao.KEY);return "redirect:/login?socialRegistered";}
        catch(IllegalArgumentException|IllegalStateException error){errors.reject("signup.invalid",error.getMessage());}
        catch(DataAccessException error){errors.reject("signup.failed","가입을 완료하지 못했습니다. 잠시 후 카카오 로그인을 다시 진행하세요.");}
        return "account/kakao-signup";
    }
    @PostMapping("/signup/kakao/cancel") String cancel(HttpServletRequest request){var session=request.getSession(false);if(session!=null)session.removeAttribute(PendingKakao.KEY);return "redirect:/login";}
}
