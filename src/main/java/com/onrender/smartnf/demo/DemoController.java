package com.onrender.smartnf.demo;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DemoController {
    private final DemoService demoService;
    public DemoController(DemoService demoService) { this.demoService = demoService; }

    @GetMapping("/demo/admin")
    public String dashboard(Model model) {
        model.addAttribute("demo", demoService.summary());
        return "demo/admin";
    }

    @GetMapping("/api/demo/admin/summary")
    public ResponseEntity<DemoService.DemoSummary> summary() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(demoService.summary());
    }
}
