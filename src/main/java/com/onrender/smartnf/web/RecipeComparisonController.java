package com.onrender.smartnf.web;

import com.onrender.smartnf.health.HealthException;
import com.onrender.smartnf.health.MealCatalog;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RecipeComparisonController {
    private static final String RICE_ID = "rda_10_4:A013000A039a";
    private static final List<String> NUTRIENTS = List.of("energy", "protein", "sodium");

    public record Portion(String foodId, BigDecimal grams) {}
    public record Request(Portion current, BigDecimal riceGrams, int servings, List<Portion> ingredients) {}
    public record Nutrient(String key, BigDecimal current, BigDecimal suggested, BigDecimal difference) {}
    private record Measured(MealCatalog.Food food, BigDecimal grams) {
        BigDecimal amount(String key) {
            BigDecimal value = food.nutrients().get(key);
            return value == null ? null : value.multiply(grams).movePointLeft(2);
        }
    }

    @PostMapping("/api/recipes/compare-nutrition")
    public ResponseEntity<List<Nutrient>> compare(@RequestBody Request input) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(calculate(input));
    }

    static List<Nutrient> calculate(Request input) {
        if (input == null || input.servings() < 1 || input.servings() > 24
                || input.ingredients() == null || input.ingredients().isEmpty()
                || input.ingredients().size() > 25) {
            throw invalid();
        }
        var current = measured(input.current(), 1, 5000);
        var rice = measured(new Portion(RICE_ID, input.riceGrams()), 0, 2000);
        var ingredients = input.ingredients().stream()
                .map(portion -> portion == null ? null : measured(portion, 0.01, 5000)).toList();

        var result = new ArrayList<Nutrient>();
        for (String key : NUTRIENTS) {
            BigDecimal side = rice.grams().signum() == 0 ? BigDecimal.ZERO : rice.amount(key);
            BigDecimal existing = add(current.amount(key), side);
            BigDecimal total = BigDecimal.ZERO;
            for (Measured ingredient : ingredients) {
                total = add(total, ingredient == null ? null : ingredient.amount(key));
            }
            BigDecimal suggested = total == null ? null : add(
                    total.divide(BigDecimal.valueOf(input.servings()), MathContext.DECIMAL128), side);
            result.add(new Nutrient(key, existing, suggested,
                    existing == null || suggested == null ? null : suggested.subtract(existing)));
        }
        return result;
    }

    private static Measured measured(Portion portion, double min, int max) {
        if (portion == null || portion.foodId() == null || portion.foodId().length() > 100
                || portion.grams() == null || portion.grams().scale() > 6 || portion.grams().scale() < -6
                || portion.grams().compareTo(BigDecimal.valueOf(min)) < 0
                || portion.grams().compareTo(BigDecimal.valueOf(max)) > 0) {
            throw invalid();
        }
        MealCatalog.Food food;
        try {
            food = MealCatalog.find(portion.foodId());
        } catch (HealthException ex) {
            throw invalid();
        }
        if (!food.basis().matches("100g(?: .*)?")) {
            throw invalid();
        }
        return new Measured(food, portion.grams());
    }

    private static BigDecimal add(BigDecimal first, BigDecimal second) {
        return first == null || second == null ? null : first.add(second);
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "비교할 식품과 분량을 확인해 주세요.");
    }
}
