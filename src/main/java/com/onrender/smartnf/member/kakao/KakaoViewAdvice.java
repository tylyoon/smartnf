package com.onrender.smartnf.member.kakao;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
public class KakaoViewAdvice {
    private final KakaoSettings settings;
    public KakaoViewAdvice(KakaoSettings settings){this.settings=settings;}
    @ModelAttribute("kakaoLoginAvailable") public boolean available(HttpServletRequest request){return settings.availableAt(request);}
}
