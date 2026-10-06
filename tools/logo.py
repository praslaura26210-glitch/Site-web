"""Dessine les 3 pistes de logo « Laura Pras » en SVG (symbole, logo complet, favicon).

Le nom est vectorisé (contours de la police) pour que le logo s'affiche partout pareil.
Usage : python3 tools/logo.py dossier_des_polices dossier_de_sortie
"""
import os
import sys

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ENCRE = "#2B211C"
TERRE = "#A46B57"


def text_path(font_file, text, size, tracking=0.0):
    """Contour SVG du texte (crénage HarfBuzz), ligne de base à y=0. Renvoie (d, largeur)."""
    blob = hb.Blob.from_file_path(font_file)
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    tt = TTFont(font_file)
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    upm = tt["head"].unitsPerEm
    s = size / upm
    x = 0
    pen = SVGPathPen(gs)
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        tp = TransformPen(pen, (s, 0, 0, -s, x + pos.x_offset * s, -pos.y_offset * s))
        gs[name].draw(tp)
        x += pos.x_advance * s + tracking * size
    return pen.getCommands(), x - tracking * size


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" role="img" aria-label="{title}">'
            f"<title>{title}</title>{body}</svg>")


def stroke(d, w, color=ENCRE, extra=""):
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" '
            f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')


# --- Pistes : symbole dessiné dans une boîte 100 x 100 ------------------------------------
def ruine(fav=False):
    """Piste A : un mur en ruine, gradins cassés, une arche. D'après l'ébauche escalier + arche."""
    if fav:
        wall = "M10 84H24V62H38V40H50V18H86V84H96"
        arch = "M60 84V60A8 8 0 0 1 76 60V84"
        return stroke(wall, 9) + stroke(arch, 9, TERRE)
    wall = "M4 84H18V72H28V60H38V48H48V34H56V18H84V84H96"
    arch = "M62 84V58A7.5 7.5 0 0 1 77 58V84"
    return stroke(wall, 3.2) + stroke(arch, 3.2, TERRE)


def horizon(fav=False):
    """Piste B : la ligne de terrain se soulève en toit puis redescend ; un poteau tient le faîtage.
    D'après l'ébauche paysage + toit + poteau."""
    if fav:
        return (stroke("M4 82C14 81 22 78 28 74L52 32L78 64C84 70 90 72 96 72", 8)
                + stroke("M52 32V84", 8, TERRE))
    line = "M2 80C14 79 24 76 30 72L54 36L80 62C86 68 92 70 98 70"
    post = "M54 36V82"
    return stroke(line, 2.6) + stroke(post, 2.6, TERRE)


def assemblage(fav=False):
    """Piste C : monogramme LP. Le pied du L et le fût du P se rencontrent comme un assemblage
    poteau-lisse ; une cheville marque le nœud ; la panse du P est une demi-arche."""
    w = 9 if fav else 4
    l = "M26 14V84H58"
    p = "M58 84V14H64A17 17 0 0 1 64 48H58"
    peg = (f'<rect x="{58 - w * 0.9:.1f}" y="{84 - w * 0.9:.1f}" width="{w * 1.8:.1f}" height="{w * 1.8:.1f}" '
           f'fill="{TERRE}"/>')
    return stroke(l, w) + stroke(p, w) + peg


PISTES = {
    "a-ruine": ("Ruine", ruine),
    "b-horizon": ("Horizon", horizon),
    "c-assemblage": ("Assemblage", assemblage),
}


def main(fonts, out):
    serif = os.path.join(fonts, "newsreader-72-400.ttf")
    name_d, name_w = text_path(serif, "Laura Pras", 44, tracking=0.01)
    for key, (label, fn) in PISTES.items():
        d = os.path.join(out, key)
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "symbole.svg"), "w").write(svg(100, 100, fn(), f"Laura Pras, symbole {label}"))
        open(os.path.join(d, "favicon.svg"), "w").write(svg(100, 100, fn(True), "Laura Pras"))
        name = f'<path d="{name_d}" fill="{ENCRE}"/>'
        if key == "b-horizon":
            # symbole au-dessus, nom centré dessous
            W = max(name_w, 160) + 8
            body = (f'<g transform="translate({(W - 100 * 1.4) / 2:.1f} 0) scale(1.4)">{fn()}</g>'
                    f'<g transform="translate({(W - name_w) / 2:.1f} 156)">{name}</g>')
            open(os.path.join(d, "logo.svg"), "w").write(svg(W, 168, body, "Laura Pras"))
        else:
            W = 76 + 14 + name_w + 4
            body = (f'<g transform="translate(0 0) scale(0.76)">{fn()}</g>'
                    f'<g transform="translate(90 {64 if key == "a-ruine" else 64})">{name}</g>')
            open(os.path.join(d, "logo.svg"), "w").write(svg(W, 76, body, "Laura Pras"))
    # nom seul (pour l'en-tête du site si on garde le symbole à part)
    open(os.path.join(out, "nom-laura-pras.svg"), "w").write(
        svg(name_w + 2, 46, f'<g transform="translate(1 34)"><path d="{name_d}" fill="{ENCRE}"/></g>', "Laura Pras"))
    print("ok", round(name_w))


if __name__ == "__main__":
    main(*sys.argv[1:3])
