package com.onrender.smartnf.member.naver;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
public class NaverViewAdvice {
    private final NaverSettings settings;
    public NaverViewAdvice(NaverSettings settings){this.settings=settings;}
    @ModelAttribute("naverLoginAvailable") public boolean available(HttpServletRequest request){return settings.availableAt(request);}
}
