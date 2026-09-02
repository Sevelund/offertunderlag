# Offertunderlag – Sevelund AB

Intern, statisk webbapplikation för att samla tekniska och praktiska uppgifter inför kundofferter. Applikationen innehåller inga priser eller ekonomiska beräkningar.

## Funktioner

- Stegvis, mobilanpassat formulär med relevanta följdfrågor
- Repeterbara rader för personal, maskiner, material, massor och arbetsmoment
- Lokal autosparning av pågående formulär
- Gemensamt arkiv för färdiga formulär, tillgängligt från dator och mobil
- Lokal bildkomprimering, bildtexter och sortering
- PDF med tydliga avsnitt, bilder, sidnummer och strukturerad JSON-sammanställning
- Formulärvalidering och bekräftelse innan formuläret rensas
- Automatisk publicering till GitHub Pages

Sparade formulär lagras i Sevelunds lösenordsskyddade formulärarkiv. Äldre lokala formulär förs över automatiskt första gången den uppdaterade sidan öppnas på respektive enhet.

## Lokal utveckling

```bash
npm install
npm run dev
```

## Kontroll

```bash
npm test
npm run build
```

GitHub Pages byggs för sökvägen `/offertunderlag/`.
