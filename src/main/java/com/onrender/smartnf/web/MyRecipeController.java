package com.onrender.smartnf.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.onrender.smartnf.health.CurrentHealthMember;
import com.onrender.smartnf.health.HealthException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class MyRecipeController {
    private final CurrentHealthMember current;
    private final MyRecipeService recipes;
    private final RecipePhotoController photos;

    public MyRecipeController(CurrentHealthMember current, MyRecipeService recipes, RecipePhotoController photos) {
        this.current = current;
        this.recipes = recipes;
        this.photos = photos;
    }

    @GetMapping("/mypage/recipes")
    public String page(Authentication authentication, Model model, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        var saved = recipes.list(member(authentication));
        model.addAttribute("recipes", saved);
        model.addAttribute("approvedPhotos", photos.approvedPhotos(
                saved.stream().map(item -> item.recipe().name()).toList()));
        return "health/my-recipes";
    }

    @PostMapping("/api/me/recipes")
    @ResponseBody
    public ResponseEntity<Map<String, Long>> save(Authentication authentication, @RequestBody Save request) {
        long number = recipes.save(member(authentication), request.key(), request.recipe());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("number", number));
    }

    @PostMapping("/api/me/recipes/batch")
    @ResponseBody
    public ResponseEntity<Map<String, List<Long>>> saveBatch(Authentication authentication, @RequestBody BatchSave request) {
        var numbers = recipes.saveAll(member(authentication), request.items());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("numbers", numbers));
    }

    @PostMapping("/mypage/recipes/{number}/delete")
    public String delete(Authentication authentication, @PathVariable("number") long number,
            RedirectAttributes redirect) {
        boolean deleted = recipes.delete(member(authentication), number);
        redirect.addFlashAttribute("recipeDeleteMessage",
                deleted ? "저장한 레시피를 삭제했습니다." : "삭제할 레시피를 찾을 수 없습니다.");
        return "redirect:/mypage/recipes";
    }

    private long member(Authentication authentication) {
        try {
            return current.id(authentication);
        } catch (HealthException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(e.status()), e.getMessage());
        }
    }

    public record BatchSave(List<MyRecipeService.SaveItem> items) {}

    public record Save(UUID key, MyRecipeService.Snapshot recipe) {}
}
