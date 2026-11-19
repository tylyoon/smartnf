package com.onrender.smartnf.health;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/health/layout")
public class MyPageLayoutController {
    private final CurrentHealthMember current;private final MyPageLayoutService layouts;
    public MyPageLayoutController(CurrentHealthMember current,MyPageLayoutService layouts){this.current=current;this.layouts=layouts;}
    @GetMapping public MyPageLayout.State get(Authentication auth){return layouts.get(current.id(auth));}
    @PostMapping public MyPageLayout.State save(Authentication auth,@RequestBody MyPageLayout.Save request){return layouts.save(current.id(auth),request);}
    @PostMapping("/suggest") public MyPageLayout.Suggestion suggest(Authentication auth,@RequestBody MyPageLayout.Prompt request){return layouts.suggest(current.id(auth),request);}
}
