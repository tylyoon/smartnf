package com.onrender.smartnf.health;
import java.math.BigDecimal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/me/price-reference")
public class PriceReferenceController {
 private final ScheduledPriceCatalog market;private final CurrentHealthMember current;private final PriceReferenceService prices;
 public PriceReferenceController(CurrentHealthMember current,PriceReferenceService prices){this.current=current;this.prices=prices;this.market=null;}
 @org.springframework.beans.factory.annotation.Autowired public PriceReferenceController(CurrentHealthMember current,PriceReferenceService prices,ScheduledPriceCatalog market){this.current=current;this.prices=prices;this.market=market;}
 @GetMapping("/status") public ResponseEntity<String> status(Authentication a){current.id(a);return ResponseEntity.ok().header("Cache-Control","no-store").contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(market==null?"{}":market.status());}
 public ResponseEntity<PriceReferenceService.Result> get(Authentication a,String query,BigDecimal grams){return get(a,query,grams,"g");}
 @GetMapping public ResponseEntity<PriceReferenceService.Result> get(Authentication a,@RequestParam String query,@RequestParam BigDecimal grams,@RequestParam(defaultValue="g") String unit){current.id(a);var r=prices.search(query,grams,unit);return ResponseEntity.ok().header("Cache-Control","no-store").body(new PriceReferenceService.Result(r.references(),r.message(),r.kamisAvailable(),r.sourceErrors(),market==null?java.util.List.of():market.search(query,grams,unit),r.searchName()));}
}
