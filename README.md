# VALDARA – Eure Wahl | Frontend-Master v05 – 5000 Dynamic Map

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


## Karten-Frontend

Die Valdara-Masterkarte wird nicht mehr fest über `assets/valdara-map.jpg` eingebunden. `app.js` lädt den Datensatz `maps.id = 58dd9430-3789-4e41-88b0-366f2678fb00` aus Supabase und verwendet dessen `image_url`.

Die Kartenmarker werden dynamisch aus `map_markers` geladen. Die Markerpositionen verwenden das aktuelle **0–5000 × 0–5000**-Koordinatensystem; `x` und `y` werden direkt als Prozentposition auf der Karte dargestellt.

`maps.image_url` aus Supabase Storage ist die Kartenquelle. Es gibt keine lokale Kartenkopie im Frontend.

## Kartenquelle v05

Die neue Valdara-Masterkarte `Valdara_Master_Map_Wegenetz_v3_hellbraun.png` ist jetzt die primäre Kartenquelle. Sie liegt im öffentlichen Supabase-Storage unter `valdara-media/maps/continents/`. Das Frontend verwendet diese URL bereits beim initialen Laden und als sicheren Fallback, falls der Datenbankabruf kurzfristig nicht verfügbar ist. Dadurch kann die alte `assets/valdara-map.jpg` nicht mehr als Kartenquelle zurückfallen.
