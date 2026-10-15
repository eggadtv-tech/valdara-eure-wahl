# Valdara v46 – Freundesuche und Chat-Grundlage

- Neue Suchoberfläche „Neue Freunde finden“ im Mitgliederbereich.
- Suche verwendet die Supabase-RPC `search_friend_candidates` und zeigt keine E-Mail-Adressen oder Geburtsdaten.
- Neuer globaler privater Chat-Dock auf allen bestehenden HTML-Seiten, mit Minimieren/Öffnen, Kontakt-Auswahl, Nachrichtenverlauf und Senden.
- Der minimierte Zustand und die ausgewählte Kontakt-ID werden lokal gespeichert; Nachrichteninhalte werden nicht in localStorage gespeichert.
- Chat-Freundesliste erwartet eine sichere RPC `list_my_friends`, die noch in Supabase angelegt werden muss. Ohne diese RPC zeigt der Chat einen Hinweis statt Profile direkt abzufragen.
- Nicht live mit Supabase getestet. Altersregeln und RLS müssen weiterhin serverseitig geprüft werden.
