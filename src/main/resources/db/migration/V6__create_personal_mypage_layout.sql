-- Layout metadata only: no prompt, diagnosis, measurements or generated executable code.
CREATE TABLE member_mypage_layouts (
 member_id BIGINT NOT NULL PRIMARY KEY,
 revision BIGINT NOT NULL,
 widget_ids VARCHAR(240) NOT NULL,
 updated_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_mypage_layout_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
