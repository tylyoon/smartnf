package com.onrender.smartnf.health;
import java.util.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/me/product-collection-jobs")
public class ProductCollectionController {
 private final CurrentHealthMember current;private final ProductCollectionJobs jobs;
 public ProductCollectionController(CurrentHealthMember current,ProductCollectionJobs jobs){this.current=current;this.jobs=jobs;}
 @PostMapping public ResponseEntity<ProductCollectionJobs.View> start(Authentication a,@RequestBody ProductCollectionJobs.Start s){return reply(jobs.start(current.id(a),s));}
 @GetMapping("/current") public ResponseEntity<Map<String,ProductCollectionJobs.View>> current(Authentication a){return reply(Collections.singletonMap("job",jobs.current(current.id(a))));}
 @GetMapping("/{id}") public ResponseEntity<ProductCollectionJobs.View> get(Authentication a,@PathVariable UUID id){return reply(jobs.get(current.id(a),id));}
 private static <T> ResponseEntity<T> reply(T body){return ResponseEntity.ok().header("Cache-Control","no-store").body(body);}
}
