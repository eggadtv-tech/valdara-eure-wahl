# Valdara Frontend v36 – Avatar-Auswahl

Aufbauend auf v35; kein Neubau.

- Avatar-Varianten werden weiterhin aus `public.avatar_variants` geladen.
- Angezeigt werden nur aktive Varianten des im Profil gespeicherten Volkes.
- Gespeicherte Auswahl aus `public.characters` wird markiert.
- Klick auf eine Variante speichert `people_id` und `avatar_variant_id` für den angemeldeten Nutzer.
- Bestehender Character wird aktualisiert; wenn noch keiner existiert, wird er über `user_id` angelegt.
- Fehler aus Supabase werden im Mitgliederbereich angezeigt.
- Kein SQL ist im ZIP enthalten. Datenbankänderungen/Einträge werden separat im Chat besprochen.

Wichtig: Die Bilder erscheinen erst, wenn sie im Supabase Storage liegen und passende aktive Datensätze in `avatar_variants` mit korrekter `people_id` und `image_url` vorhanden sind.
