CREATE TABLE food_plan_days (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL,
 plan_date DATE NOT NULL, revision BIGINT NOT NULL, deleted BOOLEAN NOT NULL DEFAULT FALSE,
 consent_event_id BIGINT NOT NULL, updated_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_plan_member_date UNIQUE(member_id,plan_date),
 CONSTRAINT fk_plan_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE food_plan_entries (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, plan_type VARCHAR(12) NOT NULL,
 restaurant VARCHAR(120) NOT NULL, visit_time VARCHAR(5) NOT NULL, note VARCHAR(500) NOT NULL,
 PRIMARY KEY(day_id,entry_no), CONSTRAINT fk_plan_entry_day FOREIGN KEY(day_id) REFERENCES food_plan_days(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE food_plan_foods (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, food_no INT NOT NULL,
 food_id VARCHAR(100) NOT NULL, food_kind VARCHAR(20) NOT NULL, food_name VARCHAR(500) NOT NULL,
 basis_label VARCHAR(200) NOT NULL, source_name VARCHAR(500) NOT NULL, source_version VARCHAR(100) NOT NULL,
 recipe_id VARCHAR(20) NOT NULL, recipe_name VARCHAR(500) NOT NULL, recipe_source VARCHAR(500) NOT NULL, recipe_version VARCHAR(100) NOT NULL,
 PRIMARY KEY(day_id,entry_no,food_no),
 CONSTRAINT fk_plan_food_entry FOREIGN KEY(day_id,entry_no) REFERENCES food_plan_entries(day_id,entry_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE food_plan_ingredients (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, food_no INT NOT NULL,
 token_no INT NOT NULL, raw_text TEXT NOT NULL, PRIMARY KEY(day_id,entry_no,food_no,token_no),
 CONSTRAINT fk_plan_ingredient_food FOREIGN KEY(day_id,entry_no,food_no) REFERENCES food_plan_foods(day_id,entry_no,food_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE food_plan_requests (
 member_id BIGINT NOT NULL, request_id VARCHAR(36) NOT NULL, plan_date DATE NOT NULL,
 operation VARCHAR(10) NOT NULL, payload_hash CHAR(64) NOT NULL, result_revision BIGINT NOT NULL,
 PRIMARY KEY(member_id,request_id),CONSTRAINT fk_plan_request_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at)
VALUES('FOOD_PLAN','dev-plan-20261103',FALSE,'/mypage/plans/document','2026-11-03 00:00:00');
