# Valdara – Weltzeit und Kartenbeleuchtung

Änderungen auf Basis von `VALDARA_FRONTEND_v26_4_2026-10-12.zip`:
- Liest den bestehenden aktiven Weltzustand `Valdara – Weltzeit` für Atherion aus `world_states`.
- Nutzt `timezone` aus `state_value` (Fallback `Europe/Berlin`).
- Ergänzt eine transparente Beleuchtungsebene für Tag, Dämmerung und Nacht.
- Die Ebene ist pointer-events-frei und liegt unter Kartenmarkern/Wetteranzeigen; die bestehende Karteninstanz bleibt erhalten, auch in der Lupe.
- Keine Datenbankänderungen.

Hinweis: Der Effekt ist frontendseitig und folgt der konfigurierten Zeitzone. Er wurde hier statisch geprüft, aber nicht gegen eine live ausgeführte Website im Browser getestet.
