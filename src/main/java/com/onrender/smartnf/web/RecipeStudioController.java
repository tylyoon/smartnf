package com.onrender.smartnf.web;

import com.onrender.smartnf.health.CurrentHealthMember;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RecipeStudioController {
    private final CurrentHealthMember current;
    private final MyRecipeService recipes;

    public RecipeStudioController(CurrentHealthMember current, MyRecipeService recipes) {
        this.current = current;
        this.recipes = recipes;
    }

    @GetMapping("/api/me/recipes/library")
    public ResponseEntity<List<MyRecipeService.Snapshot>> library(Authentication authentication) {
        var saved = recipes.list(current.id(authentication)).stream().limit(100)
                .map(MyRecipeService.Saved::recipe).toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(saved);
    }
}
