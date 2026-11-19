package com.onrender.smartnf.health;
import java.time.LocalDate;import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import static com.onrender.smartnf.health.HealthDailyModels.*;
@RestController
@RequestMapping("/api/me/health/daily")
public class HealthDailyController {
 private final CurrentHealthMember current;private final HealthDailyService service;
 public HealthDailyController(CurrentHealthMember current,HealthDailyService service){this.current=current;this.service=service;}
 @GetMapping("/tracking") public Selection selection(Authentication auth){return service.selection(current.id(auth));}
 @PostMapping("/tracking") public Selection saveSelection(Authentication auth,@RequestBody SaveSelection request){return service.saveSelection(current.id(auth),request);}
 @GetMapping("/options") public java.util.Map<String,Object> options(Authentication auth){return service.options(current.id(auth));}
 @GetMapping("/day") public Day day(Authentication auth,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date){return service.day(current.id(auth),date);}
 @GetMapping public List<Entry> range(Authentication auth,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate from,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate to){return service.range(current.id(auth),from,to);}
 @PostMapping public Day save(Authentication auth,@RequestBody Save request){return service.save(current.id(auth),request);}
 @PostMapping("/delete") public Day delete(Authentication auth,@RequestBody Delete request){return service.delete(current.id(auth),request);}
}
