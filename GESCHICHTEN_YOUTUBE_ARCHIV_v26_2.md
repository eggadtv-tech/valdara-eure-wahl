# Valdara v26.2 – YouTube-Folgen auf der Geschichtenseite

- Die feste Anzeige „Folge 2“ wurde entfernt.
- Die aktuelle Folge wird beim Laden aus der vorhandenen Supabase-Tabelle `youtube_videos` abgerufen und oben separat angezeigt.
- Darunter wird das Videoarchiv mit allen öffentlich verfügbaren/aktiven Datensätzen aus `youtube_videos` chronologisch von der ältesten bis zur neuesten Folge dargestellt.
- Videokarten verwenden gespeicherte Titel, Beschreibung, Veröffentlichungsdatum, URL und Vorschaubild, sofern die jeweiligen Spalten vorhanden sind.
- Responsive Kartenansicht und Link zum YouTube-Kanal als Fehler-Fallback.

## Voraussetzung
Die Supabase-Tabelle `youtube_videos` muss die Videos enthalten und eine öffentliche SELECT-Policy besitzen. Die Frontend-Implementierung wurde lokal auf JavaScript-Syntax und ZIP-Struktur geprüft; ein Live-Test gegen Supabase/YouTube ist nicht erfolgt.
