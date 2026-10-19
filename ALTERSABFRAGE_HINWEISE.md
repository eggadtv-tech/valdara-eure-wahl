# Altersabfrage – Arbeitsstand

- Die Registrierung fragt jetzt ein Geburtsdatum ab.
- Die Registrierung im Frontend blockiert unter 14 Jahren.
- Das Geburtsdatum wird in Supabase Auth user_metadata als birth_date übergeben und bei verfügbarer Sitzung nach public.profiles.birth_date übertragen.
- age_verified_at wird gesetzt, wenn die Übertragung gelingt.
- Das Geburtsdatum wird in der öffentlichen Profilansicht nicht ausgegeben.

## Wichtig vor Live-Schaltung
Diese Frontend-Änderung allein ist keine sichere Alters-/Rechtekontrolle: Ein Nutzer kann clientseitige Prüfungen umgehen. Vor Aktivierung von DMs, Freundschaften und altersabhängigen Community-Rechten müssen serverseitige Regeln (z. B. Datenbanktrigger/RLS oder RPC) ergänzt und getestet werden. Außerdem muss der Supabase-Auth-Profiltrigger so geprüft werden, dass er das Metadatenfeld birth_date nicht überschreibt und die bestehenden Profile-Policies das Aktualisieren der beiden eigenen Felder erlauben.
