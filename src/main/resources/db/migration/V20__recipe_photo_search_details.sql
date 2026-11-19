ALTER TABLE recipe_photo_candidates
    ADD COLUMN photo_title VARCHAR(300) NOT NULL DEFAULT '',
    ADD COLUMN search_details VARCHAR(2000);
