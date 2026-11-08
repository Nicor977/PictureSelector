# Picture Selector

Fotos sichten, bewerten, taggen und sortieren – direkt auf der eigenen Festplatte, im Browser (Edge oder Chrome). Kein Server, keine Cloud, nichts wird hochgeladen.

## Starten

1. In **Microsoft Edge** oder **Google Chrome** öffnen: https://nicor977.github.io/PictureSelector/ (oder lokal `index.html` per Doppelklick).
2. **Bilderordner öffnen** und den Zugriff erlauben (Lesen und Schreiben).
3. Person wählen, die bewertet (z.B. Nico oder Simone).

Der Ordner `lib/` muss neben `index.html` liegen (EXIF-Leser und HEIC-Decoder).

## Was Version 1 kann

- Liest alle Unterordner ein: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`. Videos und andere Dateien werden ignoriert.
- Sortiert alle Bilder nach Aufnahmezeit (EXIF), über alle Kameras und Handys hinweg. Ohne EXIF zählt das Dateidatum. Zeitkorrektur pro Kamera unter *Einstellungen*.
- Raster mit Vorschaubildern (werden im Browser zwischengespeichert) und Einzelansicht.
- **Sterne pro Person** (1–5), **Tags gemeinsam**. Filter nach Ordner, Sternen jeder Person (z.B. „Nico ≥ 4 und Simone ≥ 4“) und Tags.
- **Sterne-Übersicht** unter den Filtern: wie viele Bilder es gibt, wie viele davon ohne Sterne und wie viele mit 1, 2, 3, 4 oder 5 Sternen – für die gewählte Person und passend zum Ordner-/Tag-Filter. Ein Klick auf eine Zahl zeigt genau diese Bilder, ein zweiter Klick hebt den Filter wieder auf. Im Sterne-Filter gibt es dafür zusätzlich „= 1 ★“ bis „= 4 ★“.
- **Verschieben** in einen Zielordner innerhalb des Hauptordners (auch neu anlegen). Gibt es den Namen im Ziel schon, wird `_1`, `_2` … angehängt, nie überschrieben.
- **Löschen = Verschieben nach `_Papierkorb/`** mit Ursprungspfad. In der Papierkorb-Ansicht kann man Bilder wiederherstellen. Endgültig löschen macht man selbst im Explorer.
- **Export/Import**: „Exportieren“ speichert die eigenen Sterne und alle Tags in eine Datei (z.B. `bewertungen-simone-2026-11-08.json`). Auf dem anderen Computer „Importieren“: Die Bilder werden über ihren Fingerabdruck zugeordnet, die Ordnerstruktur darf abweichen. Ein Import ändert nur die Sterne der exportierenden Person; Tags werden ergänzt.
- **Wiedererkennung** umbenannter oder verschobener Bilder: über Dateigröße + Prüfsumme der ersten 64 KB, sonst über EXIF (Aufnahmezeit mit Sekundenbruchteil, Hersteller, Modell, Bildgröße). Passen mehrere Bilder, fragt das Tool nach.
- Oberfläche auf Deutsch und Englisch.

Umbenennen nach Aufnahmezeit (`YYYYMMDD_HHmmss`) kommt in Version 2.

## Tastatur

| Taste | Wirkung |
|---|---|
| ← → ↑ ↓ | Bild wechseln (Shift = Bereich auswählen) |
| 1–5 / 0 | Sterne setzen / entfernen (für alle ausgewählten Bilder) |
| Enter, Doppelklick | Einzelansicht |
| T | Tags |
| M | Verschieben |
| Entf | In den Papierkorb |
| Strg+A | Alle angezeigten auswählen |
| Esc | Schließen / Auswahl aufheben |

## Datenablage

Alles steht in `pictureselector.json` im gewählten Hauptordner, die Bilder selbst werden nie verändert. Vor jedem Speichern wird der vorige Stand nach `pictureselector.bak.json` gesichert.

```json
{
  "version": 1,
  "people": ["Nico", "Simone"],
  "tags": ["Urlaub Kroatien 2025"],
  "cameraOffsets": { "Canon EOS 250D": 3600 },
  "images": {
    "2025/Kroatien/IMG_0042.heic": {
      "stars": { "Nico": 4, "Simone": 5 },
      "tags": ["Urlaub Kroatien 2025"],
      "id": { "exif": "2025-08-14T10:22:31.45|Apple|iPhone 13|4032x3024", "quick": "3481233|9f2c1a7e" }
    }
  }
}
```

## Technik

- Eine HTML-Datei mit reinem JavaScript, kein Build-Schritt.
- File System Access API (nur Edge/Chrome).
- `lib/exifr.umd.js` – [exifr](https://github.com/MikeKovarik/exifr) 7.1.3 (MIT) zum Lesen der EXIF-Daten.
- `lib/libheif-bundle.js` – [libheif-js](https://github.com/catdad-experiments/libheif-js) 1.19.8 (LGPL-3.0) zum Anzeigen von HEIC. Wird nur geladen, wenn HEIC-Dateien vorkommen; falls die Datei fehlt, wird sie von jsDelivr geladen.

## Veröffentlichen

Jeder Merge nach `main` veröffentlicht `index.html` und `lib/` automatisch auf GitHub Pages (`.github/workflows/pages.yml`). Einmalig nötig: *Settings → Pages → Source: GitHub Actions*.

## Tests

```bash
pip install pillow pillow-heif
python3 tests/make_testdata.py   # erzeugt Testbilder in tests/data
node tests/e2e.mjs               # Browser-Test mit Playwright/Chromium
```
