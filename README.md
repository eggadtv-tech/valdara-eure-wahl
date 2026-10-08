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
