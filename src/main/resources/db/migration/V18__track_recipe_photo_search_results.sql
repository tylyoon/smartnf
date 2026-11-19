ALTER TABLE recipe_photo_candidates
    ADD COLUMN search_status VARCHAR(24),
    ADD COLUMN search_term VARCHAR(100);
