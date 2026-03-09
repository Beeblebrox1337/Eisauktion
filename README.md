# Eisauktion – E2E-Testsystem

## Setup

```bash
npm install
npx playwright install --with-deps chromium
```

## Tests ausführen

```bash
npm run test:e2e
```

Optional:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

## Abgedeckte Szenarien

- **Testfall A/B:** Unternehmensgründung Runde 1+2 inkl. Datenübernahme und Persistenz.
- **Testfall C:** Käuferfluss inkl. Käufe, Sparbetrag und Rundentransfer.
- **Testfall D:** Moderation mit Szenario-Auswahl, Collapse und Rundeneinstellungen.
- **Testfall E:** Auswertung/Versand mit Formspree-Payload-Prüfung (Submit wird im Test abgefangen).
- **Smoke-Test:** Zentrale Seiten laden und zeigen Kern-UI.

Die Soll-Daten liegen zentral in `tests/fixtures/expected-data.json`.
