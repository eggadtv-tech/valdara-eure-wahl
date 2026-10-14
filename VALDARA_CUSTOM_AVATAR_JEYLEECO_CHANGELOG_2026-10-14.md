# Valdara – persönlicher Avatar für ein Konto

- Bestehenden v41-Master als Grundlage verwendet.
- `auth.js` liest `characters.custom_avatar_url`.
- Ein persönlicher Avatar wird in der Avatar-Sektion und auf der Charakterkarte angezeigt.
- Wenn `custom_avatar_url` gesetzt ist, werden für diesen Charakter keine globalen Avatar-Varianten angeboten.
- Diese Frontend-Änderung ändert keine Datenbankdaten. Die URL muss bereits beim gewünschten Charakter in `public.characters.custom_avatar_url` gespeichert sein.
- Andere Konten ohne `custom_avatar_url` behalten die bisherige Avatar-Auswahl.
