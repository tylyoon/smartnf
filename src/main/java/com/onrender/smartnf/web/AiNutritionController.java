package com.onrender.smartnf.web;
import com.onrender.smartnf.health.CurrentHealthMember;
import com.onrender.smartnf.health.HealthException;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
public class AiNutritionController {
 private final CurrentHealthMember current;private final AiNutritionService service;
 public AiNutritionController(CurrentHealthMember current,AiNutritionService service){this.current=current;this.service=service;}
 private long member(Authentication auth){try{return current.id(auth);}catch(HealthException e){throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(e.status()),e.getMessage());}}
 private <T>ResponseEntity<T> ok(T body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
 @GetMapping("/api/me/ai-nutrition")public ResponseEntity<List<AiNutritionService.Estimate>> list(Authentication auth){return ok(service.list(member(auth)));}
 @PostMapping("/api/me/ai-nutrition")public ResponseEntity<AiNutritionService.Estimate> request(Authentication auth,@RequestBody AiNutritionService.Input input){return ok(service.request(member(auth),input));}
 @PostMapping("/api/me/ai-nutrition/{id}/review")public ResponseEntity<AiNutritionService.Estimate> review(Authentication auth,@PathVariable("id")String id,@RequestBody AiNutritionService.Review input){return ok(service.review(member(auth),id,input));}
}
