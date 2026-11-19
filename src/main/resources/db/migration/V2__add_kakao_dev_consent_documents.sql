-- New versions: existing local-signup consent documents and V1 checksum stay unchanged.
INSERT INTO consent_documents (consent_type, version, required, document_path, effective_at) VALUES
 ('TERMS','dev-kakao-20261028',TRUE,'/signup/documents/kakao-terms','2026-10-28 00:00:00'),
 ('PRIVACY','dev-kakao-20261028',TRUE,'/signup/documents/kakao-privacy','2026-10-28 00:00:00');
