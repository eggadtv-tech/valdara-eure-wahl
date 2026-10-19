# Valdara v26.4 – Vorschau der aktuellen Folge

- Die aktuelle Folge oben auf der Geschichtenseite hat jetzt ein 16:9-Vorschaubild.
- Das Bild wird aus `thumbnail_url` geladen; falls es leer ist, wird die YouTube-Thumbnail-URL anhand der Video-ID abgeleitet.
- Das Vorschaubild und die Schaltfläche öffnen dieselbe aktuelle Folge auf YouTube.
- Bei einem nicht ladbaren Bild erscheint ein dezenter Play-Fallback statt eines leeren Bereichs.
- Das Archiv, die Playlist-Synchronisierung und die bestehende Abstimmungsautomatik wurden nicht geändert.

## Prüfung
Die Änderungen wurden statisch eingebaut. Vor dem Live-Schalten bitte auf der gehosteten Seite mit Strg+F5 prüfen; ein Browser-/Live-Supabase-Test war in dieser Umgebung nicht möglich.
