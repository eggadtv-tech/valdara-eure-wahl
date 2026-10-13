-- VALDARA v37: Charaktergeschichte dauerhaft speichern
-- Einmal im Supabase SQL Editor ausführen. Bestehende Charaktere bleiben erhalten.
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS character_story text NOT NULL DEFAULT '';
