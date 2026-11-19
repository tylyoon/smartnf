package com.onrender.smartnf.web;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class RecipePreferenceController {
    private final RecipePreferenceService preferences;
    public RecipePreferenceController(RecipePreferenceService preferences){this.preferences=preferences;}
    @GetMapping("/api/me/recipes/preferences")
    public ResponseEntity<RecipePreferenceService.Preference> read(Authentication auth){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(preferences.read(auth));}
}
