package com.onrender.smartnf.web;
import com.onrender.smartnf.health.CurrentHealthMember;
import com.onrender.smartnf.health.HealthException;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
public class GeminiPeriodController {
 private final CurrentHealthMember current;private final GeminiPeriodService service;private final RecipePreferenceService preferences;
 public GeminiPeriodController(CurrentHealthMember current,GeminiPeriodService service,RecipePreferenceService preferences){this.current=current;this.service=service;this.preferences=preferences;}
 @PostMapping(value="/api/me/meal-period/generate",consumes=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<GeminiPeriodService.Result> generate(Authentication auth,@RequestBody GeminiPeriodService.Request request){
  long member;try{member=current.id(auth);}catch(HealthException e){throw new ResponseStatusException(HttpStatusCode.valueOf(e.status()),e.getMessage());}
  GeminiPeriodService.validateRequest(request);
  var taste=request.usePreferences()?preferences.read(auth).targets():Map.<String,Double>of();
  return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.generate(member,request,taste));
 }
 @ExceptionHandler(ResponseStatusException.class)
 public ResponseEntity<Map<String,Object>> problem(ResponseStatusException e){
  return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore()).body(Map.of("message",e.getReason()==null?"식단 요청을 처리하지 못했습니다.":e.getReason(),"terminal",e.getStatusCode().value()!=409));
 }

}
