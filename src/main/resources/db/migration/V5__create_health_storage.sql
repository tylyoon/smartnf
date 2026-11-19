-- New health storage only. V1-V4 remain unchanged.
CREATE TABLE health_profile_versions (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL,
 schema_version INT NOT NULL,
 request_id VARCHAR(36) NOT NULL,
 body_hash CHAR(64) NOT NULL,
 consent_document_id BIGINT NOT NULL,
 consent_event_id BIGINT NOT NULL,
 created_at DATETIME(6) NOT NULL,
 age INT NULL,
 sex VARCHAR(40) NULL,
 reference_context VARCHAR(40) NULL,
 measured DATE NULL,
 glucose_method VARCHAR(40) NULL,
 fasting VARCHAR(40) NULL,
 post_type VARCHAR(40) NULL,
 post_hours DECIMAL(12,3) NULL,
 bp_context VARCHAR(40) NULL,
 steps INT NULL,
 active_minutes INT NULL,
 sleep_hours DECIMAL(12,3) NULL,
 smoking VARCHAR(40) NULL,
 drinking_days INT NULL,
 lab_measured DATE NULL,
 lab_source VARCHAR(120) NULL,
 goal VARCHAR(40) NULL,
 medication VARCHAR(40) NULL,
 restriction TEXT NULL,
 activity VARCHAR(40) NULL,
 exercise_limit VARCHAR(40) NULL,
 weight_goal VARCHAR(40) NULL,
 target_weight DECIMAL(12,3) NULL,
 goal_start DATE NULL,
 goal_end DATE NULL,
 goal_reviewed VARCHAR(40) NULL,
 weight_notes TEXT NULL,
 breakfast TINYINT NULL,
 vegetables TINYINT NULL,
 sugary TINYINT NULL,
 late TINYINT NULL,
 regular VARCHAR(40) NULL,
 CONSTRAINT uq_health_request UNIQUE(member_id,request_id),
 CONSTRAINT uq_health_owner UNIQUE(id,member_id),
 INDEX ix_health_member(member_id,id),
 CONSTRAINT fk_health_member FOREIGN KEY(member_id) REFERENCES members(id),
 CONSTRAINT fk_health_document FOREIGN KEY(consent_document_id) REFERENCES consent_documents(id),
 CONSTRAINT fk_health_consent_event FOREIGN KEY(consent_event_id) REFERENCES member_consents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_profile_conditions (
 profile_id BIGINT NOT NULL,
 condition_code VARCHAR(30) NOT NULL,
 diagnosed_year SMALLINT NULL, diagnosed_month TINYINT NULL,
 visit_date DATE NULL, management_status VARCHAR(40) NULL, lab_date DATE NULL,
 lab_notes TEXT NULL, care_notes TEXT NULL, symptom_notes TEXT NULL,
 PRIMARY KEY(profile_id,condition_code),
 CONSTRAINT fk_health_condition_profile FOREIGN KEY(profile_id) REFERENCES health_profile_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_measurements (
 profile_id BIGINT NOT NULL, metric_code VARCHAR(40) NOT NULL,
 metric_value DECIMAL(12,3) NOT NULL, unit_code VARCHAR(30) NOT NULL,
 PRIMARY KEY(profile_id,metric_code),
 CONSTRAINT fk_health_measurement_profile FOREIGN KEY(profile_id) REFERENCES health_profile_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE care_actions (
 code VARCHAR(30) NOT NULL PRIMARY KEY, title VARCHAR(120) NOT NULL, catalog_version VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE evaluation_scopes (
 code VARCHAR(20) NOT NULL PRIMARY KEY, title VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE care_action_scopes (
 action_code VARCHAR(30) NOT NULL, scope_code VARCHAR(20) NOT NULL,
 PRIMARY KEY(action_code,scope_code),
 CONSTRAINT fk_care_allowed_action FOREIGN KEY(action_code) REFERENCES care_actions(code),
 CONSTRAINT fk_care_allowed_scope FOREIGN KEY(scope_code) REFERENCES evaluation_scopes(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE member_care_sets (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL,
 profile_id BIGINT NULL, request_id VARCHAR(36) NOT NULL, body_hash CHAR(64) NOT NULL,
 consent_event_id BIGINT NOT NULL, catalog_version VARCHAR(30) NOT NULL, confirmed_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_member_care_request UNIQUE(member_id,request_id),
 INDEX ix_member_care_latest(member_id,id),
 CONSTRAINT fk_member_care_owner FOREIGN KEY(member_id) REFERENCES members(id),
 CONSTRAINT fk_member_care_profile_owner FOREIGN KEY(profile_id,member_id) REFERENCES health_profile_versions(id,member_id),
 CONSTRAINT fk_member_care_consent FOREIGN KEY(consent_event_id) REFERENCES member_consents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE member_care_items (
 set_id BIGINT NOT NULL, action_code VARCHAR(30) NOT NULL,
 PRIMARY KEY(set_id,action_code),
 CONSTRAINT fk_care_item_set FOREIGN KEY(set_id) REFERENCES member_care_sets(id),
 CONSTRAINT fk_care_item_action FOREIGN KEY(action_code) REFERENCES care_actions(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE member_care_item_scopes (
 set_id BIGINT NOT NULL, action_code VARCHAR(30) NOT NULL, scope_code VARCHAR(20) NOT NULL,
 PRIMARY KEY(set_id,action_code,scope_code),
 CONSTRAINT fk_care_selected_item FOREIGN KEY(set_id,action_code) REFERENCES member_care_items(set_id,action_code),
 CONSTRAINT fk_care_selected_allowed FOREIGN KEY(action_code,scope_code) REFERENCES care_action_scopes(action_code,scope_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at) VALUES
 ('HEALTH_DATA','dev-health-20261028',TRUE,'/mypage/consent/document','2026-10-28 00:00:00');
INSERT INTO care_actions(code,title,catalog_version) VALUES
 ('salt','짜게 먹는 습관 줄이기','care-20261028'),
 ('balanced','균형 잡힌 식사 실천하기','care-20261028'),
 ('movement','걷기 등 신체활동 실천하기','care-20261028'),
 ('weightcare','적정 체중 관리하기','care-20261028'),
 ('alcohol','음주 줄이기·피하기','care-20261028'),
 ('smoking','금연 실천하기','care-20261028'),
 ('regular','규칙적인 식사 실천하기','care-20261028'),
 ('sugar','단 음료·첨가당 줄이기','care-20261028'),
 ('fat','포화지방 줄이고 지방 종류 살펴보기','care-20261028'),
 ('late','야식·늦은 과식 줄이기','care-20261028');
INSERT INTO evaluation_scopes(code,title) VALUES
 ('bmi','BMI·체중'),
 ('bp','혈압'),
 ('glucose','혈당'),
 ('lipid','혈중 지질'),
 ('habits','식습관'),
 ('activity','활동·개인 조건');
INSERT INTO care_action_scopes(action_code,scope_code) VALUES
 ('weightcare','bmi'),
 ('balanced','bmi'),
 ('regular','bmi'),
 ('sugar','bmi'),
 ('movement','bmi'),
 ('salt','bp'),
 ('balanced','bp'),
 ('movement','bp'),
 ('weightcare','bp'),
 ('alcohol','bp'),
 ('smoking','bp'),
 ('regular','glucose'),
 ('sugar','glucose'),
 ('balanced','glucose'),
 ('movement','glucose'),
 ('weightcare','glucose'),
 ('fat','lipid'),
 ('sugar','lipid'),
 ('balanced','lipid'),
 ('movement','lipid'),
 ('weightcare','lipid'),
 ('alcohol','lipid'),
 ('regular','habits'),
 ('balanced','habits'),
 ('sugar','habits'),
 ('salt','habits'),
 ('late','habits'),
 ('movement','activity'),
 ('balanced','activity'),
 ('weightcare','activity'),
 ('alcohol','activity'),
 ('smoking','activity');
