package com.onrender.smartnf.health;
import java.time.LocalDate;import java.util.UUID;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import static com.onrender.smartnf.health.ShoppingListModels.*;
@RestController @RequestMapping("/api/me/shopping-lists") public class ShoppingListController {
 private final CurrentHealthMember current;private final ShoppingListService lists;public ShoppingListController(CurrentHealthMember current,ShoppingListService lists){this.current=current;this.lists=lists;}
 @GetMapping public Range range(Authentication a,@RequestParam LocalDate from,@RequestParam LocalDate to){return lists.range(current.id(a),from,to);}
 @GetMapping("/counts") public java.util.List<DayCount> counts(Authentication a,@RequestParam LocalDate from,@RequestParam LocalDate to){return lists.counts(current.id(a),from,to);}
 @GetMapping("/{id}") public Saved get(Authentication a,@PathVariable UUID id){return lists.get(current.id(a),id);}
 @PostMapping public Saved save(Authentication a,@RequestBody Save body){return lists.save(current.id(a),body);}
 @PostMapping("/{id}/delete") public Saved delete(Authentication a,@PathVariable UUID id,@RequestBody Delete body){return lists.delete(current.id(a),id,body);}
}
