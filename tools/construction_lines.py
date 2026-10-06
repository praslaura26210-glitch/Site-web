"""Extrait les grandes lignes de construction d'un dessin (segments droits longs : poteaux,
lignes de fuite, rives) pour la première phase de l'intro : le dessin se « construit » avant
que les hachures de la main n'apparaissent.

Usage : python3 tools/construction_lines.py image.png sortie.svg
"""
import sys

import cv2
import numpy as np


def merge(segs, ang_tol=2.5, dist_tol=6, gap=40):
    """Fusionne les segments presque colinéaires et proches (un trait de crayon = plusieurs segments)."""
    segs = [list(map(float, s)) for s in segs]
    changed = True
    while changed:
        changed = False
        out = []
        while segs:
            a = segs.pop()
            ax0, ay0, ax1, ay1 = a
            ta = np.degrees(np.arctan2(ay1 - ay0, ax1 - ax0)) % 180
            keep = []
            for b in segs:
                bx0, by0, bx1, by1 = b
                tb = np.degrees(np.arctan2(by1 - by0, bx1 - bx0)) % 180
                dt = min(abs(ta - tb), 180 - abs(ta - tb))
                if dt > ang_tol:
                    keep.append(b)
                    continue
                # distance des extrémités de b à la droite a
                n = np.array([-(ay1 - ay0), ax1 - ax0])
                n /= np.linalg.norm(n) + 1e-9
                d0 = abs(np.dot(n, [bx0 - ax0, by0 - ay0]))
                d1 = abs(np.dot(n, [bx1 - ax0, by1 - ay0]))
                if max(d0, d1) > dist_tol:
                    keep.append(b)
                    continue
                u = np.array([ax1 - ax0, ay1 - ay0])
                L = np.linalg.norm(u)
                u /= L + 1e-9
                ts = [0, L, np.dot(u, [bx0 - ax0, by0 - ay0]), np.dot(u, [bx1 - ax0, by1 - ay0])]
                tb0, tb1 = sorted(ts[2:])
                if tb0 > L + gap or tb1 < -gap:
                    keep.append(b)
                    continue
                t0, t1 = min(ts), max(ts)
                ax0, ay0 = ax0 + u[0] * t0, ay0 + u[1] * t0
                ax1, ay1 = ax0 + u[0] * (t1 - t0), ay0 + u[1] * (t1 - t0)
                changed = True
            out.append([ax0, ay0, ax1, ay1])
            segs = keep
        segs = out
    return segs


def main(src, out):
    img = cv2.imread(src, cv2.IMREAD_GRAYSCALE)
    h, w = img.shape
    ink = cv2.adaptiveThreshold(cv2.GaussianBlur(img, (5, 5), 0), 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                cv2.THRESH_BINARY_INV, 51, 18)
    lines = cv2.HoughLinesP(ink, 1, np.pi / 360, threshold=120, minLineLength=int(min(w, h) * 0.12), maxLineGap=14)
    segs = merge(lines.reshape(-1, 4).tolist()) if lines is not None else []
    segs = [s for s in segs if np.hypot(s[2] - s[0], s[3] - s[1]) > min(w, h) * 0.1]
    segs.sort(key=lambda s: -np.hypot(s[2] - s[0], s[3] - s[1]))
    paths = "".join(
        f'<path d="M{x0:.0f} {y0:.0f}L{x1:.0f} {y1:.0f}" data-o="{i}"/>' for i, (x0, y0, x1, y1) in enumerate(segs))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
           f'<title>Lignes de construction du dessin</title>'
           f'<g fill="none" stroke="var(--encre,#2b211c)" stroke-width="2" stroke-linecap="round">{paths}</g></svg>')
    open(out, "w").write(svg)
    print(len(segs), "lignes")


if __name__ == "__main__":
    main(*sys.argv[1:3])
