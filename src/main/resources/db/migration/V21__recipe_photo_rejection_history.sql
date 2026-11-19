CREATE TABLE recipe_photo_rejections (
    dish_key VARCHAR(100) NOT NULL,
    image_hash CHAR(64) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    source_url VARCHAR(1000),
    rejected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dish_key, image_hash)
);
INSERT IGNORE INTO recipe_photo_rejections (dish_key, image_hash, image_url, source_url)
SELECT dish_key, SHA2(image_url, 256), image_url, source_url FROM recipe_photo_candidates
WHERE rejected = TRUE AND approved = FALSE AND image_url IS NOT NULL;
UPDATE recipe_photo_candidates SET rejected = FALSE, image_url = NULL, source_url = NULL, author = NULL,
    photo_title = '', search_status = 'READY', search_details = '이전 제외 사진 보존 · 다른 후보 검색 대기'
WHERE rejected = TRUE AND approved = FALSE AND image_url IS NOT NULL
  AND (search_status IS NULL OR search_status <> 'EXCLUDED');
-- New search rules get one early pass. Keep approved candidates and explicit search exclusions.
UPDATE recipe_photo_candidates SET search_status = 'READY'
WHERE approved = FALSE AND rejected = FALSE AND image_url IS NULL
  AND (search_status IS NULL OR search_status NOT IN ('EXCLUDED', 'SEARCHING'));
