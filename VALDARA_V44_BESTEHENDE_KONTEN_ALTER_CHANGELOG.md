# Valdara v44 – Geburtsdatum für bestehende Konten

- Basierend auf dem hochgeladenen v43-Paket.
- Mitglieder ohne `profiles.birth_date` erhalten im Mitgliederbereich eine verpflichtende, private Geburtsdatum-Abfrage.
- Geburtsdatum wird in `profiles.birth_date` gespeichert; `age_verified_at` wird gesetzt.
- Das Formular lehnt ungültige Daten und Personen unter 14 Jahren ab.
- Nach erfolgreichem Speichern wird der Mitgliederbereich neu geladen.
- Hinweis: Altersrechte in Forum, Nachrichten und Freundschaften sind damit noch nicht serverseitig durchgesetzt. Die bestehende `profiles`-UPDATE-Policy erlaubt weiterhin Profiländerungen; RLS/Trigger-Härtung ist ein separater nächster Schritt.
