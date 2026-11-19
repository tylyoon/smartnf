ALTER TABLE food_plan_entries ADD COLUMN plan_scope VARCHAR(12) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE food_plan_entries ADD COLUMN management_codes VARCHAR(80) NOT NULL DEFAULT '';
INSERT INTO consent_documents(consent_type,version,required,document_path,effective_at)
VALUES('FOOD_PLAN','dev-plan-20261104',FALSE,'/mypage/plans/document','2026-11-04 00:00:00');
