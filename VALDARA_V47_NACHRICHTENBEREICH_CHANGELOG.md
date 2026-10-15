# VALDARA v47 – zentraler Nachrichtenbereich

- Globales Dropdown unter „Mein Bereich“ auf Seiten, auf denen der bestehende Konto-Link vorhanden ist.
- Globales Chatfenster vergrößert und Kontaktliste links scrollbar gestaltet.
- Freundesuche nutzt die bereits angelegte RPC `search_friend_candidates`.
- Freundesliste nutzt die bereits angelegte RPC `list_my_friends`.
- Anfrage-Schaltfläche sendet nun eine `pending`-Freundschaftsanfrage an `public.friendships` statt nur zur Freundeseite weiterzuleiten.
- Abfangen eines möglichen Null-Elements bei den Textfeldern der Volk-Bestätigung.
- Chat bleibt seitenübergreifend über das globale Widget verfügbar; Minimieren blendet es auf den Launcher zurück.

## Hinweise
- JavaScript-Syntax geprüft mit `node --check`.
- Nicht live gegen Supabase getestet. Anfrageversand hängt von den vorhandenen RLS-Policies und Tabelleneinschränkungen ab.
- Die bestehende Seite `mein-bereich.html?view=friends` enthält weiterhin die alte Verwaltung; der neue globale Chat ist die zentrale Kontaktoberfläche.
