# VALDARA – Frontend Master v25 (09.10.2026)

## Master-Basis
Basiert auf `VALDARA_FRONTEND_MASTER_v24_WETTERPUNKTE_2026-10-09.zip`.

## Neu in v25: 3×3-Kartenlupe
- Die bestehende Weltkarte wird in neun logisch auswählbare Bereiche (3×3) aufgeteilt.
- Über der Gesamtkarte erscheinen beim Darüberfahren die neun Lupenbereiche; mobil sind sie antippbar.
- Beim Auswählen wird dieselbe `#mapView`-DOM-Instanz vorübergehend in ein Zoomfenster verschoben und per CSS vergrößert/verschoben.
- Es wird kein neues Kartenbild angefordert und keine zweite Karte geladen.
- Ortsmarker und Wetter-Badges bleiben dieselben DOM-Elemente an denselben Koordinaten; es werden keine Wetter-/Ortsdaten neu berechnet.
- Schließen oder Escape setzt exakt dieselbe Karteninstanz an ihren ursprünglichen Platz zurück.

## Bestehende Funktionen unverändert
- Valdara-Karte mit vorhandener Supabase-Konfiguration.
- Ortsmarker, Ortsdetails und Echtzeit-Wetter.
- Die sieben unsichtbaren Wetterpunkte nutzen weiterhin den bestehenden `location_weather`-Pfad.
- Keine SQL-Änderungen erforderlich.

## Dateien
- `index.html`
- `app.js`
- `styles.css`
- `supabase-config.js`

Korrektur v25.1 (2026-10-09): Die Zoomansicht skaliert die bestehende Karteninstanz jetzt in Breite und Höhe auf 300 %. Dadurch entspricht jeder Ausschnitt einem Feld des 3x3-Rasters. SQL und Wetter-/Ortslogik bleiben unverändert.


## Social-Media-Links (v25.2)
- YouTube: https://www.youtube.com/@ValdaraEureWahl
- Instagram: https://www.instagram.com/valdara_eure_wahl/
- Discord bleibt unverändert.
