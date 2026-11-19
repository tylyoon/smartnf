CREATE TABLE recipe_photo_candidates (
    dish_key VARCHAR(100) PRIMARY KEY,
    dish_name VARCHAR(100) NOT NULL,
    checked_at TIMESTAMP NOT NULL,
    image_url VARCHAR(1000),
    source_url VARCHAR(1000),
    author VARCHAR(200),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    rejected BOOLEAN NOT NULL DEFAULT FALSE
);
