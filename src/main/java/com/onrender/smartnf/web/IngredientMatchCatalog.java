package com.onrender.smartnf.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;

/** Candidate retrieval and independent auto-application policy. No model-generated nutrients. */
public final class IngredientMatchCatalog {
    public record Food(String id, String name) {}
    private static final Set<String> INGREDIENT_GROUPS = Set.of(
            "곡류 및 그 제품", "감자류 및 전분류", "당류", "두류", "견과류 및 종실류", "채소류", "버섯류", "과일류",
            "육류 및 그 제품", "난류", "어패류 및 그 제품", "해조류", "우유 및 그 제품", "유지류", "음료류", "조미료류",
            "장류, 양념류", "김치류", "젓갈류", "장아찌·절임류", "조리가공식품류", "수·조·어·육류",
            "곡류, 서류 제품", "채소, 해조류", "두류, 견과 및 종실류");
    private final List<Food> foods;
    IngredientMatchCatalog() throws IOException {
        try (var stream = IngredientMatchCatalog.class.getResourceAsStream("/static/js/data/food-nutrition/meal-references.tsv")) {
            if (stream == null) throw new IOException("Nutrition catalog missing");
            foods = new String(stream.readAllBytes(), StandardCharsets.UTF_8).lines().map(line -> line.split("\t", -1))
                    .filter(row -> row.length >= 6 && row[4].matches("100g(?: .*)?") && INGREDIENT_GROUPS.contains(row[5]))
                    .map(row -> new Food(row[0], row[1])).toList();
        }
    }
    static String key(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
    }
    private static String alias(String name) {
        return switch (key(name)) {
            case "물" -> "생수";
            case "밥", "백미밥", "쌀밥" -> "멥쌀, 백미, 밥";
            case "배추김치" -> "김치, 배추 김치";
            case "대파" -> "파, 대파";
            case "부침가루" -> "밀, 부침가루";
            default -> name;
        };
    }
    private static String referenceName(String name) {
        return switch (key(name)) {
            case "김치" -> "김치, 배추 김치";
            case "밥", "백미밥", "쌀밥" -> "멥쌀, 백미, 밥";
            case "간장" -> "간장, 개량, 양조";
            case "부침가루" -> "밀, 부침가루";
            case "돼지고기" -> "돼지고기, 앞다리, 생것";
            case "소금" -> "소금, 정제염";
            case "다진마늘", "마늘" -> "마늘, 생것";
            default -> "";
        };
    }
    Food reference(String name) {
        String reference = referenceName(name);
        if (!reference.isEmpty()) return foods.stream().filter(food -> food.name().equals(reference)).findFirst().orElse(null);
        return candidates(name).stream().filter(food -> canApply(name, food)).findFirst().orElse(null);
    }
    List<Food> candidates(String name) {
        String query = key(alias(name)).replaceFirst("^(다진|잘게썬|썬|손질한)", "");
        if (query.isEmpty()) return List.of();
        final String search = query;
        return foods.stream().filter(food -> key(food.name()).startsWith(search))
                .sorted(Comparator.comparingInt((Food food) -> food.name().equals(referenceName(name)) ? -1 : score(food, search)).thenComparing(Food::name))
                .limit(8).toList();
    }
    private static int score(Food food, String query) {
        String name = key(food.name());
        if (name.equals(query)) return 0;
        if (name.equals(query + "생것")) return 1;
        return name.endsWith("생것") ? 2 : 3;
    }
    boolean canApply(String name, Food food) {
        String query = key(alias(name));
        String target = key(food.name());
        if (target.equals(query)) return true;
        // Recipe ingredient weights are treated as raw input weights only for these plain vegetables.
        return Set.of("양파", "당근", "대파", "애호박", "오이", "감자", "고구마").contains(key(name))
                && target.equals(query + "생것");
    }
    Food offered(String name, String id) {
        return candidates(name).stream().filter(food -> food.id().equals(id)).findFirst().orElse(null);
    }
}
