package com.onrender.smartnf.member;

import jakarta.validation.Valid;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;

@Controller
public class SignupController {
    private final MemberService service;
    public SignupController(MemberService service){this.service=service;}
    @InitBinder("signupForm") void bind(WebDataBinder binder){binder.setAllowedFields("email","displayName","password","passwordConfirm","termsAccepted","privacyAccepted","documentVersion");}
    @GetMapping("/signup") String signup(Model model){var form=new SignupForm();form.setDocumentVersion(MemberService.DOCUMENT_VERSION);model.addAttribute("signupForm",form);return "account/signup";}
    @PostMapping("/signup") String register(@Valid @ModelAttribute SignupForm signupForm,BindingResult result){
        if(!result.hasErrors())try{service.signup(signupForm);return "redirect:/login?registered";}
        catch(DuplicateKeyException error){result.reject("signup.failed","가입을 완료하지 못했습니다. 입력 정보를 확인하거나 로그인·문의 경로를 이용하세요.");}
        catch(IllegalArgumentException|IllegalStateException error){result.reject("signup.invalid",error.getMessage());}
        catch(DataAccessException error){result.reject("signup.unavailable","현재 가입을 처리할 수 없습니다. 잠시 후 다시 시도하세요.");}
        signupForm.setPassword("");signupForm.setPasswordConfirm("");return "account/signup";
    }
    @GetMapping("/signup/documents/{kind}") String document(@PathVariable String kind,Model model){
        if(kind.equals("google-terms")||kind.equals("google-privacy")){
            model.addAttribute("title",kind.equals("google-terms")?"구글 가입 개발용 이용 안내":"구글 가입 개발용 개인정보 처리 안내");
            model.addAttribute("description",kind.equals("google-terms")?
                "버전 dev-google-20261028. 구글 인증 후 SmartNF 가입 동의를 별도로 받는 개발 검증용 안내입니다. 기존 이메일·카카오·네이버 회원과 자동 병합하지 않습니다. 계정 연결/해제·탈퇴 UI 및 운영용 정책은 준비 중입니다. 건강정보 저장 동의는 별도입니다.":
                "버전 dev-google-20261028. 구글 OpenID Connect 인증으로 검증된 고유 ID(sub)를 사용합니다. 이메일·프로필 권한을 별도로 요청하지 않으며 구글 비밀번호는 입력받지 않습니다. 회원 DB에 구글 ID·가상 표시 이름·상태·권한·가입/동의 시각을 저장합니다. 가입 대기 중에는 ID와 인증 시각만 서버 세션에 최대10분 보관합니다. 가입 회원의 로그인 세션에는 인증된 ID 토큰이 포함되며 로그아웃 시 세션이 종료됩니다. 액세스·리프레시 토큰은 최종 세션에 보관하지 않고 모든 구글 토큰은 회원 DB에 저장하지 않습니다. 실제 운영용 보관·삭제 정책은 미확정입니다.");
            return "information";
        }
        if(kind.equals("naver-terms")||kind.equals("naver-privacy")){
            model.addAttribute("title",kind.equals("naver-terms")?"네이버 가입 개발용 이용 안내":"네이버 가입 개발용 개인정보 처리 안내");
            model.addAttribute("description",kind.equals("naver-terms")?
                "버전 dev-naver-20261028. 로컬 네이버 인증과 SmartNF 가입 검증용 안내입니다. 네이버 인증과 SmartNF 가입 동의는 별개입니다. 이메일·카카오 회원과 자동 병합하지 않고 별도 회원을 만듭니다. 실제 운영 약관·계정 연결/해제·탈퇴 UI는 준비 중이며 건강정보 저장·주문·결제는 실행하지 않습니다.":
                "버전 dev-naver-20261028. 네이버 인증 서버에서 인가코드와 토큰을 교환하고 프로필 API의 앱별 회원 ID로 식별합니다. 인증 과정에서 네이버와 통신합니다. 동의 범위에 따라 추가 프로필이 응답되어도 회원 ID만 사용하고 이메일·실명·연락처는 회원정보로 저장하거나 계정 연결에 사용하지 않습니다. 네이버 비밀번호는 SmartNF에서 입력받지 않습니다. DB에 네이버 회원 ID·가상 표시 이름·상태·권한·가입/동의 시각을 저장하고, 가입 확인 전 ID/시각은 서버 세션에 최대10분 보관합니다. OAuth 토큰은 최종 로그인 세션/회원 DB에 보관하지 않습니다. 운영용 보관·삭제 정책은 미확정이며 현재 로컬 관리 절차로 삭제합니다.");
            return "information";
        }
        if(kind.equals("kakao-terms")||kind.equals("kakao-privacy")){
            model.addAttribute("title",kind.equals("kakao-terms")?"카카오 가입 개발용 이용 안내":"카카오 가입 개발용 개인정보 처리 안내");
            model.addAttribute("description",kind.equals("kakao-terms")?
                "버전 dev-kakao-20261028. 로컬 카카오 인증·SmartNF 가입의 개발 검증용입니다. 카카오 인증 후 SmartNF 가입 동의를 별도로 받습니다. 일반 이메일 회원과 자동 병합하지 않고 별도 회원으로 생성합니다. SNS 연결/해제·탈퇴 UI·운영용 정책은 준비 중입니다. 건강정보 저장·주문·결제는 실행하지 않습니다.":
                "버전 dev-kakao-20261028. 카카오 인증 서버에서 인가코드와 토큰을 교환하고 회원정보 API의 고유 ID로 본인을 식별합니다. 인증 과정에서 카카오와 통신합니다. 로컬 DB에는 카카오 회원 ID·가상 표시 이름·회원 상태·권한·가입/동의 시각을 저장합니다. 신규 가입 확인 전에는 ID와 인증시각만 서버 세션에 최대10분 보관합니다. 이메일·카카오 비밀번호는 수집하지 않고 OAuth 토큰은 회원 DB나 로그인 세션에 보관하지 않습니다. 최종 보관·삭제 정책은 운영 전 확정이 필요하며 현재는 로컬 관리 절차로 삭제합니다. 공개 운영용 동의서가 아닙니다.");
            return "information";
        }
        if(!kind.equals("terms")&&!kind.equals("privacy"))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND);
        model.addAttribute("title",kind.equals("terms")?"개발 검증용 이용 안내":"개발 검증용 개인정보 처리 안내");
        model.addAttribute("description",kind.equals("terms")?
          "버전 dev-20261028. 개인 프로젝트의 로컬 회원가입·인증 검증용입니다. 실제 서비스 운영용 약관이 아닙니다. 가상 표시 이름·시험용 이메일·다른 곳에서 쓰지 않는 비밀번호만 사용하세요. 건강정보 저장·주문·결제는 이 가입으로 실행되지 않습니다.":
          "버전 dev-20261028. 로컬 MySQL에 시험용 이메일·표시 이름·비밀번호 해시·회원 상태·권한·가입 시각·동의 문서 및 동의 시각을 저장하여 가입과 인증을 검증합니다. 외부 메일 발송과 SNS 인증은 실행하지 않습니다. 보관·삭제 및 운영용 정책은 확정 전이며 삭제는 로컬 관리 절차로 처리합니다. 실제 개인정보·건강정보를 입력하지 마세요.");
        return "information";
    }
}
