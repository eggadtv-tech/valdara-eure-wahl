# VALDARA v50 – Nachrichtenbereich mit Suche und Freundesliste

Ausgehend von v49:
- Auf `mein-bereich.html?view=messages` gibt es nun einen eigenen Nachrichtenarbeitsbereich.
- Links: Suche nach neuen Mitgliedern ab zwei Zeichen, Ergebnisse über die vorhandene RPC `search_friend_candidates`, Anfrage senden, darunter bestätigte Freunde über `list_my_friends` in einer scrollbareren Liste.
- Mitte: großer Gesprächsbereich, Nachrichtenverlauf, Senden und regelmäßiges Aktualisieren.
- Verwendet die bereits vorhandenen Supabase-RPCs; erstellt keine neuen Datenbankfunktionen.
- Entfernt den funktionslosen Lupen-Button aus dem Startseiten-Header.
- Die bisherige Nachrichtenkarte wird in der Nachrichtenansicht ausgeblendet.

## Prüfungen
- `node --check` für `auth.js`, `private-chat-widget.js` und alle Inline-Skripte in `mein-bereich.html` erfolgreich.
- ZIP-Datei erstellt und Archivstruktur beibehalten.
- Nicht live mit Supabase/Cloudflare getestet. Freundesuche, Anfragen und Nachrichten hängen weiterhin von den vorhandenen RPC-Berechtigungen, RLS-Policies und Tabelleneinschränkungen ab.
