ALTER TABLE recipe_library ADD COLUMN period_kind VARCHAR(12) NULL;

CREATE TABLE gemini_period_requests (
 member_id BIGINT NOT NULL,
 request_key CHAR(36) NOT NULL,
 request_hash CHAR(64) NOT NULL,
 status VARCHAR(12) NOT NULL,
 response_data MEDIUMTEXT NULL,
 error_status INT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(member_id,request_key),
 INDEX idx_gemini_period_created(created_at),
 CONSTRAINT fk_gemini_period_member FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
);
