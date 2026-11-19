package com.onrender.smartnf.web;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class IngredientMatchCatalogTests {
    @Test void clearIngredientsUseValidatedReferences() throws Exception {
        var catalog = new IngredientMatchCatalog();
        var onion = catalog.candidates("양파").getFirst();
        assertEquals("양파, 생것", onion.name());
        assertTrue(catalog.canApply("양파", onion));
        var water = catalog.candidates("물").getFirst();
        assertEquals("생수", water.name());
        assertTrue(catalog.canApply("물", water));
        assertNull(catalog.offered("양파", water.id()));
    }
    @Test void modelCannotResolveUnspecifiedKindsOnItsOwn() throws Exception {
        var catalog = new IngredientMatchCatalog();
        for (String name : new String[]{"돼지고기", "김치", "소금"}) {
            var choices = catalog.candidates(name);
            assertFalse(choices.isEmpty());
            assertTrue(choices.stream().noneMatch(food -> catalog.canApply(name, food)));
        }
        assertFalse(catalog.candidates("다진 마늘").isEmpty());
        assertTrue(catalog.candidates("없는재료_xyz").isEmpty());
    }
    @Test void leekMustNeverOfferACompleteDish() throws Exception {
        var catalog = new IngredientMatchCatalog();
        var candidates = catalog.candidates("대파");
        assertFalse(candidates.isEmpty());
        assertTrue(candidates.stream().allMatch(food -> food.name().equals("파, 대파, 생것")));
        assertTrue(catalog.canApply("대파", candidates.getFirst()));
        for (String name : new String[]{"양파", "돼지고기", "김치", "마늘", "대파"}) {
            assertTrue(catalog.candidates(name).stream().noneMatch(food ->
                    food.name().contains("꼬치구이") || food.name().contains("크로와상")));
        }
    }
}
