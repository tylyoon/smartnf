CREATE TABLE IF NOT EXISTS members (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 display_name VARCHAR(50) NOT NULL,
 status VARCHAR(20) NOT NULL,
 auth_version BIGINT NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL,
 updated_at DATETIME(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS local_credentials (
 member_id BIGINT NOT NULL PRIMARY KEY,
 login_email VARCHAR(254) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 password_changed_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_local_email UNIQUE (login_email),
 CONSTRAINT fk_local_member FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS social_accounts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL,
 provider VARCHAR(30) NOT NULL,
 provider_user_id VARCHAR(255) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_social_identity UNIQUE (provider, provider_user_id),
 CONSTRAINT fk_social_member FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS member_roles (
 member_id BIGINT NOT NULL,
 role VARCHAR(20) NOT NULL,
 granted_at DATETIME(6) NOT NULL,
 PRIMARY KEY (member_id, role),
 CONSTRAINT fk_role_member FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS consent_documents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 consent_type VARCHAR(40) NOT NULL,
 version VARCHAR(30) NOT NULL,
 required BOOLEAN NOT NULL,
 document_path VARCHAR(500) NOT NULL,
 effective_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_consent_version UNIQUE (consent_type, version)
);

CREATE TABLE IF NOT EXISTS member_consents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL,
 document_id BIGINT NOT NULL,
 decision VARCHAR(20) NOT NULL,
 recorded_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_consent_member FOREIGN KEY (member_id) REFERENCES members(id),
 CONSTRAINT fk_consent_document FOREIGN KEY (document_id) REFERENCES consent_documents(id)
);

MERGE INTO consent_documents (id, consent_type, version, required, document_path, effective_at) KEY(id) VALUES
(1,'TERMS','dev-20261028',TRUE,'/signup/documents/terms','2026-01-01 00:00:00'),
(2,'PRIVACY','dev-20261028',TRUE,'/signup/documents/privacy','2026-01-01 00:00:00');

MERGE INTO consent_documents (id, consent_type, version, required, document_path, effective_at) KEY(id) VALUES
(3,'TERMS','dev-kakao-20261028',TRUE,'/signup/documents/kakao-terms','2026-01-01 00:00:00'),
(4,'PRIVACY','dev-kakao-20261028',TRUE,'/signup/documents/kakao-privacy','2026-01-01 00:00:00');

MERGE INTO consent_documents (id, consent_type, version, required, document_path, effective_at) KEY(id) VALUES
(5,'TERMS','dev-naver-20261028',TRUE,'/signup/documents/naver-terms','2026-01-01 00:00:00'),
(6,'PRIVACY','dev-naver-20261028',TRUE,'/signup/documents/naver-privacy','2026-01-01 00:00:00');

MERGE INTO consent_documents (id,consent_type,version,required,document_path,effective_at) KEY(id) VALUES
(7,'TERMS','dev-google-20261028',TRUE,'/signup/documents/google-terms','2026-01-01 00:00:00'),
(8,'PRIVACY','dev-google-20261028',TRUE,'/signup/documents/google-privacy','2026-01-01 00:00:00');

CREATE TABLE IF NOT EXISTS member_account_security (
 member_id BIGINT PRIMARY KEY,failed_count INT NOT NULL DEFAULT 0,window_start TIMESTAMP NOT NULL,
 FOREIGN KEY(member_id) REFERENCES members(id)
);
CREATE TABLE IF NOT EXISTS member_email_changes (
 member_id BIGINT PRIMARY KEY,proposed_email VARCHAR(254) NOT NULL,
 old_code_hash CHAR(64) NOT NULL,new_code_hash CHAR(64) NOT NULL,auth_version BIGINT NOT NULL,
 created_at TIMESTAMP NOT NULL,expires_at TIMESTAMP NOT NULL,failed_count INT NOT NULL DEFAULT 0,
 FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS food_plan_days (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL,
 plan_date DATE NOT NULL, revision BIGINT NOT NULL, deleted BOOLEAN NOT NULL DEFAULT FALSE,
 consent_event_id BIGINT NOT NULL, updated_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_plan_member_date UNIQUE(member_id,plan_date),
 CONSTRAINT fk_plan_member FOREIGN KEY(member_id) REFERENCES members(id)
);
CREATE TABLE IF NOT EXISTS food_plan_entries (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, plan_type VARCHAR(12) NOT NULL, plan_scope VARCHAR(12) NOT NULL DEFAULT 'GENERAL', management_codes VARCHAR(80) NOT NULL DEFAULT '',
 restaurant VARCHAR(120) NOT NULL, visit_time VARCHAR(5) NOT NULL, note VARCHAR(500) NOT NULL,
 PRIMARY KEY(day_id,entry_no), CONSTRAINT fk_plan_entry_day FOREIGN KEY(day_id) REFERENCES food_plan_days(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS food_plan_foods (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, food_no INT NOT NULL,
 food_id VARCHAR(100) NOT NULL, food_kind VARCHAR(20) NOT NULL, food_name VARCHAR(500) NOT NULL,
 basis_label VARCHAR(200) NOT NULL, source_name VARCHAR(500) NOT NULL, source_version VARCHAR(100) NOT NULL,
 recipe_id VARCHAR(20) NOT NULL, recipe_name VARCHAR(500) NOT NULL, recipe_source VARCHAR(500) NOT NULL, recipe_version VARCHAR(100) NOT NULL,
 PRIMARY KEY(day_id,entry_no,food_no),
 CONSTRAINT fk_plan_food_entry FOREIGN KEY(day_id,entry_no) REFERENCES food_plan_entries(day_id,entry_no) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS food_plan_ingredients (
 day_id BIGINT NOT NULL, entry_no INT NOT NULL, food_no INT NOT NULL,
 token_no INT NOT NULL, raw_text TEXT NOT NULL, PRIMARY KEY(day_id,entry_no,food_no,token_no),
 CONSTRAINT fk_plan_ingredient_food FOREIGN KEY(day_id,entry_no,food_no) REFERENCES food_plan_foods(day_id,entry_no,food_no) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS food_plan_requests (
 member_id BIGINT NOT NULL, request_id VARCHAR(36) NOT NULL, plan_date DATE NOT NULL,
 operation VARCHAR(10) NOT NULL, payload_hash CHAR(64) NOT NULL, result_revision BIGINT NOT NULL,
 PRIMARY KEY(member_id,request_id),CONSTRAINT fk_plan_request_member FOREIGN KEY(member_id) REFERENCES members(id)
);

INSERT INTO consent_documents(id,consent_type,version,required,document_path,effective_at) SELECT 900000,'FOOD_PLAN','dev-plan-20261104',FALSE,'/mypage/plans/document','2026-11-03 00:00:00' WHERE NOT EXISTS(SELECT 1 FROM consent_documents WHERE consent_type='FOOD_PLAN' AND version='dev-plan-20261104');
