# VALDARA FRONTEND v30 – Login & Mitgliederbereich

Aufbauend auf VALDARA_FRONTEND_v28_SHOP_FOURTHWALL_WELTZEIT. Bestehende Seiten, Weltzeit, Karte, Shop und KI-Chat bleiben enthalten.

## Neue Dateien
- `FRONTEND/login.html`: Anmeldung, Registrierung und Passwort-Reset
- `FRONTEND/mein-bereich.html`: persönlicher Mitgliederbereich
- `FRONTEND/auth.js`: Supabase Auth, Profilzugriff, Volk-Auswahl, Gruppen-/Spielbereichsübersicht

## Wichtig vor Live-Test
Die vorhandene `profiles`-Tabelle besitzt keinen INSERT-Policy-Eintrag und es wurde kein Signup-Trigger gefunden. Die UI versucht daher nach Registrierung bzw. Anmeldung ein Profil anzulegen. Damit das zuverlässig funktioniert, sollte als nächster Schritt ein sicherer `SECURITY DEFINER`-Trigger für `auth.users` eingerichtet werden, der `profiles` erstellt. Der Trigger wurde nicht automatisch in der Datenbank installiert; dafür ist eine SQL-Ausführung im Supabase-Dashboard nötig.

Die Website verwendet den vorhandenen öffentlichen Supabase Publishable Key in `supabase-config.js`. Keine Service-Role-Schlüssel ins Frontend eintragen.

## Veröffentlichungsdateien
Den Inhalt des Ordners `FRONTEND` in das bestehende GitHub-Frontend übernehmen. `login.html`, `mein-bereich.html` und `auth.js` müssen zusammen mit den vorhandenen Dateien veröffentlicht werden.

## Hinweis zum Avatar
Die Tabelle `characters` existiert bereits und speichert `avatar_variant_id`. Die Avatar-Kacheln zeigen die vorhandenen aktiven Varianten; das sichere Speichern einer Avatar-Auswahl wird erst nach separater Prüfung der Character-RLS-Regeln freigeschaltet. Es wird kein Charakterdatensatz stillschweigend angelegt oder verändert.
