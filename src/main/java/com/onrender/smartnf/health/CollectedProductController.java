package com.onrender.smartnf.health;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/me/collected-products")
public class CollectedProductController {
 private final CurrentHealthMember current;private final CollectedProductService offers;
 public CollectedProductController(CurrentHealthMember current,CollectedProductService offers){this.current=current;this.offers=offers;}
 @PostMapping public ResponseEntity<Map<String,Object>> save(Authentication a,@RequestBody List<CollectedProductService.Offer> body){return ResponseEntity.ok().header("Cache-Control","no-store").body(Map.of("saved",offers.save(current.id(a),body),"message","검토한 상품을 본인 가격 비교에 반영했습니다."));}
}
