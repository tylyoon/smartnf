package com.onrender.smartnf.web;
import com.onrender.smartnf.health.CurrentHealthMember;import com.onrender.smartnf.health.HealthException;
import java.util.Map;import org.springframework.http.*;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import org.springframework.web.server.ResponseStatusException;
@RestController
public class MealAdditionController {
 private final CurrentHealthMember current;private final MealAdditionService service;
 public MealAdditionController(CurrentHealthMember current,MealAdditionService service){this.current=current;this.service=service;}
 @PostMapping(value="/api/me/meal-additions/recommend",consumes=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<MealAdditionService.Result> recommend(Authentication auth,@RequestBody MealAdditionService.Request request){long member;try{member=current.id(auth);}catch(HealthException e){throw new ResponseStatusException(HttpStatusCode.valueOf(e.status()),e.getMessage());}return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.recommend(member,request));}
 @ExceptionHandler(ResponseStatusException.class)
 public ResponseEntity<Map<String,Object>> problem(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore()).body(Map.of("message",e.getReason()==null?"추가 음식 추천을 완료하지 못했습니다.":e.getReason(),"terminal",true));}
}
