CREATE TABLE members (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 display_name VARCHAR(50) NOT NULL,
 status VARCHAR(20) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE local_credentials (
 member_id BIGINT NOT NULL PRIMARY KEY,
 login_email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 password_changed_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_local_email UNIQUE (login_email),
 CONSTRAINT fk_local_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE social_accounts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL,
 provider VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 provider_user_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 created_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_social_identity UNIQUE (provider, provider_user_id),
 INDEX ix_social_member (member_id),
 CONSTRAINT fk_social_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE member_roles (
 member_id BIGINT NOT NULL,
 role VARCHAR(20) NOT NULL,
 granted_at DATETIME(6) NOT NULL,
 PRIMARY KEY (member_id, role),
 CONSTRAINT fk_role_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE consent_documents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 consent_type VARCHAR(40) NOT NULL,
 version VARCHAR(30) NOT NULL,
 required BOOLEAN NOT NULL,
 document_path VARCHAR(500) NOT NULL,
 effective_at DATETIME(6) NOT NULL,
 CONSTRAINT uq_consent_version UNIQUE (consent_type, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE member_consents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 member_id BIGINT NOT NULL,
 document_id BIGINT NOT NULL,
 decision VARCHAR(20) NOT NULL,
 recorded_at DATETIME(6) NOT NULL,
 INDEX ix_consent_member_document (member_id, document_id, recorded_at, id),
 CONSTRAINT fk_consent_member FOREIGN KEY (member_id) REFERENCES members(id),
 CONSTRAINT fk_consent_document FOREIGN KEY (document_id) REFERENCES consent_documents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Local development documents only; never health-data consent or production terms.
INSERT INTO consent_documents (consent_type, version, required, document_path, effective_at) VALUES
 ('TERMS','dev-20261028',TRUE,'/signup/documents/terms','2026-10-28 00:00:00'),
 ('PRIVACY','dev-20261028',TRUE,'/signup/documents/privacy','2026-10-28 00:00:00');
