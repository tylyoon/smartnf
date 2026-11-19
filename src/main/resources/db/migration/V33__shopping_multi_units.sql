-- Preserve existing gram rows; a missing nutrition mass is NULL, never fabricated.
ALTER TABLE shopping_list_items MODIFY COLUMN grams DECIMAL(14,3) NULL;
ALTER TABLE shopping_product_choices MODIFY COLUMN required_grams DECIMAL(14,3) NULL;
ALTER TABLE shopping_product_choices MODIFY COLUMN quantity_unit VARCHAR(8) NOT NULL DEFAULT 'g';
CREATE TABLE shopping_item_quantities (
 list_id CHAR(36) NOT NULL,
 entry_no INT NOT NULL,
 unit VARCHAR(8) NOT NULL,
 amount DECIMAL(14,3) NOT NULL,
 evidence VARCHAR(300) NOT NULL,
 PRIMARY KEY(list_id,entry_no,unit),
 CONSTRAINT fk_item_quantity_list FOREIGN KEY(list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
);
