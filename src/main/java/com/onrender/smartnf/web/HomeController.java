package com.onrender.smartnf.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String home() { return "home"; }

    @GetMapping("/login")
    public String login() { return "login"; }

    @GetMapping("/policies/privacy")
    public String privacy(Model model) {
        model.addAttribute("title", "개인정보처리방침");
        model.addAttribute("description", "서비스 운영 전 수집 항목·이용 목적·보유기간·철회 및 삭제 절차를 확정해 공개할 예정입니다. 현재는 개발용 로그인 화면을 제공하며, 이 페이지에서 개인정보를 입력받지 않습니다.");
        return "information";
    }

    @GetMapping("/policies/terms")
    public String terms(Model model) {
        model.addAttribute("title", "이용약관");
        model.addAttribute("description", "SmartNF는 현재 개발 중입니다. 정식 이용약관은 서비스 운영 범위와 책임·이용 조건을 확정한 뒤 공개할 예정입니다. 공개 체험은 가상 데이터 조회만 제공하며 실제 주문·외부 발주·ERP 입력을 실행하지 않습니다.");
        return "information";
    }

    @GetMapping("/contact")
    public String contact(Model model) {
        model.addAttribute("title", "문의 안내");
        model.addAttribute("description", "연락처: 010-5880-3613. 이메일 contact@smartnf.example은 시연용이며 수신되지 않습니다. 현재 문의 폼은 제공하지 않습니다.");
        return "information";
    }
}
