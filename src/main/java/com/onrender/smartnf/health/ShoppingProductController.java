package com.onrender.smartnf.health;
import java.util.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/me/shopping-products") public class ShoppingProductController {
 private final CurrentHealthMember current;private final ShoppingProductService products;
 public ShoppingProductController(CurrentHealthMember current,ShoppingProductService products){this.current=current;this.products=products;}
 @GetMapping public ResponseEntity<List<ShoppingProductService.Choice>> get(Authentication a,@RequestParam UUID listId){return ResponseEntity.ok().header("Cache-Control","no-store").body(products.get(current.id(a),listId));}
 @PostMapping public ResponseEntity<ShoppingProductService.Choice> save(Authentication a,@RequestBody ShoppingProductService.Save body){return ResponseEntity.ok().header("Cache-Control","no-store").body(products.save(current.id(a),body));}
}
