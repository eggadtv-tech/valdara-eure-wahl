-- VALDARA v36: sichere Avatar-Zuordnung für den eigenen Benutzer
-- Dieses Skript ersetzt die bisherige UPDATE-Regel und ergänzt INSERT.

DROP POLICY IF EXISTS users_can_create_own_character ON public.characters;
CREATE POLICY users_can_create_own_character
ON public.characters FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.people_id = characters.people_id)
  AND EXISTS (SELECT 1 FROM public.avatar_variants av WHERE av.id = characters.avatar_variant_id AND av.people_id = characters.people_id AND av.is_active = true)
);

DROP POLICY IF EXISTS users_can_update_own_character ON public.characters;
CREATE POLICY users_can_update_own_character
ON public.characters FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.people_id = characters.people_id)
  AND EXISTS (SELECT 1 FROM public.avatar_variants av WHERE av.id = characters.avatar_variant_id AND av.people_id = characters.people_id AND av.is_active = true)
);
