-- Preserve historical quantities; new records do not require or calculate a quantity.
ALTER TABLE health_meal_items MODIFY COLUMN grams DECIMAL(6,1) NULL;
ALTER TABLE health_meal_items ADD COLUMN ingredients_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE health_meal_ingredients (
 day_id BIGINT NOT NULL, position_no INT NOT NULL, ingredient_no INT NOT NULL,
 food_id VARCHAR(100) NOT NULL, food_name VARCHAR(120) NOT NULL,
 reference_kind VARCHAR(20) NOT NULL, source_version VARCHAR(100) NOT NULL, source_name VARCHAR(200) NOT NULL,
 energy DECIMAL(14,5) NULL, protein DECIMAL(14,5) NULL, carbohydrate DECIMAL(14,5) NULL,
 fat DECIMAL(14,5) NULL, sodium DECIMAL(14,5) NULL, sugars DECIMAL(14,5) NULL,
 fiber DECIMAL(14,5) NULL, saturated_fat DECIMAL(14,5) NULL,
 PRIMARY KEY(day_id,position_no,ingredient_no),
 CONSTRAINT fk_meal_ingredient_item FOREIGN KEY(day_id,position_no) REFERENCES health_meal_items(day_id,position_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Previous food selections are reference-only, never silently confirmed as a dish's ingredients.
INSERT INTO health_meal_ingredients(day_id,position_no,ingredient_no,food_id,food_name,reference_kind,source_version,source_name,energy,protein,carbohydrate,fat,sodium,sugars,fiber,saturated_fat)
SELECT day_id,position_no,0,food_id,food_name,'LEGACY_FOOD',source_version,source_name,energy,protein,carbohydrate,fat,sodium,sugars,fiber,saturated_fat
FROM health_meal_items WHERE food_id IS NOT NULL;

INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at) VALUES ('HEALTH_DATA','dev-health-20261102-refs',FALSE,'/mypage/consent/document','2026-11-02 00:00:00');
