# Konventionen – Picture Selector

Stand: 15.11.2026

## Tech-Stack
- Sprache/Version: HTML, CSS und reines JavaScript (ES2020+, `'use strict'`), alles in `index.html`. Kein TypeScript.
- Frameworks: keine. Bibliotheken liegen im Repository unter `lib/`: exifr 7.1.3, libheif-js 1.19.8, Leaflet 1.9.4, Leaflet.markercluster 1.5.3.
- Laufzeit: Microsoft Edge oder Google Chrome (File System Access API). Firefox und Safari werden nicht unterstützt.
- Datenbank: keine. Daten stehen in `pictureselector.json` im Bilderordner, der Zwischenspeicher in IndexedDB (`pictureselector`, Stores `kv`, `meta`, `thumbs`).
- Build/CI: kein Build-Schritt, keine `package.json`. GitHub Actions veröffentlicht `index.html` und `lib/` bei jedem Push auf `main` auf GitHub Pages.

## Automatisch geprüft (nicht im Review anmerken)
- Linter/Formatter: keiner (siehe I-023).
- Typprüfung: keine.

Solange es keinen Linter gibt, dürfen unbenutzte Variablen und toter Code im Review als 🔵 genannt werden. Reine Formatierung nicht.

## Regeln
- **Eine Datei:** Neue Logik kommt in `index.html`, in den passenden Abschnitt mit Kommentar `/* ---- Name ---- */`. Keine ES-Module, denn die App muss auch per Doppelklick (`file://`) laufen.
- **Bilder bleiben unverändert:** Geschrieben wird in Bilddateien nur bei ausdrücklicher Aktion (Verschieben, Umbenennen, Drehen/Spiegeln). Nie überschreiben, bei Namensgleichheit `_1`, `_2` anhängen. Löschen heißt Verschieben nach `_Papierkorb/`.
- **Daten:** Sterne pro Person, Tags gemeinsam. Neue Felder in `pictureselector.json` müssen von älteren App-Versionen ignoriert werden können. Wer ein Feld pro Bild ergänzt, passt `pruneEntry()` an.
- **Zwischenspeicher:** Ändert sich der Aufbau der Metadaten, `m.v` in `getMeta()` erhöhen.
- **Texte:** Jeder sichtbare Text steht in `I18N` unter `de` und `en` und wird über `t()` ausgegeben. Kommentare im Code sind deutsch.
- **HTML-Ausgabe:** Fremder Text (Dateinamen, Tags, Personen, Ortsnamen, importierte Daten) nur über `esc()` oder `textContent`.
- **Fehlerbehandlung:** Dateioperationen fangen Fehler pro Datei ab, sammeln sie und melden sie am Ende gesammelt per `toast()`. Der Zwischenspeicher ist optional, Fehler dort werden verschluckt.
- **Privatsphäre:** Nichts verlässt den Rechner ohne Knopfdruck des Nutzers. Neue Internetzugriffe brauchen eine Bestätigung und stehen im README.
- **Logging:** nur `console.warn` / `console.info` für Diagnose, keine Telemetrie.
- **Benennung/Struktur:** Zustandsobjekte `S` (App), `V` (Einzelansicht), `M` (Karte). Kurze Funktionsnamen, `render…` baut Oberfläche, `…Dialog` öffnet einen Dialog.
- **Bibliotheken:** mit fester Version in `lib/` ablegen, Lizenztext dazu, im README nennen. Schwere Bibliotheken erst bei Bedarf laden.
- **Git:** Entwicklung auf einem Branch, Änderungen eines Tages sammeln und erst am Ende in EINEM Pull Request pushen (das GitHub-Konto wurde schon einmal wegen zu vieler Anfragen gesperrt). Commit-Nachrichten deutsch, im Präsens, mit Bereich vorne (z.B. „Karte: …“).

## Tests
- Framework: Playwright (Chromium) als ein Skript `tests/e2e.mjs`, Testbilder aus `tests/make_testdata.py`.
- Aufruf: `python3 tests/make_testdata.py && node tests/e2e.mjs`
- Statt eines echten Ordners wird das Origin Private File System benutzt. `window.__PS_TEST__` verhindert das Speichern von Ordner-Handles (Headless-Chromium stürzt sonst ab).
- Kartenkacheln und Nominatim werden im Test mit `page.route` nachgebaut, es gibt keine echten Internetzugriffe.
- Erwartung: Jede neue Funktion bekommt einen Abschnitt mit Prüfungen in `e2e.mjs`, jeder behobene Fehler eine Prüfung, die ihn nachstellt. Vor einem PR läuft das ganze Skript einmal durch.
- Die Tests laufen bisher nur von Hand, nicht in GitHub Actions (siehe I-011).

## Bewusste Ausnahmen
- Alles in einer Datei mit globalem Zustand: gewollt, damit die App ohne Build und per Doppelklick läuft.
- `alert()`, `confirm()`, `prompt()` für seltene Rückfragen: bewusst einfach gehalten.
- Aufnahmezeiten werden als „Ortszeit ohne Zeitzone“ behandelt (intern als UTC gerechnet). Abweichungen korrigiert der Nutzer pro Kamera in den Einstellungen.
- HEIC wird nie verändert, Drehungen stehen nur in `pictureselector.json`.
- `lib/libheif-bundle.js` (1,4 MB) liegt im Repository, damit HEIC auch ohne Internet geht.
- Der Ordnername `_Papierkorb` ist in beiden Sprachen gleich, weil er auf der Festplatte steht.
- Testhaken `window.__PS_TEST__` im Produktivcode.
