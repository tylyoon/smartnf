package com.onrender.smartnf.health;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class HealthPageController {
    private final CurrentHealthMember current;private final HealthService service;
    public HealthPageController(CurrentHealthMember current,HealthService service){this.current=current;this.service=service;}
    @GetMapping("/preview/health/info") String healthEntry(Authentication auth,Model model){
        if(auth==null||auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)return "preview/health/info";
        return editor(auth,model);
    }
    @GetMapping("/health/info") String editor(Authentication auth,Model model){
        model.addAttribute("healthBootstrap",service.bootstrap(current.id(auth)));model.addAttribute("healthAccountMode",true);
        var kinds=new java.util.LinkedHashMap<String,String>();HealthFields.ALL.forEach((name,field)->kinds.put(name,field.kind().equals("select")?"select-one":field.kind()));model.addAttribute("healthFieldKinds",kinds);
        return "preview/health/info";
    }
    @GetMapping({"/mypage","/mypage/examples","/mypage/daily","/mypage/health","/mypage/health/history","/mypage/consent"})
    String dashboard(Authentication auth){service.consent(current.id(auth));return "health/personal-mypage";}
    @GetMapping("/mypage/consent/document") String document(Authentication auth,Model model){
        current.id(auth);model.addAttribute("title","개발용 건강정보 저장 안내 · "+HealthService.DOCUMENT_VERSION);
        model.addAttribute("description","가상 입력을 사용하는 로컬 검증용 안내입니다. 회원이 직접 확인한 건강 수치·진단받은 질환과 입력 메모·관리 조건/목표·생활습관·확정 관리항목과 날짜별 실천 여부·실천 메모·체중/혈압·측정 조건을 본인 MyPage 저장·조회에 사용합니다. 건강정보 저장본은 계정별 DB에 새 버전으로 기록합니다. 일일 기록은 하루 대표값과 실천 내용을 수정하며 이전 수정 본문은 별도 보존하지 않습니다. 개별 일일 기록 삭제 후 충돌 방지용 날짜·삭제 버전·요청 참조는 남지만 내용은 지우며 저장 동의 철회 때 이 메타데이터도 삭제합니다. 로그인만으로 임시 정보나 가상 예시를 자동 전송하지 않습니다. 식사 날짜·끼니·음식명·시간·메모와 사용자가 확인해 연결한 재료, 확인 여부, 재료별 기준 성분 자료의 출처/버전을 본인 식사 기록 저장·조회에 사용합니다. 재료별 100g당 기준 성분만 표시하며 무게 입력·섭취량 계산·영양 합계·권장량 비교·부족/과다 판정은 제공하지 않습니다. 기존 저장량은 새 화면에 표시하거나 계산하지 않으며 해당 날짜를 다시 저장/삭제하거나 동의를 철회할 때 정리합니다. 식사 내용은 날짜별 수정·삭제하며 삭제 후 날짜·버전·요청 참조만 충돌 방지용으로 남습니다. 알레르기·외부 AI 분석은 포함하지 않습니다. 동의하지 않아도 계정과 공개 체험은 이용할 수 있습니다. 건강정보 저장 동의를 철회하면 이 기능으로 저장한 모든 프로필·측정·질환·관리항목·일일 기록·식사 기록을 삭제하고 동의/철회 이력만 남깁니다. 재동의해도 삭제된 내용을 복원하지 않습니다. 회원 계정은 유지됩니다. 개발 DB의 데이터는 철회/개발자 로컬 삭제 전까지 보관되는 개발 기본안이며 운영용 정확한 보유기간·백업 삭제·탈퇴/보관 예외 정책은 미확정입니다. 운영용 동의서가 아니므로 실제 민감정보 대신 가상 값을 사용하세요.");return "information";
    }
}
