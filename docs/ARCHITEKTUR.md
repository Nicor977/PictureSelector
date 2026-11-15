# Architektur – Picture Selector

Stand: 15.11.2026 · Quelle: lokaler Klon, `main` nach PR #5 (Commit `8517974`), `index.html` komplett gelesen
Nicht belegte Angaben sind mit (unverifiziert) markiert.

## Zweck
Picture Selector bringt Ordnung in einen großen Fotobestand (ca. 6.000 Bilder und mehr) auf der eigenen Festplatte: sichten, mit Sternen bewerten, taggen, verschieben, umbenennen, nach Ort filtern. Nutzer sind Nico und Simone auf verschiedenen Computern, eventuell Freunde. Es gibt keinen Server und keine Cloud, die Bilder verlassen den Rechner nicht.

## Überblick
Die ganze App ist eine einzige HTML-Datei mit eingebettetem CSS und JavaScript. Sie läuft in Edge oder Chrome und greift über die File System Access API direkt auf einen vom Nutzer gewählten Ordner zu.

```
Browser (Edge/Chrome)
 ├─ index.html  ── UI, Logik, Zustand (S, V, M)
 │    ├─ lib/exifr.umd.js              EXIF lesen (immer geladen)
 │    ├─ lib/libheif-bundle.js         HEIC dekodieren (erst bei Bedarf)
 │    └─ lib/leaflet/*                 Karte (erst beim Öffnen der Karte)
 ├─ File System Access API ── Bilderordner auf der Festplatte
 │    ├─ Bilder (.jpg .jpeg .png .heic .heif), Unterordner, _Papierkorb/
 │    ├─ pictureselector.json          Sterne, Tags, Drehungen, Ortsnamen
 │    └─ pictureselector.bak.json      voriger Stand
 ├─ IndexedDB "pictureselector" ── Zwischenspeicher (kv, meta, thumbs)
 └─ Internet (nur für Karte und Ortsnamen, sonst nichts)
```

Veröffentlicht wird über GitHub Pages: https://nicor977.github.io/PictureSelector/. Die App läuft auch per Doppelklick als lokale Datei (`file://`), dann mit Einschränkungen bei den Kartendiensten.

## Module
Es gibt keine getrennten Quelldateien. Die „Module“ sind Abschnitte in `index.html`, jeweils mit einem Kommentar `/* ---- Name ---- */` eingeleitet.

| Abschnitt in `index.html` | Verantwortung | Abhängig von |
|---|---|---|
| Texte DE/EN (`I18N`, `t()`, `applyLang()`) | Alle Oberflächentexte in Deutsch und Englisch | – |
| Hilfsfunktionen (`$`, `esc`, `toast`, `progress`, `pool`) | DOM-Zugriff, HTML-Schutz, Fortschritt, begrenzte Parallelität | – |
| IndexedDB (`DB`) | Zwischenspeicher: `kv` (zuletzt geöffnete Ordner), `meta` (EXIF je Datei), `thumbs` (Vorschaubilder) | – |
| Zustand (`S`) | Ordner, Daten, Dateiliste, Ansicht, Auswahl, Filter | – |
| Start (`getRecents`, `rememberRecent`, `openRoot`, `normalizeData`) | Ordner wählen, Rechte holen, JSON laden, Liste „Zuletzt geöffnet“ | DB, Einlesen |
| Einlesen (`scanAll`, `getMeta`, `heicExifFallback`, `gpsOf`, `computeSortTimes`) | Unterordner durchlaufen, EXIF-Zeit, Kamera, Maße, GPS lesen, Sortierzeit | exifr, DB |
| Person (`choosePerson`, `setPerson`) | Wer bewertet; Sterne gelten pro Person | Zustand |
| Daten ändern (`entryOf`, `pruneEntry`, `setStars`, `toggleTag`) | Sterne und Tags setzen, leere Einträge entfernen | Speichern |
| Speichern (`markDirty`, `saveNow`, `writeText`) | JSON verzögert schreiben (0,8 s), vorher Sicherungskopie | File System Access API |
| Filter und Übersicht (`renderFilters`, `computeView`, `renderStats`) | Ordner-, Sterne-, Tag-, Orts- und Kartenfilter, Sterne-Zählung | Zustand |
| Raster (`renderAll`, `fillTile`, `onIntersect`, `setFocus`) | Kacheln aufbauen, Auswahl, Tastaturfokus | Vorschaubilder |
| Vorschaubilder (`Thumbs`) | Warteschlange, 420 px, Ablage in IndexedDB | Dekodieren, DB |
| Dekodieren (`Decode`) | JPG/PNG über den Browser, HEIC über libheif | libheif |
| Einzelansicht (`V`, `openViewer`, `showViewer`, `renderStrip`) | Vollbild, Leiste mit allen Bildern, Sterne, Tags | Dekodieren |
| Ort (`hasGeo`, `placeOf`, `inBounds`, `renderPlaceFilter`, `renderViewerGeo`) | Koordinaten anzeigen, Ortsfilter, Kartenlinks | Zustand |
| Kartenansicht (`M`, `loadLeaflet`, `openMap`, `updateMapMarkers`, `onMapMove`) | Karte mit zusammengefassten Punkten, Raster folgt dem Ausschnitt | Leaflet, Kartendienst |
| Ortsnamen (`placesDialog`, `lookupPlaces`, `parsePlace`, `placeSuggestions`) | Ortsnamen nur auf Knopfdruck holen und speichern, Tag-Vorschläge | Nominatim |
| Dialoge (`openDialog`, `tagDialog`, `moveDialog`) | Gemeinsamer Dialograhmen, Tags, Zielordner | – |
| Drehen und Spiegeln (`transformFiles`, `writeJpegOrientation`, `insertJpegOrientation`, `rewritePng`) | JPG verlustfrei über EXIF, PNG neu speichern, HEIC nur in der Anzeige | File System Access API |
| Umbenennen (`planRename`, `renameDialog`) | Name aus Aufnahmezeit, Vorschau, nie überschreiben | Verschieben |
| Verschieben (`moveFiles`, `moveOne`, `freeName`, `trashFiles`, `restoreFiles`) | Verschieben, Papierkorb, Wiederherstellen, Namenskollisionen | File System Access API |
| Wiedererkennung (`buildIndex`, `candidatesFor`, `reidentify`) | Umbenannte oder verschobene Bilder ihren Bewertungen zuordnen | Einlesen |
| Export / Import (`exportDialog`, `importFile`, `applyImport`) | Bewertungen zwischen Computern austauschen | Wiedererkennung |
| Einstellungen, Ereignisse (`settingsDialog`, `bind`, `onKey`) | Personen, Tags, Zeitkorrektur, Tastatur | alle |

Weitere Dateien:

| Pfad | Verantwortung |
|---|---|
| `lib/` | Mitgelieferte Bibliotheken samt Lizenztexten |
| `tests/make_testdata.py` | Erzeugt Testbilder mit EXIF und GPS (Pillow, pillow-heif) |
| `tests/e2e.mjs` | Browser-Test mit Playwright; nutzt das Origin Private File System statt eines echten Ordners |
| `.github/workflows/pages.yml` | Veröffentlicht `index.html` und `lib/` bei jedem Push auf `main` |

## Datenfluss
1. **Öffnen:** Ordner wählen → `openRoot()` lädt `pictureselector.json` → `scanAll()` läuft alle Unterordner ab und liest pro Bild die Metadaten (aus IndexedDB oder per exifr) → Person wählen → `reidentify()` ordnet verwaiste Bewertungen zu.
2. **Anzeigen:** `computeView()` filtert und sortiert `S.files` → `renderAll()` baut die Kacheln → sichtbare Kacheln fordern Vorschaubilder bei `Thumbs` an.
3. **Ändern:** `setStars()` / `toggleTag()` ändern `S.data.images[Pfad]` → `markDirty()` → nach 0,8 s `saveNow()`: voriger Stand nach `.bak.json`, dann neue JSON-Datei.
4. **Dateien bewegen:** `moveFiles()` verschiebt die Datei, zieht den Eintrag in `S.data.images` auf den neuen Pfad um und speichert sofort.

Aufbau von `pictureselector.json`: `people`, `tags`, `cameraOffsets`, `places` (Ortsnamen je gerundeter Koordinate), `images` (je Pfad: `stars` pro Person, `tags`, optional `orient`, `id` mit Prüfsumme und EXIF-Schlüssel).

## Externe Abhängigkeiten
| System/Dienst | Wofür | Wo im Code |
|---|---|---|
| exifr 7.1.3 (lokal in `lib/`) | EXIF und GPS lesen | `getMeta()`, `heicExifFallback()` |
| libheif-js 1.19.8 (lokal, sonst jsDelivr) | HEIC dekodieren | `Decode.loadLib()` |
| Leaflet 1.9.4 + markercluster 1.5.3 (lokal, sonst jsDelivr) | Karte | `loadLeaflet()` |
| OpenStreetMap-Kacheln | Kartenhintergrund auf GitHub Pages | `TILE_LAYERS.osm` |
| Esri World Street Map / World Imagery | Kartenhintergrund, Voreinstellung bei `file://` | `TILE_LAYERS.esri`, `.sat` |
| Nominatim (OpenStreetMap) | Ortsnamen, nur auf Knopfdruck | `lookupPlaces()` |
| GitHub Pages | Hosting | `.github/workflows/pages.yml` |

## Kritische Bereiche (beim Review besonders genau prüfen)
- `saveNow()`, `writeText()`, `normalizeData()`: Hier entscheidet sich, ob Bewertungen verloren gehen. Die JSON-Datei ist der einzige Speicherort.
- `moveFiles()`, `moveOne()`, `freeName()`: Bewegen echte Dateien. Nie überschreiben, Original erst nach geprüfter Kopie entfernen.
- `writeJpegOrientation()`, `insertJpegOrientation()`, `rewritePng()`: Schreiben in die Bilddateien selbst.
- `pruneEntry()` und jede Stelle, die Einträge aus `S.data.images` löscht: Neue Felder müssen dort berücksichtigt werden (siehe I-003).
- `reidentify()`, `applyImport()`: Falsche Zuordnung überträgt Bewertungen auf das falsche Bild.
- `lookupPlaces()`: Einzige Stelle, an der Daten den Rechner verlassen. Nur gerundete Koordinaten, nur nach Bestätigung, höchstens 1 Anfrage pro Sekunde.
- Jede Stelle mit `innerHTML`: Dateinamen, Tags, Personen und Ortsnamen müssen durch `esc()` laufen.
- `scanAll()`, `getMeta()`: Eine Änderung an `m.v` (Versionsnummer des Zwischenspeichers) zwingt alle Nutzer zum erneuten Einlesen.

## Offene Fragen
- Funktionieren die Esri-Karten und der Ortsdienst, wenn die App als lokale Datei geöffnet wird? (unverifiziert, siehe I-009)
- Verhalten mit 6.000 echten, großen Bildern auf einer Festplatte: Nur mit kleinen Testdateien gemessen. (unverifiziert)
- Nutzungsbedingungen von Esri für Kachelabrufe ohne Konto. (unverifiziert)
