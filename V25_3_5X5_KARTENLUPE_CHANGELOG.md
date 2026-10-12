VALDARA FRONTEND v25.3 – 5×5-KARTENLUPE
Stand: 09.10.2026

Änderung:
- Lupenraster von 3×3 auf 5×5 (25 auswählbare Ausschnitte) erweitert.
- Gezoomt wird ausschließlich #mapView: dieselbe Kartenbild- und Markerinstanz.
- Rechte Beschreibung/sonstige Seiteninhalte bleiben außerhalb des Zoomcontainers.
- Keine neuen Kartenbilder, keine Neuladung, keine Änderungen an Wetter, Orten oder SQL.

Technik:
- Sektorindex 0–24, Raster 5 Spalten × 5 Zeilen.
- Kartendarstellung 500 % in Breite/Höhe; Versatz pro Rasterfeld 20 %.
- Schließen setzt dieselbe #mapView-Instanz an ihren ursprünglichen DOM-Platz zurück.
