CREATE TABLE my_recipe_sequences (
    member_id BIGINT NOT NULL PRIMARY KEY,
    last_number BIGINT NOT NULL,
    CONSTRAINT fk_recipe_sequence_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE my_recipes (
    member_id BIGINT NOT NULL,
    recipe_number BIGINT NOT NULL,
    save_key VARCHAR(36) NOT NULL,
    recipe_data TEXT NOT NULL,
    PRIMARY KEY (member_id, recipe_number),
    CONSTRAINT uq_my_recipe_save UNIQUE (member_id, save_key),
    CONSTRAINT fk_recipe_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
