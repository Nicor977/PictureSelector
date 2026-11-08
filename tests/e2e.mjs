// End-to-end-Test im echten Chromium (Playwright).
// Statt eines echten Ordners wird das "Origin Private File System" benutzt,
// das dieselbe Schnittstelle (FileSystemDirectoryHandle) hat.
// Aufruf: python3 tests/make_testdata.py && node tests/e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(8123);

let failed = 0;
const check = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✖ ') + msg); if (!cond) failed++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'de-DE' });
const page = await ctx.newPage();
page.on('pageerror', e => { console.log('PAGE ERROR', e.message); failed++; });
page.on('dialog', d => { console.log('     [dialog]', d.type(), d.message().slice(0, 60)); d.accept(); });
page.on('crash', () => console.log('CRASH'));
page.on('close', () => console.log('CLOSE'));

const URL_ = 'http://localhost:8123/index.html';
// Hilfsfunktionen im Browser
const helpers = `
  window.__PS_TEST__ = true; // kein gespeicherter Ordner (Headless-Chromium stürzt beim Wiederlesen von OPFS-Handles ab)
  window.__root = async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Bilder', { create: true });
  window.__readJson = async (p) => { let d = await __root(); const parts = p.split('/'); for (const x of parts.slice(0,-1)) d = await d.getDirectoryHandle(x); return JSON.parse(await (await (await d.getFileHandle(parts.at(-1))).getFile()).text()); };
  window.__exists = async (p) => { try { let d = await __root(); const parts = p.split('/'); for (const x of parts.slice(0,-1)) d = await d.getDirectoryHandle(x); await d.getFileHandle(parts.at(-1)); return true; } catch { return false; } };
  window.showDirectoryPicker = async () => __root();
  window.showSaveFilePicker = async ({ suggestedName }) => { window.__exportName = suggestedName; return (await __root()).getFileHandle('__export.json', { create: true }); };
`;
await page.addInitScript(helpers);

async function openApp() {
  await page.evaluate(() => typeof saveNow === 'function' && saveNow()).catch(() => { });
  await page.goto(URL_);
  await page.click('#btnOpen');
}
const tileNames = () => page.$$eval('#grid .tile', ts => ts.map(t => t.title.split('\n')[0]));

console.log('1) Ordner vorbereiten');
await page.goto(URL_);
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/data/manifest.json')));
await page.evaluate(async (files) => {
  const opfs = await navigator.storage.getDirectory();
  try { await opfs.removeEntry('Bilder', { recursive: true }); } catch { }
  const root = await __root();
  for (const f of files) {
    let d = root; const parts = f.split('/');
    for (const x of parts.slice(0, -1)) d = await d.getDirectoryHandle(x, { create: true });
    const buf = await (await fetch('tests/data/' + f)).arrayBuffer();
    const w = await (await d.getFileHandle(parts.at(-1), { create: true })).createWritable(); await w.write(buf); await w.close();
  }
  indexedDB.deleteDatabase('pictureselector');
}, manifest);

console.log('2) Öffnen, Person wählen, Sortierung');
await openApp();
await page.waitForSelector('#dlg[open] .persons button');
await page.click('#dlg .persons button:has-text("Nico")');
await page.waitForSelector('#grid .tile');
let names = await tileNames();
console.log('     ' + names.join(', '));
check(names.length === 9, '9 Bilder (Video ignoriert): ' + names.length);
check(names[0] === '2025/Kroatien/IMG_0001.jpg' && names[1] === '2025/Kroatien/IMG_0042.heic' && names[2] === '2025/Handy/IMG_0001.jpg' && names[3] === '2025/Kroatien/IMG_0002.jpg', 'nach EXIF-Zeit über Kameras gemischt');
await page.waitForFunction(() => document.querySelectorAll('#grid .tile img').length >= 9, null, { timeout: 30000 }).catch(() => { });
check(await page.$$eval('#grid .tile img', x => x.length) === 9, 'alle Vorschaubilder erzeugt (inkl. HEIC)');
const heicThumb = await page.$eval('#grid .tile[title^="2025/Kroatien/IMG_0042.heic"] img', i => i.naturalWidth + 'x' + i.naturalHeight).catch(() => 'none');
check(heicThumb === '420x315', 'HEIC-Vorschau dekodiert: ' + heicThumb);
const rot = await page.$$eval('#grid .tile', ts => { const t = ts.find(x => x.title.startsWith('2025/Handy/hochkant')); const i = t.querySelector('img'); return i.naturalWidth + 'x' + i.naturalHeight; });
check(rot === '315x420', 'EXIF-Drehung (Orientation 6) beachtet: ' + rot);
await page.screenshot({ path: 'tests/shot-grid.png' });

console.log('3) Bewerten und Taggen');
await page.click('#grid .tile:nth-child(1)');
await page.keyboard.press('4');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('5');
await page.keyboard.press('t');
await page.fill('#newTag', 'Urlaub Kroatien 2025');
await page.press('#newTag', 'Enter');
await page.click('#dlgFoot button');
await page.waitForTimeout(1500);
let data = await page.evaluate(() => __readJson('pictureselector.json'));
check(data.images['2025/Kroatien/IMG_0001.jpg']?.stars.Nico === 4, 'Sterne gespeichert (4)');
check(data.images['2025/Kroatien/IMG_0042.heic']?.stars.Nico === 5, 'HEIC bewertet (5)');
check(data.images['2025/Kroatien/IMG_0042.heic']?.tags.includes('Urlaub Kroatien 2025'), 'Tag gespeichert');
check(data.images['2025/Kroatien/IMG_0042.heic']?.id?.exif === '2025-08-14T10:22:31.45|Apple|iPhone 13|800x600', 'EXIF-Fingerabdruck: ' + data.images['2025/Kroatien/IMG_0042.heic']?.id?.exif);
check(/^\d+\|[0-9a-f]{8}$/.test(data.images['2025/Kroatien/IMG_0001.jpg']?.id?.quick || ''), 'Schnell-Hash vorhanden');
// zweites Speichern erzeugt Sicherung
await page.keyboard.press('3'); await page.waitForTimeout(1500);
check(await page.evaluate(() => __exists('pictureselector.bak.json')), 'Sicherung pictureselector.bak.json geschrieben');
await page.keyboard.press('5'); await page.waitForTimeout(1200);

// Klick auf Stern im Raster
await page.click('#grid .tile[title^="2025/Handy/serie_1.jpg"] .stars span[data-s="3"]');
await page.waitForTimeout(1200);
data = await page.evaluate(() => __readJson('pictureselector.json'));
check(data.images['2025/Handy/serie_1.jpg']?.stars.Nico === 3, 'Stern im Raster angeklickt (3)');
await page.click('#grid .tile[title^="2025/Handy/serie_1.jpg"] .stars span[data-s="3"]');
await page.waitForTimeout(1200);
data = await page.evaluate(() => __readJson('pictureselector.json'));
check(!data.images['2025/Handy/serie_1.jpg']?.stars.Nico, 'gleicher Stern nochmal = entfernt');
await page.click('#grid .tile:nth-child(2)');

console.log('4) Einzelansicht');
await page.keyboard.press('Enter');
await page.waitForSelector('#viewer:not(.hidden)');
await page.waitForFunction(() => document.querySelector('#vImg').naturalWidth > 0);
check(await page.$eval('#vImg', i => i.naturalWidth) === 800, 'HEIC in voller Größe angezeigt');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('2');
await page.waitForTimeout(300);
await page.screenshot({ path: 'tests/shot-viewer.png' });
await page.keyboard.press('Escape');

console.log('5) Filter');
await page.selectOption('#fStars label:has-text("Nico") select', '4');
names = await tileNames();
check(names.length === 2, 'Filter Nico ≥ 4: ' + names.length);
await page.selectOption('#fStars label:has-text("Nico") select', 'any');
await page.click('#tagFilter .chip:has-text("Urlaub")');
check((await tileNames()).length === 1, 'Tag-Filter');
await page.click('#tagFilter .chip:has-text("Urlaub")');

console.log('5b) Sterne-Übersicht');
const stat = v => page.$eval(`#stats .chip[data-v="${v}"] b`, b => +b.textContent);
const sc = { all: await stat('any'), none: await stat('none'), s1: await stat('e1'), s2: await stat('e2'), s3: await stat('e3'), s4: await stat('e4'), s5: await stat('5') };
console.log('     ', JSON.stringify(sc));
check(sc.all === 9 && sc.none + sc.s1 + sc.s2 + sc.s3 + sc.s4 + sc.s5 === 9, 'Übersicht: Summe stimmt mit Gesamtzahl überein');
check(sc.s4 === 1 && sc.s5 === 1 && sc.s2 === 1, 'Übersicht zählt 1× ★★, 1× ★★★★, 1× ★★★★★');
await page.click('#stats .chip[data-v="e4"]');
check((await tileNames()).length === 1 && await page.$eval('#fStars label:has-text("Nico") select', s => s.value) === 'e4', 'Klick auf ★★★★ filtert genau 4 Sterne');
check(await stat('none') === sc.none, 'Übersicht bleibt beim Filtern vollständig');
await page.click('#stats .chip[data-v="none"]');
check((await tileNames()).length === sc.none, 'Klick auf „ohne ★“ zeigt unbewertete');
await page.click('#grid .tile:nth-child(1)'); await page.keyboard.press('1'); await page.waitForTimeout(100);
check(await stat('none') === sc.none - 1 && await stat('e1') === sc.s1 + 1, 'Übersicht aktualisiert sich beim Bewerten');
await page.keyboard.press('0'); await page.keyboard.press('Escape');
await page.screenshot({ path: 'tests/shot-stats.png' });
await page.click('#stats .chip[data-v="none"]');
check(await page.$eval('#fStars label:has-text("Nico") select', s => s.value) === 'any', 'zweiter Klick hebt Filter auf');

console.log('6) Verschieben mit Namenskollision');
// IMG_0001.jpg aus Handy und aus Kroatien in denselben neuen Ordner
await page.click('#grid .tile[title^="2025/Kroatien/IMG_0001.jpg"]');
await page.click('#grid .tile[title^="2025/Handy/IMG_0001.jpg"]', { modifiers: ['Control'] });
await page.keyboard.press('m');
await page.fill('#newDir', 'Auswahl');
await page.click('#dlgFoot button.primary');
await page.waitForTimeout(1500);
check(await page.evaluate(() => __exists('Auswahl/IMG_0001.jpg')) && await page.evaluate(() => __exists('Auswahl/IMG_0001_1.jpg')), 'beide verschoben, zweite als IMG_0001_1.jpg');
check(!(await page.evaluate(() => __exists('2025/Kroatien/IMG_0001.jpg'))), 'Original ist weg');
data = await page.evaluate(() => __readJson('pictureselector.json'));
check(data.images['Auswahl/IMG_0001.jpg']?.stars.Nico === 4, 'Bewertung ist mitgewandert');

console.log('7) Papierkorb und Wiederherstellen');
await page.click('#grid .tile[title^="WhatsApp/"]');
await page.keyboard.press('Delete');
await page.waitForTimeout(800);
check(await page.evaluate(() => __exists('_Papierkorb/WhatsApp/IMG-20250901-WA0001.jpg')), 'in _Papierkorb mit Ursprungspfad');
check((await tileNames()).length === 8, 'aus der Ansicht verschwunden');
await page.click('#btnTrashView');
check((await tileNames()).length === 1, 'Papierkorb-Ansicht zeigt 1 Bild');
await page.click('#grid .tile');
await page.click('#sRestore');
await page.waitForTimeout(800);
check(await page.evaluate(() => __exists('WhatsApp/IMG-20250901-WA0001.jpg')), 'wiederhergestellt');
await page.click('#btnTrashView');

console.log('8) Export');
await page.click('#btnExport');
await page.click('#dlgFoot button.primary');
await page.waitForTimeout(800);
const exp = await page.evaluate(() => __readJson('__export.json'));
const expName = await page.evaluate(() => window.__exportName);
check(/^bewertungen-nico-\d{4}-\d{2}-\d{2}\.json$/.test(expName), 'Dateiname ' + expName);
check(exp.person === 'Nico' && exp.images.length >= 3 && exp.images.every(i => i.id), 'Export enthält Nicos Sterne mit Fingerabdruck');

console.log('9) Wiedererkennung nach Umbenennen außerhalb des Tools');
await page.evaluate(async () => {
  const r = await __root(); const d = await (await r.getDirectoryHandle('2025')).getDirectoryHandle('Kroatien');
  const h = await d.getFileHandle('IMG_0042.heic'); await h.move('20250814_102231.heic');
});
await openApp();
await page.waitForSelector('#dlg[open] .persons button');
await page.click('#dlg .persons button:has-text("Nico")');
await page.waitForTimeout(1800);
data = await page.evaluate(() => __readJson('pictureselector.json'));
check(data.images['2025/Kroatien/20250814_102231.heic']?.stars.Nico === 5 && !data.images['2025/Kroatien/IMG_0042.heic'], 'Bewertung dem umbenannten Bild zugeordnet');

console.log('10) Import von Simone (andere Ordnerstruktur)');
const heicId = data.images['2025/Kroatien/20250814_102231.heic'].id;
const a2 = (await page.evaluate(() => __readJson('pictureselector.json')));
const simone = { type: 'pictureselector-export', version: 1, person: 'Simone', tags: ['Familie'], images: [
  { path: 'Urlaub/irgendwas.heic', id: { exif: heicId.exif }, stars: 3, tags: ['Familie'] },
  { path: 'gibtsnicht.jpg', id: { quick: '1|deadbeef' }, stars: 5 },
] };
fs.writeFileSync('/tmp/claude-0/simone.json', JSON.stringify(simone));
void a2;
await page.setInputFiles('#importFile', '/tmp/claude-0/simone.json');
await page.waitForSelector('#dlg[open]');
const rep = await page.$eval('#dlgBody', b => b.textContent);
check(rep.includes('1 Bilder zugeordnet') && rep.includes('1 nicht gefunden'), 'Bericht: ' + rep.slice(0, 80));
await page.click('#dlgFoot button');
await page.waitForTimeout(1500);
data = await page.evaluate(() => __readJson('pictureselector.json'));
const e = data.images['2025/Kroatien/20250814_102231.heic'];
check(e.stars.Simone === 3 && e.stars.Nico === 5, 'Simones Sterne ergänzt, Nicos unverändert');
check(e.tags.includes('Familie') && e.tags.includes('Urlaub Kroatien 2025'), 'Tags zusammengeführt');
check(data.people.includes('Simone'), 'Simone in Personenliste');

console.log('11) Zeitkorrektur und Englisch');
await page.click('#btnSettings');
const camInput = page.locator('#setCams .it:has-text("Canon EOS 250D") input');
await camInput.fill('-3'); await camInput.dispatchEvent('change');
await page.selectOption('#setLang', 'en');
await page.click('#dlgFoot button');
names = await tileNames();
check(names[0] === 'Auswahl/IMG_0001.jpg' && names[1] === '2025/Kroatien/IMG_0002.jpg', 'Canon -3h: 11:00 → 08:00 rutscht vor die iPhone-Bilder: ' + names.slice(0, 3).join(', '));
check((await page.textContent('#btnExport')) === 'Export', 'Oberfläche auf Englisch');
await page.screenshot({ path: 'tests/shot-en.png' });

await browser.close(); server.close();
console.log(failed ? `\n${failed} FEHLER` : '\nAlle Tests bestanden');
process.exit(failed ? 1 : 0);
