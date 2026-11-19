ALTER TABLE recipe_photo_candidates
    ADD COLUMN photo_license VARCHAR(80) NOT NULL DEFAULT 'CC0',
    ADD COLUMN photo_license_url VARCHAR(300) NOT NULL DEFAULT 'https://creativecommons.org/publicdomain/zero/1.0/',
    ADD COLUMN photo_provider VARCHAR(200) NOT NULL DEFAULT 'Wikimedia Commons';
-- Retry previous misses once after rollout; preserve exclusions, approvals and rejections.
UPDATE recipe_photo_candidates SET search_status = 'READY'
WHERE approved = FALSE AND rejected = FALSE AND image_url IS NULL
  AND (search_status IS NULL OR search_status NOT IN ('EXCLUDED', 'SEARCHING'));
