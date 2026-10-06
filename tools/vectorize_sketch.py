"""Vectorise un dessin à la main en traits (lignes médianes), pour une animation trait par trait.

Usage : python3 tools/vectorize_sketch.py image.webp sortie.svg [seuil] [longueur_min_px]

Méthode : niveaux de gris -> seuillage adaptatif -> squelette (ligne médiane des traits)
-> suivi des branches -> simplification (Douglas-Peucker) -> tri dans un ordre « de dessinateur » :
les grands traits de construction d'abord, puis les hachures, balayées de gauche à droite.
Chaque <path> porte data-o (ordre) et l'épaisseur moyenne mesurée sur l'original.
"""
import sys

import cv2
import numpy as np
from skimage.morphology import skeletonize, remove_small_objects

NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def trace(skel):
    h, w = skel.shape
    sk = skel.copy()
    deg = np.zeros_like(sk, dtype=np.uint8)
    pad = np.pad(sk, 1).astype(np.uint8)
    for dy, dx in NB:
        deg += pad[1 + dy:h + 1 + dy, 1 + dx:w + 1 + dx]
    deg = deg * sk
    # on coupe aux jonctions : chaque branche devient un trait
    sk[deg > 2] = False
    visited = np.zeros_like(sk)
    ys, xs = np.nonzero(sk)
    pts = set(zip(ys.tolist(), xs.tolist()))
    strokes = []

    def nbrs(y, x):
        for dy, dx in NB:
            q = (y + dy, x + dx)
            if q in pts and not visited[q]:
                yield q

    # extrémités d'abord, puis boucles restantes
    ends = [p for p in pts if sum(1 for dy, dx in NB if (p[0] + dy, p[1] + dx) in pts) == 1]
    for start in ends + list(pts):
        if visited[start]:
            continue
        line = [start]
        visited[start] = True
        cur = start
        while True:
            nxt = next(nbrs(*cur), None)
            if nxt is None:
                break
            visited[nxt] = True
            line.append(nxt)
            cur = nxt
        strokes.append(np.array([(x, y) for y, x in line], dtype=np.float32))
    return strokes


def main(src, out, block=41, c=12, min_len=14):
    img = cv2.imread(src, cv2.IMREAD_GRAYSCALE)
    h, w = img.shape
    blur = cv2.GaussianBlur(img, (3, 3), 0)
    ink = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, block, c)
    ink = remove_small_objects(ink > 0, 24)
    dist = cv2.distanceTransform(ink.astype(np.uint8), cv2.DIST_L2, 3)
    skel = skeletonize(ink)
    strokes = []
    for s in trace(skel):
        if len(s) < 2:
            continue
        length = float(np.sum(np.linalg.norm(np.diff(s, axis=0), axis=1)))
        if length < min_len:
            continue
        approx = cv2.approxPolyDP(s.reshape(-1, 1, 2), 0.9, False).reshape(-1, 2)
        ix = np.clip(s.astype(int), 0, [w - 1, h - 1])
        thick = float(np.mean(dist[ix[:, 1], ix[:, 0]])) * 2
        strokes.append((approx, length, thick))
    # ordre : 1) traits longs (construction) du plus long au plus court, 2) le reste de gauche à droite
    strokes.sort(key=lambda t: -t[1])
    n_long = max(1, len(strokes) // 12)
    longs, rest = strokes[:n_long], strokes[n_long:]
    rest.sort(key=lambda t: (float(t[0][:, 0].mean()) // 60, float(t[0][:, 1].mean())))
    ordered = longs + rest
    paths = []
    for i, (pts, length, thick) in enumerate(ordered):
        d = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts)
        sw = max(0.8, min(3.2, thick))
        paths.append(f'<path d="{d}" stroke-width="{sw:.1f}" data-o="{i}" data-l="{length:.0f}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
           f'<title>Dessin à la main : couloir en perspective</title>'
           f'<g fill="none" stroke="var(--encre,#2b211c)" stroke-linecap="round" stroke-linejoin="round">'
           + "".join(paths) + "</g></svg>")
    with open(out, "w") as f:
        f.write(svg)
    print(f"{len(paths)} traits ({n_long} de construction), {len(svg) // 1024} Ko")


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], a[1], *(int(v) for v in a[2:]))
