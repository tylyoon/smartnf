-- Preserve membership keys: taste/prediction foreign keys remain unchanged.
CREATE TABLE recipe_library (
 recipe_id CHAR(64) NOT NULL PRIMARY KEY,
 recipe_data LONGTEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE my_recipes ADD COLUMN recipe_id CHAR(64) NULL;
ALTER TABLE my_recipes ADD COLUMN recipe_overrides LONGTEXT NULL;
ALTER TABLE my_recipes ADD COLUMN content_revision BIGINT NOT NULL DEFAULT 1;
INSERT INTO recipe_library(recipe_id,recipe_data)
 SELECT DISTINCT SHA2(recipe_data,256),recipe_data FROM my_recipes;
UPDATE my_recipes SET recipe_id=SHA2(recipe_data,256);
ALTER TABLE my_recipes MODIFY COLUMN recipe_id CHAR(64) NOT NULL;
ALTER TABLE my_recipes ADD CONSTRAINT fk_my_recipe_library FOREIGN KEY(recipe_id) REFERENCES recipe_library(recipe_id);
CREATE TABLE my_recipe_save_requests (
 member_id BIGINT NOT NULL,
 request_key VARCHAR(36) NOT NULL,
 recipe_number BIGINT NOT NULL,
 request_hash CHAR(64) NOT NULL,
 PRIMARY KEY(member_id,request_key),
 CONSTRAINT fk_recipe_save_owner FOREIGN KEY(member_id,recipe_number)
 REFERENCES my_recipes(member_id,recipe_number) ON DELETE CASCADE
);
INSERT INTO my_recipe_save_requests(member_id,request_key,recipe_number,request_hash)
 SELECT member_id,save_key,recipe_number,recipe_id FROM my_recipes;
-- Shared copies and all membership references now exist, with enforced FK/NOT NULL.
ALTER TABLE my_recipes DROP COLUMN recipe_data;
