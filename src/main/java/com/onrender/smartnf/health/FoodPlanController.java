package com.onrender.smartnf.health;
import java.time.LocalDate;import java.util.List;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import static com.onrender.smartnf.health.FoodPlanModels.*;
@RestController @RequestMapping("/api/me/health/plans")
public class FoodPlanController {
 private final CurrentHealthMember current;private final FoodPlanService service;
 public FoodPlanController(CurrentHealthMember current,FoodPlanService service){this.current=current;this.service=service;}
 @GetMapping("/consent") public Consent consent(Authentication a){return service.consent(current.id(a));}
 @PostMapping("/consent") public Consent consent(Authentication a,@RequestBody ConsentChange body){return service.changeConsent(current.id(a),body);}
 @GetMapping("/day") public Day day(Authentication a,@RequestParam LocalDate date){return service.day(current.id(a),date);}
 @GetMapping("/range") public List<Count> range(Authentication a,@RequestParam LocalDate from,@RequestParam LocalDate to){return service.range(current.id(a),from,to);}
 @PostMapping public Day save(Authentication a,@RequestBody Save body){return service.save(current.id(a),body);}
 @PostMapping("/move") public Day move(Authentication a,@RequestBody Move body){return service.move(current.id(a),body);}
 @PostMapping("/delete") public Day delete(Authentication a,@RequestBody Delete body){return service.delete(current.id(a),body);}
}
