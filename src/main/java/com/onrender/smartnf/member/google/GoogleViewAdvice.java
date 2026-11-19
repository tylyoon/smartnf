package com.onrender.smartnf.member.google;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
public class GoogleViewAdvice {
    private final GoogleSettings settings;
    public GoogleViewAdvice(GoogleSettings settings){this.settings=settings;}
    @ModelAttribute("googleLoginAvailable") public boolean available(HttpServletRequest request){return settings.availableAt(request);}
}
