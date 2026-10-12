"""Portfolio A4 -> PDF A3 paysage en doubles pages, présentées comme un livre ouvert.

Les pages d'origine restent vectorielles : seuls le fond, les ombres et le pli
central sont des images. Page 1 = couverture seule (livre fermé), puis 2-3, 4-5...
"""
import io
import sys
import numpy as np
from PIL import Image, ImageFilter
from pypdf import PdfReader, PdfWriter, Transformation
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

src, out = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)

A4W, A4H = 595.276, 841.89
W, H = 2 * A4W, A4H              # A3 paysage
S = 0.88                         # échelle du livre dans la planche
PW, PH = A4W * S, A4H * S
X0 = (W - 2 * PW) / 2            # bord gauche du livre ouvert
Y0 = (H - PH) / 2
DPI = 150 / 72                   # px par point pour les images de fond


def bruit(w, h, echelles):
    acc = np.zeros((h, w), np.float32)
    for s, a in echelles:
        n = rng.standard_normal((max(2, h // s), max(2, w // s))).astype(np.float32)
        img = Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += (np.asarray(img, np.float32) - 128) / 40 * a
    return acc


def fond(rects):
    """Fond enduit chaux + ombres portées des rectangles (en points, origine bas-gauche)."""
    w, h = round(W * DPI), round(H * DPI)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    tex = bruit(w, h, [(200, 2.2), (40, 1.8), (8, 1.8), (1, 3.0)])
    lum = 10 - 20 * ((xx / w) * 0.55 + (yy / h) * 0.45)
    vign = -16 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) ** 1.3
    f = np.array([214, 205, 192], np.float32)[None, None, :] + (tex + lum + vign)[:, :, None]

    def masque(dx, dy, flou, grossir=0):
        m = Image.new("L", (w, h), 0)
        from PIL import ImageDraw
        d = ImageDraw.Draw(m)
        for (x, y, rw, rh) in rects:
            d.rectangle([(x - grossir + dx) * DPI, (H - y - rh - grossir + dy) * DPI,
                         (x + rw + grossir + dx) * DPI, (H - y + grossir + dy) * DPI], fill=255)
        return np.asarray(m.filter(ImageFilter.GaussianBlur(flou * DPI)), np.float32) / 255

    sh = 1 - (1 - masque(10, 14, 18) * 0.36) * (1 - masque(2, 3, 3) * 0.45)
    f = f * (1 - sh[:, :, None] * 0.85)
    buf = io.BytesIO()
    Image.fromarray(f.clip(0, 255).astype(np.uint8)).save(buf, "JPEG", quality=84)
    buf.seek(0)
    return ImageReader(buf)


def rgba(arr):
    buf = io.BytesIO()
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(buf, "PNG")
    buf.seek(0)
    return ImageReader(buf)


def degrade(profil_alpha, couleur):
    """Bande horizontale 1 px de haut : profil d'opacité de gauche à droite."""
    n = len(profil_alpha)
    a = np.zeros((1, n, 4), np.float32)
    a[0, :, :3] = couleur
    a[0, :, 3] = np.clip(profil_alpha, 0, 1) * 255
    return rgba(a)


# --- pli central : ombre forte au creux, petit reflet, sur chaque page
t = np.linspace(0, 1, 600)                          # 0 = bord ext., 1 = pli
pli_gauche_ombre = degrade(0.55 * t ** 9 + 0.10 * t ** 3, (40, 32, 24))
pli_gauche_lum = degrade(0.18 * np.exp(-((t - 0.86) ** 2) / 0.002), (255, 255, 255))
pli_droit_ombre = degrade((0.55 * t ** 9 + 0.10 * t ** 3)[::-1], (40, 32, 24))
pli_droit_lum = degrade(0.14 * np.exp(-((t[::-1] - 0.88) ** 2) / 0.002), (255, 255, 255))
# légère courbure des pages : bords extérieurs un peu assombris
bord_g = degrade(0.06 * (1 - t) ** 4, (60, 50, 40))
bord_d = degrade(0.06 * t ** 4, (60, 50, 40))
# charnière de couverture (livre fermé)
c = np.linspace(0, 1, 300)
charniere = degrade(0.22 * np.exp(-((c - 0.15) ** 2) / 0.0006) + 0.10 * (1 - c) ** 3, (40, 32, 24))


def tranche(cv, x, y, w, h, cote, n):
    """Tranche du bloc papier (feuillets empilés) ; n = épaisseur en pt."""
    for i in range(int(n * 3), 0, -1):
        d = i / 3
        g = 0.93 - (i % 3) * 0.025 - d * 0.006
        cv.setFillColorRGB(g, g * 0.985, g * 0.955)
        if cote == "g":
            cv.rect(x - d, y - d * 0.6, w, h, stroke=0, fill=1)
        elif cote == "d":
            cv.rect(x + d, y - d * 0.6, w, h, stroke=0, fill=1)
        else:  # livre fermé : droite + bas
            cv.rect(x + d * 0.7, y - d, w, h, stroke=0, fill=1)


reader = PdfReader(src)
n_pages = len(reader.pages)
planches = [[0]] + [[i, i + 1] if i + 1 < n_pages else [i] for i in range(1, n_pages, 2)]

bg_ouvert = fond([(X0 - 6, Y0 - 4, 2 * PW + 12, PH + 6)])
bg_ferme = fond([((W - PW) / 2, Y0 - 5, PW + 6, PH + 5)])
EP = 5.5  # épaisseur max de chaque côté (pt)

def une_page(dessin):
    b = io.BytesIO()
    cv = canvas.Canvas(b, pagesize=(W, H))
    dessin(cv)
    cv.save()
    return PdfReader(b).pages[0]

XF = (W - PW) / 2
fond_ouvert = une_page(lambda cv: cv.drawImage(bg_ouvert, 0, 0, W, H))
fond_ferme = une_page(lambda cv: cv.drawImage(bg_ferme, 0, 0, W, H))

def _pli(cv):
    bande = PW * 0.16
    for img, xx, ww in [(bord_g, X0, PW * 0.25), (bord_d, X0 + PW * 1.75, PW * 0.25),
                        (pli_gauche_ombre, X0 + PW - bande, bande),
                        (pli_gauche_lum, X0 + PW - bande, bande),
                        (pli_droit_ombre, X0 + PW, bande),
                        (pli_droit_lum, X0 + PW, bande)]:
        cv.drawImage(img, xx, Y0, ww, PH, mask="auto", preserveAspectRatio=False)
pli = une_page(_pli)

def _charniere(cv):
    cv.drawImage(charniere, XF, Y0, PW * 0.07, PH, mask="auto", preserveAspectRatio=False)
    cv.setStrokeColorRGB(0.82, 0.8, 0.77)
    cv.setLineWidth(0.4)
    cv.rect(XF, Y0, PW, PH, stroke=1, fill=0)
dessus_ferme = une_page(_charniere)

def bloc(k, pl):
    def d(cv):
        if k == 0:
            tranche(cv, XF, Y0, PW, PH, "f", 4.5)
            cv.setFillColorRGB(1, 1, 1)
            cv.rect(XF, Y0, PW, PH, stroke=0, fill=1)
        else:
            prog = pl[0] / (n_pages - 1)
            tranche(cv, X0, Y0, PW, PH, "g", 1.2 + EP * prog)
            tranche(cv, X0 + PW, Y0, PW, PH, "d", 1.2 + EP * (1 - prog))
            cv.setFillColorRGB(1, 1, 1)
            cv.rect(X0, Y0, 2 * PW, PH, stroke=0, fill=1)
    return une_page(d)

w = PdfWriter()
for k, pl in enumerate(planches):
    page = w.add_blank_page(W, H)
    page.merge_page(fond_ferme if k == 0 else fond_ouvert)
    page.merge_page(bloc(k, pl))
    for j, idx in enumerate(pl):
        x = XF if k == 0 else X0 + j * PW
        page.merge_transformed_page(reader.pages[idx],
                                    Transformation().scale(S, S).translate(x, Y0))
    page.merge_page(dessus_ferme if k == 0 else pli)
    page.compress_content_streams(level=9)
w.compress_identical_objects()
w.add_metadata({"/Title": "Portfolio Laura Pras – doubles pages", "/Author": "Laura Pras"})
with open(out, "wb") as f:
    w.write(f)
print(out, len(planches), "planches")
