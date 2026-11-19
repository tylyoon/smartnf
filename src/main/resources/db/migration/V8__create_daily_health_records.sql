CREATE TABLE health_daily_records (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL, record_date DATE NOT NULL, revision BIGINT NOT NULL,
 deleted BOOLEAN NOT NULL DEFAULT FALSE, consent_event_id BIGINT NOT NULL,
 weight DECIMAL(5,1) NULL, sys INT NULL, dia INT NULL,
 bp_context VARCHAR(12) NOT NULL, bp_time VARCHAR(12) NOT NULL, weight_time VARCHAR(12) NOT NULL,
 day_note VARCHAR(1000) NOT NULL, updated_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_daily_member_date UNIQUE(member_id,record_date),
 CONSTRAINT fk_daily_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_daily_practices (
 daily_id BIGINT NOT NULL, action_id VARCHAR(30) NOT NULL, practice_status VARCHAR(20) NOT NULL,
 practice_note VARCHAR(500) NOT NULL,
 PRIMARY KEY(daily_id,action_id),
 CONSTRAINT fk_daily_practice_record FOREIGN KEY(daily_id) REFERENCES health_daily_records(id),
 CONSTRAINT fk_daily_practice_action FOREIGN KEY(action_id) REFERENCES care_actions(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE health_daily_requests (
 member_id BIGINT NOT NULL, request_id VARCHAR(36) NOT NULL, record_date DATE NOT NULL,
 operation VARCHAR(10) NOT NULL, result_revision BIGINT NOT NULL,
 PRIMARY KEY(member_id,request_id),
 CONSTRAINT fk_daily_request_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at)
VALUES ('HEALTH_DATA','dev-health-20261102',FALSE,'/mypage/consent/document','2026-11-02 00:00:00');
