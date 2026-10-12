"""Mock-up : le book fermé, posé à plat sur un fond enduit chaux."""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

src, out = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)

W, H = 3600, 2700


def bruit(w, h, echelles):
    acc = np.zeros((h, w), np.float32)
    for s, a in echelles:
        n = rng.standard_normal((max(2, h // s), max(2, w // s))).astype(np.float32)
        img = Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += (np.asarray(img, np.float32) - 128) / 40 * a
    return acc


# --- fond : enduit chaux, ton pierre chaude, lumière rasante depuis le haut gauche
base = np.array([214, 205, 192], np.float32)
tex = bruit(W, H, [(300, 2.2), (60, 1.8), (12, 1.8), (2, 3.8)])
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
lum = 14 - 26 * ((xx / W) * 0.55 + (yy / H) * 0.45)
vign = -28 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.3 * 0.5
fond = base[None, None, :] + (tex + lum + vign)[:, :, None]
fond = Image.fromarray(fond.clip(0, 255).astype(np.uint8))

# --- couverture
cov = Image.open(src).convert("RGB")
bh = 2050
bw = round(cov.width * bh / cov.height)
cov = cov.resize((bw, bh), Image.LANCZOS)
c = np.asarray(cov, np.float32)
# papier couché mat : très léger grain + reflet diagonal doux
yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
reflet = 6 * np.exp(-(((xx / bw) - (yy / bh) * 0.7 - 0.15) ** 2) / 0.05) - 5 * (yy / bh)
grain = rng.normal(0, 1.4, (bh, bw)).astype(np.float32)
c = c + (reflet + grain)[:, :, None]
# rainure de charnière (dos carré collé) à ~9 mm du dos
rx = int(bw * 0.045)
pli = -16 * np.exp(-((xx - rx) ** 2) / (2 * 3.5 ** 2)) + 7 * np.exp(-((xx - rx - 7) ** 2) / (2 * 4 ** 2))
dos = -10 * np.clip(1 - xx / rx, 0, 1) ** 1.5
c = c + (pli + dos)[:, :, None]
cov = Image.fromarray(c.clip(0, 255).astype(np.uint8))

# --- tranche du bloc papier (épaisseur ~ 63 pages) visible à droite et en bas
ep = 16
livre = Image.new("RGBA", (bw + ep, bh + ep), (0, 0, 0, 0))
d = ImageDraw.Draw(livre)
for i in range(ep, 0, -1):
    t = 238 - (i % 3) * 7 - i * 1.2
    col = (int(t), int(t - 3), int(t - 9), 255)
    d.rectangle([i, i, bw + i - 1, bh + i - 1], fill=col)
livre.paste(cov, (0, 0))
# filet de bord sur la couverture
d.rectangle([0, 0, bw - 1, bh - 1], outline=(200, 196, 190, 255), width=1)

# --- rotation légère
ang = -5.5
livre = livre.rotate(ang, resample=Image.BICUBIC, expand=True)

# --- ombre portée : une large et douce + une serrée au contact
a = np.asarray(livre.split()[3], np.float32) / 255
def ombre(dx, dy, flou, force):
    m = Image.new("L", (W, H), 0)
    m.paste(Image.fromarray((a * 255).astype(np.uint8)), (ox + dx, oy + dy))
    return np.asarray(m.filter(ImageFilter.GaussianBlur(flou)), np.float32) / 255 * force

ox = (W - livre.width) // 2 + 40
oy = (H - livre.height) // 2 - 10
sh = 1 - (1 - ombre(45, 60, 70, 0.38)) * (1 - ombre(8, 10, 10, 0.45))
f = np.asarray(fond, np.float32) * (1 - sh[:, :, None] * 0.85)
fond = Image.fromarray(f.clip(0, 255).astype(np.uint8))
fond.paste(livre, (ox, oy), livre)
fond.save(out, quality=92)
print(out, fond.size)
