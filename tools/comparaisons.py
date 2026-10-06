"""Prépare les paires existant / projet superposables (curseur avant / après).

Les deux dessins sont rendus à la même échelle, puis recalés par corrélation de phase
(OpenCV) ; chaque paire est réécrite avec un viewBox commun, dans plans/comparaison/.
"""
import os
import re
import sys

import cv2
import numpy as np
import pymupdf

sys.path.insert(0, os.path.dirname(__file__))
from book import page  # noqa: E402
from clusters import clusters  # noqa: E402

SLUG = "entre-deux-regards"
DIR = os.path.join(os.path.dirname(__file__), "..", "content", "projets", SLUG, "plans")
PAIRES = [  # nom, (page, zone) existant, (page, zone) projet
    ("rdc", (40, 0, 6), (41, 0, 6)),
    ("etage", (40, 1, 6), (41, 1, 6)),
    ("facade-sud", (42, 2, 2), (43, 2, 2)),
    ("facade-nord", (42, 3, 2), (43, 3, 2)),
    ("facade-ouest", (42, 0, 2), (43, 0, 2)),
    ("facade-est", (42, 1, 2), (43, 1, 2)),
    ("coupe-aa", (42, 4, 2), (43, 4, 2)),
]
FICHIERS = {
    "rdc": ("plan-rdc-existant", "plan-rdc-projet"), "etage": ("plan-etage-existant", "plan-etage-projet"),
    "facade-sud": ("facade-sud-existant", "facade-sud-projet"), "facade-nord": ("facade-nord-existant", "facade-nord-projet"),
    "facade-ouest": ("facade-ouest-existant", "facade-ouest-projet"), "facade-est": ("facade-est-existant", "facade-est-projet"),
    "coupe-aa": ("coupe-aa-existant", "coupe-aa-projet"),
}
DPI = 144
MARGE = 4  # marge ajoutée par vector_svg.export


def raster(n, r):
    pix = page(n).get_pixmap(clip=r, dpi=DPI, alpha=False, colorspace=pymupdf.csGRAY)
    a = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w)
    return 255 - a.astype(np.float32)  # l'encre en positif


def shift(a, b):
    """Décalage (dx, dy) en px qui amène b sur a."""
    h, w = max(a.shape[0], b.shape[0]), max(a.shape[1], b.shape[1])
    A = np.zeros((h, w), np.float32); A[:a.shape[0], :a.shape[1]] = a
    B = np.zeros((h, w), np.float32); B[:b.shape[0], :b.shape[1]] = b
    win = cv2.createHanningWindow((w, h), cv2.CV_32F)
    (dx, dy), resp = cv2.phaseCorrelate(B * win, A * win)
    return dx, dy, resp


def murs(n, r):
    bb = None
    for d in page(n).get_drawings():
        if d["type"] in ("f", "fs") and d.get("fill") and max(d["fill"]) < 0.06 and r.contains(d["rect"]):
            bb = d["rect"] if bb is None else bb | d["rect"]
    return bb


def inner(svg):
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w, h = float(m.group(1)), float(m.group(2))
    head_end = svg.index(">", svg.index("<svg")) + 1
    body = svg[head_end:svg.rindex("</svg>")]
    return w, h, body


def main():
    out = os.path.join(DIR, "comparaison")
    os.makedirs(out, exist_ok=True)
    for nom, (pe, ze, ge), (pp, zp, gp) in PAIRES:
        re_ = clusters(page(pe), gap=ge)[ze]
        rp = clusters(page(pp), gap=gp)[zp]
        if nom in ("rdc", "etage"):
            # plans : on cale les emprises des murs noirs (plus sûr que la corrélation)
            be_, bp_ = murs(pe, re_), murs(pp, rp)
            ox, oy = (be_.x0 - re_.x0) - (bp_.x0 - rp.x0), (be_.y0 - re_.y0) - (bp_.y0 - rp.y0)
            resp = 1.0
        else:
            dx, dy, resp = shift(raster(pe, re_), raster(pp, rp))
            ox, oy = dx * 72 / DPI, dy * 72 / DPI
        fe, fp = FICHIERS[nom]
        we, he, be = inner(open(os.path.join(DIR, fe + ".svg")).read())
        wp, hp, bp = inner(open(os.path.join(DIR, fp + ".svg")).read())
        x0, y0 = min(0, ox), min(0, oy)
        x1, y1 = max(we, ox + wp), max(he, oy + hp)
        W, H = x1 - x0, y1 - y0
        for f, body, tx, ty in ((fe, be, -x0, -y0), (fp, bp, ox - x0, oy - y0)):
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H:.2f}">'
                   f'<g transform="translate({tx:.2f} {ty:.2f})">{body}</g></svg>')
            open(os.path.join(out, f + ".svg"), "w").write(svg)
        print(f"{nom:13s} décalage {ox:7.2f} {oy:7.2f} pt  confiance {resp:.2f}  cadre {W:.0f}x{H:.0f}")


if __name__ == "__main__":
    main()
