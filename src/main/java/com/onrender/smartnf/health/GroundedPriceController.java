package com.onrender.smartnf.health;
import org.springframework.web.bind.annotation.*;import org.springframework.http.*;import org.springframework.security.core.Authentication;
@RestController @RequestMapping("/api/me/price-grounding") public class GroundedPriceController{
 private final CurrentHealthMember current;private final GroundedPriceSearch search;public GroundedPriceController(CurrentHealthMember current,GroundedPriceSearch search){this.current=current;this.search=search;}
 public record Request(String query){}
 @PostMapping public ResponseEntity<String> get(Authentication a,@RequestBody Request request){current.id(a);if(request==null)throw HealthException.invalid();return ResponseEntity.ok().header("Cache-Control","no-store").contentType(MediaType.APPLICATION_JSON).body(search.search(request.query()));}
}
