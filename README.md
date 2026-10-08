# VALDARA – Eure Wahl · Frontend Master

## Stand
Masterkarte 5000×5000, Supabase-Daten, Städte, Dörfer und Reichsmarker.

## Neues flexibles System
Das Frontend lädt `marker_styles` aus Supabase. Dadurch können Markerarten, Farben, Größen, Icons und Render-Modi (`point`, `area`, `line`) in der Datenbank gesteuert werden, ohne für jede neue Markerart den Frontend-Code zu ändern.

Vorgesehene Typen:
- Städte / Dörfer / Reich / Hauptstadt
- Festung / Hafen / Tempel / Ruine / Oase / Höhle
- Spieler / Mitspieler / NPC / Begleiter / Gegner / Boss
- Quest / Quest-Ziel
- Gefahren- und Monstergebiete
- X1–X20 als freie Reserve
- Wetter: Sonne, Bewölkung, Regen, Sturm, Gewitter, Schnee, Nebel, Hitze, Kälte, magisches Wetter

Gebiets- und Wetterflächen werden über die DB-Strukturen `map_areas` und `weather_states` vorbereitet. Realtime-Wetter kann später als `source='realtime'` gespeichert werden; Würfeländerungen als `source='dice'` bzw. in `weather_rolls`.


## Echtzeit-Wetter auf der Karte

Das Frontend lädt die aktiven interpolierten Wetterlagen aus `location_weather` und zeigt sie direkt an den vorhandenen Valdara-Orten auf der 5000×5000-Karte.

- Datenquelle: `location_weather`
- Grundlage: reale Open-Meteo-Daten über die 18 Wetter-Referenzpunkte
- Interpolation: bestehende DB-Views/Funktion (`weather_location_current`, `refresh_location_weather()`)
- Darstellung: Wetter-Symbol + Temperatur je Ort
- Schaltfläche `☁ Wetter`: Wetterebene ein-/ausblendbar
- Keine Änderung der bestehenden Orts-/Reichsmarker
- Fallback auf eine zweite `locations`-Abfrage, falls Supabase-Relationen beim REST-Embed nicht verfügbar sind

Die Frontend-Karte verwendet als aktuelle Fallback-Karte `Valdara_Master_Map_Wegenetz_v4_Siedlungsnetz.png`.
