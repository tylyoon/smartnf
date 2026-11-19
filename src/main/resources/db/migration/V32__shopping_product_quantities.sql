ALTER TABLE shopping_product_choices MODIFY COLUMN pack_grams DECIMAL(14,3) NULL;
ALTER TABLE shopping_product_choices ADD COLUMN quantity_unit VARCHAR(4) NOT NULL DEFAULT 'g';
ALTER TABLE shopping_product_choices ADD COLUMN required_amount DECIMAL(14,3) NULL;
ALTER TABLE shopping_product_choices ADD COLUMN package_amount DECIMAL(14,3) NULL;
UPDATE shopping_product_choices SET required_amount=required_grams,package_amount=pack_grams WHERE required_amount IS NULL;
