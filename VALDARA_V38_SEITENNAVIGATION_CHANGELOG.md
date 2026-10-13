# VALDARA Frontend v39 - Nachrichten, Freunde und Inventar

- Aufbauend auf v38.
- Nachrichtenoberflaeche: Empfaenger-Auswahl, Senden und Liste letzter Nachrichten.
- Freundschaften: Anfragen senden, eingehende Anfragen annehmen/ablehnen, Statusliste.
- Inventar zeigt Gegenstaende des eigenen Charakters an; bleibt leer bis Inhalte angelegt werden.
- Nutzt die bereits eingerichteten Tabellen private_messages, friendships und character_inventory.
- Die Mitgliederliste versucht profiles (id, display_name) zu lesen. Falls die vorhandene RLS dies nicht erlaubt, wird ein Hinweis angezeigt; keine Profile-Richtlinie wird automatisch geaendert.
