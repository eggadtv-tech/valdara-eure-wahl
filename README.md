# VALDARA – Eure Wahl | Frontend-Master v02

Bestehender Valdara-Frontend-Master mit dynamischer Völker-Bildanbindung über Supabase.

## Enthalten
- bestehendes Cinematic Valdara Design unverändert
- Header / Navigation
- Hero
- Karten-Vorschau mit Test-Markern
- Völkerkarten mit den sechs bekannten Völkern
- Geschichten-Bereich
- aktuelle Entscheidung mit Auswahlzustand
- Social-/Community-Bereich
- responsives Layout
- bestehende Valdara-Karte und lokale Referenz-Assets
- dynamischer Abruf von `peoples.name` und `peoples.image_url` aus Supabase
- lokale Fallback-Daten, falls Supabase nicht erreichbar oder noch nicht konfiguriert ist

## Supabase-Konfiguration

In `supabase-config.js` ist die aktuelle Projekt-URL bereits hinterlegt:

`https://vunvrgopzcbbxcxyjnxp.supabase.co`

Dort muss nur noch der öffentliche Publishable/anon-Key des aktuellen Projekts in
`VALDARA_SUPABASE_ANON_KEY` eingetragen werden.

## Datenbank

Die Tabelle `peoples` benötigt mindestens:
- `name`
- `image_url`

Die sechs Bild-URLs werden bereits aus `image_url` geladen.

## Noch bewusst nicht angeschlossen
- Auth/Login
- echte Votes
- Würfelmechanik
- Forum
- YouTube-/Instagram-API
- dynamische Weltzeit / Reisen / Regeln
- weitere Supabase-Tabellen

Diese Bereiche werden später auf diesen Frontend-Master aufgesetzt.
