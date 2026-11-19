CREATE TABLE my_recipe_prediction (
 member_id BIGINT NOT NULL,
 recipe_number BIGINT NOT NULL,
 prediction_data TEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (member_id,recipe_number),
 CONSTRAINT fk_my_recipe_prediction_recipe FOREIGN KEY(member_id,recipe_number)
 REFERENCES my_recipes(member_id,recipe_number) ON DELETE CASCADE
);
