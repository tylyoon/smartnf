-- Existing recipe JSON remains unchanged. Composite ownership and cascading deletion.
CREATE TABLE my_recipe_taste (
 member_id BIGINT NOT NULL,
 recipe_number BIGINT NOT NULL,
 features_data TEXT NOT NULL,
 feedback_data TEXT NULL,
 revision BIGINT NOT NULL DEFAULT 1,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (member_id, recipe_number),
 CONSTRAINT fk_my_recipe_taste_recipe FOREIGN KEY (member_id, recipe_number)
 REFERENCES my_recipes(member_id, recipe_number) ON DELETE CASCADE
);
