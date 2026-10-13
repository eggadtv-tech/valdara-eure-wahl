# VALDARA Frontend v36 – Avatar-Auswahl

- Avatar-Auswahl speichert in `public.characters`.
- Bestehender Charakter wird aktualisiert; ansonsten wird der erste Datensatz für den angemeldeten Benutzer angelegt.
- Aktuell ausgewählte Variante wird markiert.
- Nur aktive Varianten des gewählten Volkes werden angezeigt.
- Kein Geschlechtsfeld; bestehendes Layout und Volk-Farbthemen bleiben erhalten.

Wichtig: Laut bisheriger Datenbankprüfung existieren noch keine aktiven Zeilen in `public.avatar_variants`. Daher werden zunächst keine auswählbaren Varianten erscheinen. Vor dem Speichern `AVATAR_SETUP_v36.sql` im Supabase SQL Editor ausführen und anschließend Varianten samt Bild-URLs anlegen. Das SQL wurde nicht automatisch in Supabase ausgeführt.
