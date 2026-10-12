Valdara Frontend v25.1 – Kartenlupe-Korrektur
Datum: 2026-10-09

- Fehlerkorrektur: Zoomfläche skaliert die bestehende #mapView-Karteninstanz jetzt auf 300 % Breite UND 300 % Höhe.
- Die ausgewählte Rasterzelle wird durch den bestehenden Overflow-Ausschnitt korrekt sichtbar.
- Karte wird nicht dupliziert und nicht neu geladen; Wetter- und Ortsmarker bleiben in derselben DOM-Instanz.
- Keine SQL-Dateien, SQL-Queries oder Datenbanklogik geändert.
- Browser-Funktionstest weiterhin beim Einbau/Live-Aufruf durchführen.
