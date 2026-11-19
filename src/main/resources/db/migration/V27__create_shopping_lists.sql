CREATE TABLE shopping_lists (
 id CHAR(36) NOT NULL PRIMARY KEY,
 member_id BIGINT NOT NULL,
 revision BIGINT NOT NULL,
 deleted BOOLEAN NOT NULL DEFAULT FALSE,
 shopping_date DATE NULL,
 source_from DATE NULL,
 source_to DATE NULL,
 source_kind VARCHAR(20) NOT NULL,
 last_request_id CHAR(36) NOT NULL,
 last_request_hash CHAR(64) NOT NULL,
 updated_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_shopping_list_member FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
 INDEX ix_shopping_list_date(member_id,shopping_date,deleted)
);
CREATE TABLE shopping_list_items (
 list_id CHAR(36) NOT NULL,
 entry_no INT NOT NULL,
 food_id VARCHAR(150) NOT NULL,
 food_name VARCHAR(200) NOT NULL,
 grams DECIMAL(18,3) NOT NULL,
 PRIMARY KEY(list_id,entry_no),
 CONSTRAINT fk_shopping_item_list FOREIGN KEY(list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
);
