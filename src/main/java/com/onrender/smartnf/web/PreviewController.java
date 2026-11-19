package com.onrender.smartnf.web;

import java.util.Set;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** 화면 검토 전용: DB·개인정보·업무 실행과 연결하지 않습니다. */
@Controller
public class PreviewController {
    private static final Set<String> PAGES = Set.of(
        "health",
        "health/profile",
        "health/meals",
        "health/weight",
        "recipes",
        "recipes/simulator",
        "recipes/recommend",
        "recipes/detail",
        "recipes/offers",
        "business",
        "business/shop",
        "business/orders",
        "business/partners",
        "business/purchase",
        "business/documents",
        "business/jobs",
        "business/payment",
        "community",
        "community/notices",
        "community/board",
        "community/post",
        "community/write",
        "mypage",
        "mypage/review",
        "mypage/profile",
        "mypage/saved",
        "mypage/history",
        "mypage/reports",
        "account/signup",
        "account/recover",
        "about",
        "about/location",
        "health/info",
        "health/foods",
        "health/recommendations",
        "health/diet",
        "health/feedback",
        "mypage/state",
        "mypage/meals",
        "mypage/weight",
        "mypage/feedback",
        "mypage/consent",
        "business/data",
        "about/contact");

    @GetMapping("/preview/{area}")
    public String section(@PathVariable String area) {
        if ("account".equals(area)) return "redirect:/preview/account/signup";
        return page(area);
    }

    @GetMapping("/preview/{area}/{screen}")
    public String screen(@PathVariable String area, @PathVariable String screen) {
        if ("recipes".equals(area) && "pantry".equals(screen)) {
            return "redirect:/preview/recipes/recommend?mode=ingredients";
        }
        if ("health".equals(area)) {
            if ("profile".equals(screen)) return "redirect:/preview/mypage/state";
            if ("meals".equals(screen)) return "redirect:/preview/mypage/meals";
            if ("weight".equals(screen)) return "redirect:/preview/mypage/weight";
        }
        return page(area + "/" + screen);
    }

    private String page(String key) {
        if (!PAGES.contains(key)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return "preview/" + key;
    }
}
