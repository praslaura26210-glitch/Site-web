"""Repère les dessins vectoriels d'une page (regroupement des tracés proches)."""
import sys
import cv2
import numpy as np
import pymupdf
from book import page

GAP = 6  # pt : deux tracés plus proches que ça appartiennent au même dessin
SCALE = 2  # px par pt pour la grille de regroupement


def clusters(p, gap=GAP, min_size=40):
    W, H = p.rect.width, p.rect.height
    mask = np.zeros((int(H * SCALE) + 1, int(W * SCALE) + 1), np.uint8)
    for d in p.get_drawings():
        r = d["rect"]
        if r.width > W * 0.95 and r.height > H * 0.95:
            continue  # fond de page
        x0, y0 = max(0, int(r.x0 * SCALE)), max(0, int(r.y0 * SCALE))
        x1, y1 = min(mask.shape[1] - 1, int(r.x1 * SCALE)), min(mask.shape[0] - 1, int(r.y1 * SCALE))
        if x1 >= x0 and y1 >= y0:
            mask[y0:y1 + 1, x0:x1 + 1] = 255
    k = np.ones((gap * SCALE * 2 + 1, gap * SCALE * 2 + 1), np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(mask, k), connectivity=8)
    out = []
    for i in range(1, n):
        x, y, w, h, _ = stats[i]
        r = pymupdf.Rect(x / SCALE + gap, y / SCALE + gap, (x + w) / SCALE - gap, (y + h) / SCALE - gap)
        if r.width > min_size and r.height > min_size:
            out.append(r)
    return sorted(out, key=lambda r: (round(r.y0 / 50), r.x0))


if __name__ == "__main__":
    for n in map(int, sys.argv[1:]):
        p = page(n)
        for i, r in enumerate(clusters(p)):
            words = [w[4] for w in p.get_text("words") if pymupdf.Rect(w[:4]).intersects(r + (-5, -5, 5, 25))]
            print(n, i, [round(v) for v in r], " ".join(words)[:90])
