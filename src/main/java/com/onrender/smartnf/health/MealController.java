package com.onrender.smartnf.health;
import java.time.LocalDate;import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import static com.onrender.smartnf.health.MealModels.*;
@RestController
@RequestMapping("/api/me/health/meals")
public class MealController {
 private final CurrentHealthMember current;private final MealService service;
 public MealController(CurrentHealthMember current,MealService service){this.current=current;this.service=service;}
 @GetMapping("/catalog") public java.util.List<MealCatalog.Food> catalog(Authentication auth){return service.catalog(current.id(auth));}
 @GetMapping("/day") public Day day(Authentication auth,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date){return service.day(current.id(auth),date);}
 @GetMapping public List<Day> range(Authentication auth,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate from,@RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate to){return service.range(current.id(auth),from,to);}
 @PostMapping public Day save(Authentication auth,@RequestBody Save request){return service.save(current.id(auth),request);}
 @PostMapping("/delete") public Day delete(Authentication auth,@RequestBody Delete request){return service.delete(current.id(auth),request);}
}
