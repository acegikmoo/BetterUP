-- Add migration script here
TRUNCATE TABLE website;
ALTER TABLE website ADD COLUMN user_id TEXT NOT NULL REFERENCES "user"(id);

