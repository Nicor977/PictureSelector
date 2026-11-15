# Review-Log – Picture Selector

Neueste oben. Dient für Nachprüfungen, ohne Diffs erneut abzurufen.

## Gesamt-Review – `main` nach PR #5
- Datum: 15.11.2026 · Geprüfter Stand: `8517974`
- Umfang: ganzes Repository (`index.html` komplett, `tests/`, `.github/workflows/pages.yml`, `README.md`), kein einzelner PR
- Empfehlung: 🟡 in Ordnung, mit Anmerkungen. Kein Befund betrifft einen offenen PR.
- Nachgestellt im Browser: I-001, I-002, I-003, I-012, I-014. Geschwindigkeit mit 6.000 Testbildern gemessen (unkritisch).
- Offene Befunde:
  - [x] 🟠 `index.html:672` (`scanAll`): Unlesbare Datei blockiert das Öffnen des ganzen Ordners (I-001), behoben in PR #6
  - [x] 🟠 `index.html:635` (`openRoot`): Fehlender Ordner aus „Zuletzt geöffnet“ lässt die App leer hängen (I-002), behoben in PR #6
  - [x] 🟠 `index.html:2086` (`settingsDialog`): Tag löschen entfernt gemerkte HEIC-Drehung (I-003), behoben in PR #6
- Nach IMPROVEMENTS.md verschoben: I-001 bis I-024

## Bisherige PRs (nicht einzeln reviewt)
| PR | Inhalt | Gemergt |
|---|---|---|
| #5 | Ort aus GPS: Karte, Ortsnamen, Ordnerliste beim Start | 14.11.2026 |
| #4 | Leiste in der Einzelansicht | 12.11.2026 |
| #3 | Ordner-Kopfzeile, Sterne-Übersicht pro Person | 11.11.2026 |
| #2 | Sterne-Übersicht, Umbenennen, Dateiname im Raster, Drehen/Spiegeln | 09.11.2026 |
| #1 | Version 1 | 08.11.2026 |
