CREATE TABLE health_meal_days (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL, record_date DATE NOT NULL, revision BIGINT NOT NULL,
 deleted BOOLEAN NOT NULL DEFAULT FALSE, consent_event_id BIGINT NOT NULL,
 updated_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_meal_member_date UNIQUE(member_id,record_date),
 CONSTRAINT fk_meal_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_meal_items (
 day_id BIGINT NOT NULL, position_no INT NOT NULL, meal VARCHAR(12) NOT NULL,
 food_id VARCHAR(100) NULL, food_name VARCHAR(120) NOT NULL, grams DECIMAL(6,1) NOT NULL,
 meal_time VARCHAR(5) NOT NULL, note VARCHAR(500) NOT NULL,
 source_version VARCHAR(100) NOT NULL, source_name VARCHAR(200) NOT NULL,
 energy DECIMAL(14,5) NULL, protein DECIMAL(14,5) NULL, carbohydrate DECIMAL(14,5) NULL,
 fat DECIMAL(14,5) NULL, sodium DECIMAL(14,5) NULL, sugars DECIMAL(14,5) NULL,
 fiber DECIMAL(14,5) NULL, saturated_fat DECIMAL(14,5) NULL,
 PRIMARY KEY(day_id,position_no),
 CONSTRAINT fk_meal_item_day FOREIGN KEY(day_id) REFERENCES health_meal_days(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_meal_requests (
 member_id BIGINT NOT NULL, request_id VARCHAR(36) NOT NULL, record_date DATE NOT NULL,
 operation VARCHAR(10) NOT NULL, result_revision BIGINT NOT NULL, payload_hash CHAR(64) NOT NULL,
 PRIMARY KEY(member_id,request_id),
 CONSTRAINT fk_meal_request_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at)
VALUES ('HEALTH_DATA','dev-health-20261102-meals',FALSE,'/mypage/consent/document','2026-11-02 00:00:00');
