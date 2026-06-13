-- 004_free_text_recipes.sql
-- Permite borradores (content_hash nulo) y almacena ingredientes en texto libre.

ALTER TABLE recipes ALTER COLUMN content_hash DROP NOT NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS free_ingredients TEXT[] NOT NULL DEFAULT '{}';
