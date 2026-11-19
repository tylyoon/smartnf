CREATE TABLE food_plan_simulations (
 day_id BIGINT NOT NULL,
 entry_no INT NOT NULL,
 snapshot_data LONGTEXT NOT NULL,
 PRIMARY KEY(day_id,entry_no),
 CONSTRAINT fk_simulator_plan_entry FOREIGN KEY(day_id,entry_no)
 REFERENCES food_plan_entries(day_id,entry_no) ON DELETE CASCADE
);
