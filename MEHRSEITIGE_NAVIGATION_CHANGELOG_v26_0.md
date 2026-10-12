# VALDARA – Navigation v26.0

## Änderungen
- Die bisherige Startseite bleibt erhalten; Karte, Wetter, aktivierbare 5×5-Kartenlupe und Völkerübersicht bleiben Bestandteil der Hauptseite.
- Neue eigenständige HTML-Routen wurden ergänzt: `welt.html`, `voelker.html`, `geschichten.html`, `entscheidungen.html`, `community.html`.
- Die Hauptnavigation und Footerlinks führen jetzt auf diese Seiten.
- Die Unterseiten nutzen das bestehende CSS, die bestehende Supabase-Konfiguration und das vorhandene `app.js`, statt neue Backendlogik zu erfinden.
- Auf Unterseiten werden nicht zugehörige Inhaltsbereiche ausgeblendet; die gemeinsamen DOM-Elemente bleiben erhalten, damit vorhandene JS-Initialisierungen möglichst kompatibel bleiben.
- Interne Abschnittslinks auf Unterseiten führen zurück zur passenden Stelle auf `index.html`.

## Wichtig
- Diese ZIP enthält den kompletten bisherigen Masterinhalt plus Frontend-Anpassungen.
- Die HTML-/JS-Dateien wurden strukturell geprüft. Ein echter Browser-/Supabase-Live-Test ist in dieser Umgebung nicht möglich; bitte vor dem Live-Schalten im Hosting testen.
