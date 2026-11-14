"""Erzeugt Testbilder mit EXIF in tests/data (JPG, HEIC, PNG, ein Video-Dummy).
Benötigt: pip install pillow pillow-heif"""
import os, json, shutil
from PIL import Image, ImageDraw
import pillow_heif
pillow_heif.register_heif_opener()

OUT = os.path.join(os.path.dirname(__file__), 'data')
shutil.rmtree(OUT, ignore_errors=True)

def img(path, color, label, make=None, model=None, dt=None, sub=None, size=(800, 600), orient=None, fmt='JPEG', gps=None):
    full = os.path.join(OUT, path); os.makedirs(os.path.dirname(full), exist_ok=True)
    im = Image.new('RGB', size, color); d = ImageDraw.Draw(im)
    d.rectangle([10, 10, 120, 60], fill=(255, 255, 255)); d.text((20, 25), label, fill=(0, 0, 0))
    ex = Image.Exif()
    if make: ex[0x010f] = make
    if model: ex[0x0110] = model
    if orient: ex[0x0112] = orient
    if dt:
        e = ex.get_ifd(0x8769); e[0x9003] = dt
        if sub: e[0x9291] = sub
        e[0xa002] = size[0]; e[0xa003] = size[1]
    if gps:  # (lat, lon) in Grad -> GPS-IFD wie bei Handys (Grad, Minuten, Sekunden)
        def dms(v):
            v = abs(v); d = int(v); m = int((v - d) * 60); s = round(((v - d) * 60 - m) * 60, 4)
            return (float(d), float(m), s)
        g = ex.get_ifd(0x8825)
        g[0] = b'\x02\x02\x00\x00'
        g[1] = 'N' if gps[0] >= 0 else 'S'; g[2] = dms(gps[0])
        g[3] = 'E' if gps[1] >= 0 else 'W'; g[4] = dms(gps[1])
    kw = {'exif': ex.tobytes()} if (make or dt) else {}
    im.save(full, fmt, **kw)
    return path

files = [
    img('2025/Kroatien/IMG_0001.jpg', (200, 60, 60), 'A1', 'Canon', 'Canon EOS 250D', '2025:08:14 09:00:00', gps=(43.5081, 16.4402)),
    img('2025/Kroatien/IMG_0002.jpg', (60, 200, 60), 'A2', 'Canon', 'Canon EOS 250D', '2025:08:14 11:00:00', gps=(43.5085, 16.4410)),
    img('2025/Kroatien/IMG_0042.heic', (60, 60, 200), 'H1', 'Apple', 'iPhone 13', '2025:08:14 10:22:31', '45', fmt='HEIF', gps=(43.5081, 16.4402)),
    img('2025/Handy/IMG_0001.jpg', (200, 200, 60), 'B1', 'Apple', 'iPhone 13', '2025:08:14 10:30:00', '12', size=(600, 800), gps=(42.6507, 18.0944)),
    img('2025/Handy/hochkant.jpg', (60, 200, 200), 'R6', 'Apple', 'iPhone 13', '2025:08:15 08:00:00', '01', orient=6),
    img('2025/Handy/serie_1.jpg', (120, 120, 120), 'S1', 'Apple', 'iPhone 13', '2025:08:16 12:00:00', gps=(-33.8568, 151.2153)),
    img('2025/Handy/serie_2.jpg', (130, 130, 130), 'S2', 'Apple', 'iPhone 13', '2025:08:16 12:00:00'),
    img('WhatsApp/IMG-20250901-WA0001.jpg', (220, 120, 40), 'W1'),
    img('Screens/screenshot.png', (40, 40, 40), 'P1', fmt='PNG'),
]
os.makedirs(os.path.join(OUT, 'Videos'), exist_ok=True)
open(os.path.join(OUT, 'Videos', 'clip.mp4'), 'wb').write(b'\0' * 100)
files.append('Videos/clip.mp4')
json.dump(files, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('ok', len(files))
