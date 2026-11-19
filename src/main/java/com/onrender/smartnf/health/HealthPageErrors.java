package com.onrender.smartnf.health;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice(assignableTypes=HealthPageController.class)
public class HealthPageErrors {
    @ExceptionHandler(HealthException.class) String health(HealthException error,Model model,HttpServletResponse response){
        response.setStatus(error.status());model.addAttribute("title","건강 기록 이용 안내");model.addAttribute("description",error.getMessage());return "information";
    }
    @ExceptionHandler(org.springframework.dao.DataAccessException.class) String database(Model model,HttpServletResponse response){
        response.setStatus(503);model.addAttribute("title","건강 기록 저장소 확인 필요");model.addAttribute("description","건강 기록 저장소를 준비하지 못했습니다. 서버의 마이그레이션·접속 권한을 확인해 주세요.");return "information";
    }
}
