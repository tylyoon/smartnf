package com.onrender.smartnf.web;
import com.onrender.smartnf.health.CurrentHealthMember;
import com.onrender.smartnf.health.HealthException;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
public class MyRecipeContentController {
 private final CurrentHealthMember current;private final MyRecipeService recipes;
 public MyRecipeContentController(CurrentHealthMember current,MyRecipeService recipes){this.current=current;this.recipes=recipes;}
 public record Edit(long revision,MyRecipeService.Snapshot recipe){}
 @PostMapping("/api/me/recipes/{number}/content")
 public ResponseEntity<MyRecipeService.Saved> edit(Authentication auth,@PathVariable("number")long number,@RequestBody Edit input){
  long member;try{member=current.id(auth);}catch(HealthException e){throw new ResponseStatusException(HttpStatusCode.valueOf(e.status()),e.getMessage());}
  if(input==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
  return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(recipes.update(member,number,input.revision(),input.recipe()));
 }
}
