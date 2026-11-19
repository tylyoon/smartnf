CREATE TABLE collected_product_offers (
 member_id BIGINT NOT NULL,
 id CHAR(36) NOT NULL,
 source_type VARCHAR(10) NOT NULL,
 provider VARCHAR(50) NOT NULL,
 source_id VARCHAR(100) NOT NULL,
 product_name VARCHAR(300) NOT NULL,
 merchant VARCHAR(300) NOT NULL,
 pack_grams DECIMAL(13,3) NOT NULL,
 unit_price DECIMAL(13,2) NOT NULL,
 product_url VARCHAR(500) NOT NULL,
 checked_at VARCHAR(40) NOT NULL,
 valid_from CHAR(10) NOT NULL,
 valid_to CHAR(10) NOT NULL,
 price_kind VARCHAR(10) NOT NULL,
 conditions_text VARCHAR(1000) NOT NULL,
 branch VARCHAR(100) NOT NULL,
 evidence TEXT NOT NULL,
 PRIMARY KEY (member_id,id),
 CONSTRAINT fk_collected_offer_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

ALTER TABLE shopping_product_choices ADD COLUMN source_details VARCHAR(2000);
