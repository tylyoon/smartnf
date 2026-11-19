ALTER TABLE health_daily_records
 ADD COLUMN step_count INT NULL,
 ADD COLUMN walking_minutes INT NULL,
 ADD COLUMN fasting_glucose INT NULL,
 ADD COLUMN waist DECIMAL(5,1) NULL,
 ADD COLUMN sleep_hours DECIMAL(3,1) NULL;

CREATE TABLE health_tracking_selection (
 member_id BIGINT NOT NULL PRIMARY KEY,
 revision BIGINT NOT NULL,
 tracking_keys VARCHAR(500) NOT NULL,
 CONSTRAINT fk_tracking_selection_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
