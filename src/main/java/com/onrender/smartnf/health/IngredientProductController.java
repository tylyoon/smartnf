package com.onrender.smartnf.health;
import java.util.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/me/ingredient-products") public class IngredientProductController {
 private final CurrentHealthMember current;private final IngredientProductService products;private final CollectedProductService collected;
 public IngredientProductController(CurrentHealthMember current,IngredientProductService products,CollectedProductService collected){this.current=current;this.products=products;this.collected=collected;}
 public ResponseEntity<IngredientProductService.Result> search(Authentication a,String query){return search(a,query,"KAKAO");}
 @GetMapping public ResponseEntity<IngredientProductService.Result> search(Authentication a,@RequestParam String query,@RequestParam(defaultValue="KAKAO") String provider){long member=current.id(a);var all=new ArrayList<>(collected.search(member,query));String message;
 try{var live=products.search(query,provider);all.addAll(KakaoProductSnapshots.issue(member,live.products()));message=live.message();}catch(HealthException e){if(e.status()<500&&e.status()!=429)throw e;message=provider+" 실시간 조회 실패·지연·접근 제한. 저장된 검토 상품만 표시합니다.";}
 return ResponseEntity.ok().header("Cache-Control","no-store").body(new IngredientProductService.Result("UNIFIED",List.copyOf(all),"사이트 조회·수집 검토 상품 통합 조회. "+message));}
}
