# Valdara v26.3 – automatische YouTube-Serienplaylist

Playlist: `https://www.youtube.com/playlist?list=PLBpv5Q6azL4A`

## Was geändert wurde
- Die Geschichtenseite liest das Archiv jetzt aus `public.valdara_story_videos`.
- Die aktuelle Folge wird aus dem neuesten `published_at`-Datensatz angezeigt; das Archiv zeigt alle aktiven Playlist-Videos von ältester bis neuester Folge.
- Neue Edge Function: `valdara-story-playlist-sync`. Sie verwendet das vorhandene `YOUTUBE_API_KEY`-Secret und schreibt Metadaten der Playlist nach Supabase.
- Die bestehende YouTube-Abstimmungsfunktion wird nicht verändert.

## Einmalige Einrichtung in Supabase
1. SQL Editor öffnen und `SQL/QUERIES/QUERY_95_VALDARA_YOUTUBE_SERIENPLAYLIST.sql` ausführen.
2. In `SQL/basis/valdara_master_build/EDGE_FUNCTIONS/valdara-story-playlist-sync/index.ts` die neue Edge Function im Supabase-Projekt unter `functions/valdara-story-playlist-sync/index.ts` anlegen/deployen.
3. Bestehende Secrets weiterverwenden: `YOUTUBE_API_KEY`, `SUPABASE_URL` und `DB_SERVICE_KEY` oder `SUPABASE_SERVICE_ROLE_KEY`. Es wird kein neuer YouTube-Key benötigt. Die Funktion liest keine Secrets aus dem Browser.
4. Die Funktion einmal mit einer authentifizierten POST-Anfrage auslösen und prüfen, ob `videosFound: 5` bzw. die tatsächliche Zahl der Playlist-Videos zurückkommt.
5. Für automatische Aktualisierung einen stündlichen Cron-Aufruf auf die Edge Function einrichten, der einen gültigen Authorization-Header verwendet. Die genaue Cron-Konfiguration hängt davon ab, wie der bestehende YouTube-Job in diesem Projekt ausgelöst wird; nicht ungeprüft den Abstimmungsjob überschreiben.

## Hinweise
- Diese ZIP ist eine vorbereitete Code-/SQL-Lieferung. Sie deployt nichts selbst in das verbundene Supabase-Projekt.
- Die neue Tabelle ist absichtlich getrennt von der bestehenden Abstimmungsdatenbank. So werden bestehende YouTube-Kommentar- und Abstimmungsprozesse nicht verändert.
- Videos, die aus der Playlist entfernt werden, bleiben als Datensätze erhalten, werden aber auf `is_active = false` gesetzt.
- Episodennummern im Frontend werden aus der Archiv-Reihenfolge gebildet. Falls die Playlist umsortiert wird, bleibt das Archiv trotzdem nach Veröffentlichungsdatum chronologisch.
