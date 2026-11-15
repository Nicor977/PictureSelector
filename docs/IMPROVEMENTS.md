# Verbesserungen – Picture Selector

Stand: 15.11.2026
Punkte aus Reviews, die keinen PR blockieren. Neueste oben.
Priorität: H = hoch · M = mittel · N = niedrig

Die Tabelle ist die Übersicht. Zu jedem Punkt stehen weiter unten unter „Details“ Fundstelle, Beleg und Lösungsvorschlag. Ist ein Punkt erledigt, die Zeile nach „Erledigt“ verschieben.

## Offen
| ID | Prio | Bereich | Beschreibung | Gefunden in | Aufwand |
|---|---|---|---|---|---|
| I-001 | H | `scanAll()` | Eine unlesbare Datei blockiert das Öffnen des ganzen Ordners | Gesamt-Review, 15.11.2026 | S |
| I-002 | H | `openRoot()` | Ordner aus „Zuletzt geöffnet“ fehlt: App bleibt leer hängen | Gesamt-Review, 15.11.2026 | S |
| I-003 | H | `settingsDialog()` | Tag löschen entfernt gemerkte HEIC-Drehung | Gesamt-Review, 15.11.2026 | S |
| I-004 | M | `setStars()`, `toggleTag()` | Kein Rückgängig für Sterne und Tags (Massenänderung mit einem Tastendruck) | Gesamt-Review, 15.11.2026 | M |
| I-005 | M | `saveNow()` | Sicherungskopie ist nur 1 Speichervorgang alt | Gesamt-Review, 15.11.2026 | S |
| I-006 | M | `saveNow()` | Gleichzeitige Änderung der JSON-Datei wird nicht erkannt | Gesamt-Review, 15.11.2026 | M |
| I-007 | M | `APP_VERSION` | Versionsnummer wird nie erhöht und nirgends gut sichtbar angezeigt | Gesamt-Review, 15.11.2026 | S |
| I-008 | M | `loadLeaflet()`, `Decode.loadLib()` | Nachgeladene Bibliotheken ohne Prüfsumme (jsDelivr) | Gesamt-Review, 15.11.2026 | S |
| I-009 | M | `TILE_LAYERS`, `lookupPlaces()` | Esri-Karte und Ortsnamen aus lokaler Datei sind ungeprüft | Gesamt-Review, 15.11.2026 | S |
| I-010 | M | `parsePlace()` | Fehlgeschlagene Ortsabfragen werden dauerhaft als „kein Ort“ gespeichert | Gesamt-Review, 15.11.2026 | S |
| I-011 | M | `.github/workflows/pages.yml` | Tests laufen nicht automatisch vor dem Veröffentlichen | Gesamt-Review, 15.11.2026 | M |
| I-012 | M | `tests/e2e.mjs` | Tests bauen aufeinander auf | Gesamt-Review, 15.11.2026 | M |
| I-013 | M | `DB`, `getMeta()`, `Thumbs` | Browser-Zwischenspeicher wächst unbegrenzt | Gesamt-Review, 15.11.2026 | M |
| I-014 | M | `findJpegOrientation()` | JPG mit EXIF, aber ohne Dreh-Feld, wird nur in der Anzeige gedreht | Gesamt-Review, 15.11.2026 | M |
| I-015 | N | `rewritePng()` | PNG drehen verliert Farbprofil und 16-Bit-Tiefe | Gesamt-Review, 15.11.2026 | S |
| I-016 | N | `I18N` | Texte, die nicht übersetzt sind | Gesamt-Review, 15.11.2026 | S |
| I-017 | N | `index.html` (mehrere Stellen) | Toter und doppelter Code | Gesamt-Review, 15.11.2026 | S |
| I-018 | N | `moveFiles()` | Auswahl geht nach Verschieben/Umbenennen verloren | Gesamt-Review, 15.11.2026 | S |
| I-019 | N | `reidentify()` | Verwaiste Bewertungen sind unsichtbar | Gesamt-Review, 15.11.2026 | S |
| I-020 | N | `normalizeData()` | Neuere Datei-Version wird nicht erkannt | Gesamt-Review, 15.11.2026 | S |
| I-021 | N | `Decode.heic()` | HEIC-Dekodierung blockiert die Oberfläche | Gesamt-Review, 15.11.2026 | M |
| I-022 | N | `Thumbs.make()` | Vorschau-Adressen werden nie freigegeben | Gesamt-Review, 15.11.2026 | S |
| I-023 | N | ganzes Projekt | Keine automatische Code-Prüfung (Lint) | Gesamt-Review, 15.11.2026 | M |
| I-024 | N | `README.md` | README und Doppelpflege der lokalen Datei | Gesamt-Review, 15.11.2026 | S |

## Erledigt
| ID | Erledigt durch | Datum |
|---|---|---|

## Details

Aus dem Gesamt-Review vom 15.11.2026, Stand `main` nach PR #5 (Commit `8517974`). Zeilennummern beziehen sich auf diesen Stand, der Funktionsname ist die verlässlichere Angabe.

- Aufwand: **S** = unter 1 Stunde, **M** = halber Tag, **L** = mehr.
- Beleg: **nachgestellt** = im Browser reproduziert, **Code** = aus dem Code abgeleitet, nicht nachgestellt.

Geschwindigkeit ist kein akutes Problem. Gemessen mit 6.000 Testbildern in 30 Ordnern (Headless-Chromium, kleine Dateien): erstes Öffnen 9,9 s, zweites Öffnen 1,9 s, Raster neu aufbauen 0,12 s, alle 6.000 bewerten 0,4 s, `pictureselector.json` 1,1 MB.

### Priorität H – zuerst

#### I-001 · Eine unlesbare Datei blockiert das Öffnen des ganzen Ordners
- **Wo:** `scanAll()` (Zeile 672), dort `walk()` und der `pool(...)`-Aufruf.
- **Beleg:** nachgestellt. Lässt sich bei 3 Bildern eines nicht lesen, bleibt die Fortschrittsanzeige für immer stehen, es erscheint kein Bild und keine Meldung.
- **Problem:** `f.handle.getFile()` und `dir.entries()` haben kein `try/catch`. Ein Fehler bricht `pool()` ab, `progress(null)` wird nie erreicht. Auslöser in der Praxis: OneDrive-Platzhalter ohne Internet, gesperrte Datei, Unterordner ohne Zugriffsrecht, Datei wird während des Einlesens gelöscht.
- **Vorschlag:** In `pool`-Callback und in `walk()` je ein `try/catch`. Übersprungene Dateien/Ordner in einer Liste sammeln und nach dem Einlesen einmal melden („3 Dateien konnten nicht gelesen werden“, mit Liste in der Konsole oder in einem Dialog). `progress(null)` in ein `finally`.
- **Test dazu:** In `e2e.mjs` `FileSystemFileHandle.prototype.getFile` für eine Datei scheitern lassen und prüfen, dass die übrigen Bilder erscheinen.

#### I-002 · Ordner aus „Zuletzt geöffnet“ fehlt: App bleibt leer hängen
- **Wo:** `openRoot()` (Zeile 635), aufgerufen aus `updateRecentButton()`.
- **Beleg:** nachgestellt. `openRoot` auf einen gelöschten Ordner wirft `NotFoundError`, niemand fängt ihn.
- **Problem:** Externe Platte nicht angesteckt oder Ordner umbenannt: Der Lesefehler für `pictureselector.json` wird als „neuer Ordner“ gedeutet (`NotFoundError`), danach scheitert `scanAll()`. Die Startseite ist dann schon ausgeblendet, die App zeigt eine leere Fläche mit Fortschrittsanzeige.
- **Vorschlag:** Am Anfang von `openRoot()` prüfen, ob der Ordner erreichbar ist (z.B. `await handle.keys().next()` in `try/catch`). Bei Fehler: Meldung „Ordner nicht gefunden (Laufwerk angeschlossen?)“, Startseite stehen lassen, Eintrag in der Liste behalten. Zusätzlich den ganzen Rumpf von `openRoot()` in `try/catch` mit Rückkehr zur Startseite.
- **Hängt zusammen mit:** I-001 (gleiche Stelle, zusammen erledigen).

#### I-003 · Tag löschen entfernt gemerkte HEIC-Drehung
- **Wo:** `settingsDialog()`, Löschen-Knopf eines Tags (Zeile 2086).
- **Beleg:** nachgestellt (gleiche Logik isoliert ausgeführt: Eintrag mit `orient`, ohne Sterne, verschwindet).
- **Problem:** Dort steht `if (!Object.keys(e.stars).length && !e.tags.length) delete S.data.images[p];`. Das Feld `orient` (nur in der Anzeige gedrehtes Bild, z.B. HEIC) wird nicht beachtet. Hatte ein gedrehtes Bild nur dieses eine Tag und keine Sterne, ist die Drehung danach weg. Überall sonst wird korrekt `pruneEntry()` benutzt, das `orient` berücksichtigt.
- **Vorschlag:** Die Bedingung in eine Hilfsfunktion `isEmptyEntry(e)` ziehen (`stars` leer, `tags` leer, kein `orient`) und sowohl in `pruneEntry()` als auch hier verwenden. So kann ein später hinzukommendes Feld nicht wieder vergessen werden.

---

### Priorität M – wichtig

#### I-004 · Kein Rückgängig für Sterne und Tags
- **Wo:** `setStars()` (Zeile 819), `toggleTag()`, `onKey()`.
- **Beleg:** Code.
- **Problem:** Mit Strg+A und einer Zifferntaste werden die Sterne aller angezeigten Bilder ohne Rückfrage überschrieben. 0,8 s später ist das gespeichert, und die Sicherungskopie hält nur den Stand direkt davor (siehe I-005). Ein Vertipper kann die Arbeit eines Abends kosten.
- **Vorschlag:** Einfacher Rückgängig-Stapel (z.B. die letzten 20 Schritte): vor jeder Änderung die alten Werte der betroffenen Bilder merken, Strg+Z stellt sie wieder her. Dazu im Toast „32 Bilder bewertet – Rückgängig“. Als kleine Sofortmaßnahme: Rückfrage, wenn mehr als z.B. 20 Bilder auf einmal bewertet werden.

#### I-005 · Sicherungskopie ist nur 1 Speichervorgang alt
- **Wo:** `saveNow()` (Zeile 852).
- **Beleg:** Code.
- **Problem:** `pictureselector.bak.json` wird bei jedem Speichern mit dem vorigen Stand überschrieben, also bei aktivem Bewerten etwa jede Sekunde. Ein Fehler, der zwei Speichervorgänge überlebt, ist auch in der Sicherung.
- **Vorschlag:** Zusätzlich beim Öffnen des Ordners einmal pro Tag den geladenen Stand als `pictureselector.bak-JJJJMMTT.json` ablegen und nur die letzten 5 behalten. Kostet bei 6.000 Bildern rund 1 MB pro Datei.

#### I-006 · Gleichzeitige Änderung der JSON-Datei wird nicht erkannt
- **Wo:** `saveNow()` / `writeText()`.
- **Beleg:** Code.
- **Problem:** Ist derselbe Ordner in zwei Browserfenstern offen (oder liegt er auf einem gemeinsamen Laufwerk), gewinnt der, der zuletzt speichert. Die Änderungen des anderen gehen ohne Hinweis verloren.
- **Vorschlag:** Nach jedem Speichern `lastModified` der Datei merken. Vor dem nächsten Speichern vergleichen. Weicht es ab: nicht überschreiben, sondern melden und „Neu laden“ oder „Trotzdem speichern“ anbieten.

#### I-007 · Versionsnummer wird nie erhöht und ist kaum sichtbar
- **Wo:** `APP_VERSION = '1.0.0'` (Zeile 299), Kopfkommentar „Version 1“, Anzeige nur ganz unten in den Einstellungen.
- **Beleg:** Code.
- **Problem:** Seit Version 1 kamen 5 PRs dazu, die Nummer steht weiter auf 1.0.0. Es gibt zwei Kopien der App (GitHub Pages und die lokale Datei), und man sieht nicht, welche gerade läuft. Das hat am 14.11. bei der Kartenfehlersuche Zeit gekostet.
- **Vorschlag:** Version pro PR erhöhen (z.B. 1.5.0) und zusammen mit dem Datum klein auf der Startseite und im `?`-Dialog zeigen. Optional setzt der Pages-Workflow das Datum beim Veröffentlichen automatisch ein.

#### I-008 · Nachgeladene Bibliotheken ohne Prüfsumme
- **Wo:** `LIBHEIF_CDN` (Zeile 310), `LEAFLET_CDN` (Zeile 312), `Decode.loadLib()`, `loadLeaflet()`.
- **Beleg:** Code.
- **Problem:** Fehlt der Ordner `lib/`, lädt die App Skripte von jsDelivr und führt sie aus. Die App hat Schreibzugriff auf den Bilderordner. Ohne `integrity`-Angabe würde ein manipuliertes Skript ungeprüft laufen. Die Versionen sind fest angegeben, das Risiko ist klein, aber die Absicherung kostet fast nichts.
- **Vorschlag:** Beim Anlegen der `<script>`- und `<link>`-Elemente `integrity="sha384-…"` und `crossOrigin="anonymous"` setzen. Die Prüfsummen aus den Dateien in `lib/` berechnen (`openssl dgst -sha384 -binary DATEI | openssl base64 -A`).

#### I-009 · Esri-Karte und Ortsnamen aus lokaler Datei sind ungeprüft
- **Wo:** `TILE_LAYERS` (Zeile 319), `lookupPlaces()` (Zeile 1491).
- **Beleg:** offen. Aus der Entwicklungsumgebung sind die Kartendienste nicht erreichbar, getestet wurde nur mit nachgebauten Antworten.
- **Problem:** Ob „Esri Straßen“ und „Esri Satellit“ bei per Doppelklick geöffneter Datei wirklich Karten zeigen, wurde nie bestätigt (OpenStreetMap und CARTO haben dort gesperrt). Dasselbe gilt für den Ortsdienst Nominatim aus der lokalen Datei. Außerdem sind die Nutzungsbedingungen von Esri für Abrufe ohne Konto nicht geprüft.
- **Vorschlag:** Einmal von Hand prüfen: (a) GitHub Pages mit OpenStreetMap, (b) lokale Datei mit Esri Straßen und Satellit, (c) „Ortsnamen ermitteln“ an beiden Orten. Ergebnis hier notieren. Falls Esri lokal nicht geht: Kartendienst entfernen und lokal einen Hinweis zeigen, die Pages-Adresse zu benutzen.

#### I-010 · Fehlgeschlagene Ortsabfragen werden dauerhaft als „kein Ort“ gespeichert
- **Wo:** `parsePlace()` (Zeile 1485), `placesTodo()`.
- **Beleg:** Code.
- **Problem:** Jede Antwort mit einem `error`-Feld oder ohne `address` wird als `{ none: true }` gespeichert und nie wieder abgefragt. Das ist richtig für „mitten im Meer“, aber falsch für vorübergehende Fehler des Dienstes. Es gibt auch keinen Weg, Ortsnamen neu zu holen, z.B. nach einem Sprachwechsel (Namen bleiben in der Sprache der ersten Abfrage).
- **Vorschlag:** Nur bei der Meldung „Unable to geocode“ als `none` speichern, sonst nicht speichern. In den Einstellungen einen Abschnitt „Ortsnamen“ mit Anzahl und Knopf „Ortsnamen löschen“ ergänzen.

#### I-011 · Tests laufen nicht automatisch vor dem Veröffentlichen
- **Wo:** `.github/workflows/pages.yml`.
- **Beleg:** Code.
- **Problem:** Jeder Merge auf `main` geht sofort live, ohne dass `tests/e2e.mjs` gelaufen ist. Die Tests laufen bisher nur von Hand.
- **Vorschlag:** Im Pages-Workflow vor dem Deploy einen Job ergänzen: Python + `pillow pillow-heif`, `npx playwright install chromium`, `python3 tests/make_testdata.py && node tests/e2e.mjs`. Deploy nur bei Erfolg (`needs:`). Das läuft einmal pro Merge und erzeugt keine zusätzlichen PRs. Dafür braucht das Repo eine `package.json` mit fester Playwright-Version.

#### I-012 · Tests bauen aufeinander auf
- **Wo:** `tests/e2e.mjs` (450 Zeilen, 14 Abschnitte hintereinander).
- **Beleg:** nachgestellt (beim Schreiben der Karten-Tests: Dateien hießen wegen früherer Abschnitte anders als erwartet).
- **Problem:** Jeder Abschnitt arbeitet mit dem Zustand, den die vorigen hinterlassen (verschobene, umbenannte, gedrehte Dateien, Sprache Englisch). Ein Fehler vorne zieht Folgefehler nach sich, und einzelne Abschnitte lassen sich nicht allein starten. Viele feste Wartezeiten (`waitForTimeout`) machen den Lauf langsam und anfällig.
- **Vorschlag:** Eine Funktion `frisch()` einführen, die den Testordner neu anlegt und die App öffnet, und sie am Anfang jedes Abschnitts aufrufen. Abschnitt per Argument wählbar machen (`node tests/e2e.mjs 14`). Feste Wartezeiten durch `waitForFunction` auf den erwarteten Zustand ersetzen.

#### I-013 · Browser-Zwischenspeicher wächst unbegrenzt
- **Wo:** `DB` (Stores `meta` und `thumbs`), `getMeta()`, `Thumbs.make()`, `moveFiles()`.
- **Beleg:** Code.
- **Problem:** Metadaten werden unter `Pfad|Größe|Datum` abgelegt. Nach jedem Verschieben, Umbenennen oder Drehen entsteht ein neuer Eintrag, der alte bleibt für immer. Vorschaubilder (je etwa 20–30 KB) werden nie gelöscht, auch nicht für längst entfernte Bilder oder andere Ordner. Bei 6.000 Bildern sind das grob 150 MB, mit der Zeit mehr.
- **Vorschlag:** In den Einstellungen „Zwischenspeicher leeren“ anbieten und die belegte Größe zeigen (`navigator.storage.estimate()`). Besser zusätzlich: beim Öffnen eines Ordners Einträge entfernen, deren Schlüssel zu diesem Ordner gehören, aber zu keiner vorhandenen Datei mehr passen. Dafür den Schlüssel um eine Ordnerkennung erweitern.

#### I-014 · JPG mit EXIF, aber ohne Dreh-Feld, wird nur in der Anzeige gedreht
- **Wo:** `findJpegOrientation()` (Zeile 1652), `writeJpegOrientation()`, `transformFiles()`.
- **Beleg:** nachgestellt (bestehender Test „JPG mit EXIF ohne Dreh-Feld: nur Anzeige“).
- **Problem:** Hat ein JPG EXIF-Daten, aber kein Orientation-Feld (manche Kameras, bearbeitete Bilder), wird die Drehung nur in `pictureselector.json` gemerkt. Im Explorer und in anderen Programmen bleibt das Bild ungedreht. Der Nutzer sieht keinen Unterschied zu einem „echt“ gedrehten JPG, die Meldung dazu erscheint nur bei Mehrfachauswahl.
- **Vorschlag:** Entweder das Feld in den vorhandenen EXIF-Block einfügen (IFD0 um einen Eintrag erweitern, Offsets anpassen; aufwendig und heikel), oder mindestens immer anzeigen, wenn eine Drehung nur in der Anzeige gilt (auch bei einem einzelnen Bild) und solche Bilder im Raster kennzeichnen.

---

### Priorität N – Aufräumen und Komfort

#### I-015 · PNG drehen verliert Farbprofil und 16-Bit-Tiefe
- **Wo:** `rewritePng()` (Zeile 1719).
- **Beleg:** Code.
- **Problem:** Das Bild wird über ein Canvas neu gespeichert. Dabei gehen Farbprofil, Textfelder und 16 Bit pro Kanal verloren. Die Aussage „pixelgenau“ im README stimmt nur für normale 8-Bit-PNGs (Screenshots).
- **Vorschlag:** Vor dem Schreiben den PNG-Kopf lesen (Bit-Tiefe im IHDR, iCCP-Block). Bei 16 Bit oder Farbprofil nur in der Anzeige drehen, wie bei HEIC. README anpassen.

#### I-016 · Texte, die nicht übersetzt sind
- **Wo:** `toast('Ungültiger Ordnername')` (Zeile 1596), Platzhalter „z.B. Kalender 2026“ (Zeile 1580), `title="Größe"` (Zeile 221), `' (Entf)'` am Papierkorb-Knopf (Zeile 1226), Fehlermeldungen wie „Kopie unvollständig“, „Speichern unvollständig“, „HEIC: kein Bild“.
- **Beleg:** Code.
- **Vorschlag:** In `I18N` aufnehmen und über `t()` ausgeben. Dabei ein kleiner Test: alle Schlüssel aus `de` müssen in `en` vorkommen und umgekehrt.

#### I-017 · Toter und doppelter Code
- **Wo und was:**
  - `applyImport()`: `const live = …` und `void live;` (Zeile 2035) werden nicht gebraucht.
  - `pruneZero()` (Zeile 830) ruft nur `pruneEntry()` auf.
  - `renderViewerBar()`: `f.meta && f.meta.time != null ? new Date(f.sortTime) : new Date(f.sortTime)` (Zeile 1223), beide Zweige sind gleich.
  - `moveFiles()`: `if (S.selected.delete(oldPath)) { }` (Zeile 1890) mit leerem Rumpf.
  - Datumsformat und Sprachwahl (`LANG === 'de' ? 'de-DE' : 'en-GB'`) stehen an 4 Stellen, einmal mit `en-US` statt `en-GB`.
  - `S.files.filter(isTrash).length` wird pro Aufbau zweimal berechnet.
- **Beleg:** Code.
- **Vorschlag:** Entfernen bzw. in eine Hilfsfunktion `locale()` und `fmtDate()` ziehen.

#### I-018 · Auswahl geht nach Verschieben/Umbenennen verloren
- **Wo:** `moveFiles()` (Zeile 1869).
- **Beleg:** Code.
- **Problem:** Der alte Pfad wird aus der Auswahl entfernt, der neue nicht aufgenommen. Wer 50 Bilder umbenennt und danach taggen will, muss neu auswählen.
- **Vorschlag:** Beim Umbenennen den neuen Pfad in `S.selected` übernehmen. Beim Verschieben in einen Ordner außerhalb der aktuellen Ansicht bleibt es wie bisher.

#### I-019 · Verwaiste Bewertungen sind unsichtbar
- **Wo:** `reidentify()` (Zeile 1918).
- **Beleg:** Code.
- **Problem:** Bewertungen zu Bildern, die nicht mehr gefunden werden, bleiben für immer in der JSON-Datei. Die Anzahl steht nur in der Browser-Konsole.
- **Vorschlag:** In den Einstellungen anzeigen („12 Bewertungen ohne Bild“) mit Liste und Knopf „Entfernen“.

#### I-020 · Neuere Datei-Version wird nicht erkannt
- **Wo:** `normalizeData()` (Zeile 659).
- **Beleg:** Code.
- **Problem:** Das Feld `version` wird gelesen, aber nie geprüft. Öffnet eine ältere App-Kopie (z.B. die lokale Datei) eine JSON-Datei, die eine neuere App mit geändertem Aufbau geschrieben hat, wird ohne Warnung weitergearbeitet. Bisher ist nichts passiert, weil unbekannte Felder erhalten bleiben.
- **Vorschlag:** Konstante `DATA_VERSION`. Ist `d.version` größer: Hinweis zeigen und nur lesend öffnen. Typen der Einträge prüfen (`stars` ist ein Objekt, `tags` ein Array).

#### I-021 · HEIC-Dekodierung blockiert die Oberfläche
- **Wo:** `Decode.heic()` (Zeile 744), `Thumbs.pump()`.
- **Beleg:** Code (und bekannt aus dem Backlog).
- **Problem:** HEIC wird im Hauptprogramm dekodiert, eines nach dem anderen. Währenddessen ruckelt die Bedienung. Bei einem Fehler in `img.display` werden die Bildobjekte nicht freigegeben.
- **Vorschlag:** In Web Worker auslagern (2–4 parallel). Geht nur über `https`, nicht aus der lokalen Datei, dort bleibt der jetzige Weg. Freigabe in ein `finally`.

#### I-022 · Vorschau-Adressen werden nie freigegeben
- **Wo:** `Thumbs.make()` (Zeile 1093), `scanAll()`, `openRoot()`.
- **Beleg:** Code.
- **Problem:** Jedes einmal angezeigte Vorschaubild behält seine `blob:`-Adresse bis zum Schließen der Seite, auch nach einem Ordnerwechsel. Bei langen Sitzungen mit vielen Bildern steigt der Speicherbedarf des Tabs.
- **Vorschlag:** Beim Ordnerwechsel alle `thumbUrl` mit `URL.revokeObjectURL` freigeben. Optional Adressen von Bildern freigeben, die weit außerhalb des sichtbaren Bereichs liegen.

#### I-023 · Keine automatische Code-Prüfung
- **Wo:** ganzes Projekt.
- **Beleg:** Code.
- **Problem:** 2.235 Zeilen in einer Datei, gemeinsamer Zustand in `S`, `V`, `M`, keine Prüfung auf Tippfehler oder unbenutzte Variablen. Die Punkte unter I-017 hätte ein Werkzeug gefunden.
- **Vorschlag:** ESLint mit dem HTML-Plugin (`eslint-plugin-html`) und den Regeln `no-unused-vars`, `no-undef`. Eine Aufteilung in Module ist nicht ratsam, solange die App per Doppelklick laufen soll, denn ES-Module lädt der Browser aus lokalen Dateien nicht.

#### I-024 · README und Doppelpflege der lokalen Datei
- **Wo:** `README.md`, lokale Kopie `pictureselector.html`.
- **Beleg:** Code.
- **Problem:** Die Überschrift „Was Version 1 kann“ passt nicht mehr, ein Punkt steht abgesetzt unter der Liste. Die lokale Datei heißt anders als die im Repo (`index.html`) und wird von Hand kopiert.
- **Vorschlag:** README neu gliedern (Sichten, Bewerten, Ordnen, Ort, Austausch). Für die lokale Kopie ein kleines Skript oder eine ZIP-Datei pro Veröffentlichung, damit beide Stände sicher gleich sind (passt zu I-007).

---

---

## Vorgeschlagene Reihenfolge

1. I-001, I-002, I-003 zusammen (kleine Änderungen, größter Nutzen).
2. I-007 und I-009 (Klarheit, welche Version läuft, und ob die Karte überall geht).
3. I-004 und I-005 (Schutz vor Vertippern).
4. I-011 und I-012 (Tests automatisch), danach der Rest nach Bedarf.
