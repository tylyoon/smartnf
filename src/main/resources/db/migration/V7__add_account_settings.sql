ALTER TABLE members ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0;
CREATE TABLE member_account_security (
 member_id BIGINT NOT NULL PRIMARY KEY,
 failed_count INT NOT NULL DEFAULT 0,
 window_start DATETIME(6) NOT NULL,
 CONSTRAINT fk_account_security_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE member_email_changes (
 member_id BIGINT NOT NULL PRIMARY KEY,
 proposed_email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 old_code_hash CHAR(64) NOT NULL,
 new_code_hash CHAR(64) NOT NULL,
 auth_version BIGINT NOT NULL,
 created_at DATETIME(6) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 failed_count INT NOT NULL DEFAULT 0,
 CONSTRAINT fk_email_change_member FOREIGN KEY(member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
