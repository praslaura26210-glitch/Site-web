"""Étape 0 : extrait du book les plans vectoriels (SVG) et les images (WebP 2000/1000 px).

Usage : BOOK_SRC=dossier_des_pdf python3 tools/extract_content.py
Range tout dans content/projets/<slug>/{plans,images}/ et écrit content/extraction.json
(le relevé de ce qui a été extrait, avec la page d'origine).
"""
import io
import json
import os
import sys

import pymupdf
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from book import page  # noqa: E402
from clusters import clusters  # noqa: E402
from vector_svg import export  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..", "content")
SIZES = (2000, 1000)
Image.MAX_IMAGE_PIXELS = None

# --- Images : (slug, nom, [(page, xref), ...] côte à côte, type, légende) ---------------
# type : photo | rendu | croquis | plan-scan | planche
IMAGES = [
    ("_site", "dessin-couverture", [(1, 41)], "croquis", "Dessin à la main, couverture du portfolio"),
    ("_site", "portrait", [(2, 54)], "photo", "Portrait de Laura Pra"),

    ("illusion-d-envol", "maquette", [(6, 174)], "photo", "Maquette du pavillon en bois"),
    ("illusion-d-envol", "coupe-aa", [(9, 270)], "plan-scan", "Coupe AA"),
    ("illusion-d-envol", "plan-rdc", [(9, 274)], "plan-scan", "Plan RDC"),
    ("illusion-d-envol", "facade-sud", [(9, 266)], "plan-scan", "Façade sud"),
    ("illusion-d-envol", "axonometrie-eclatee", [(10, 296)], "plan-scan", "Axonométrie éclatée de la structure"),
    ("illusion-d-envol", "detail-assemblage-1", [(11, 324)], "plan-scan", "Détail d'assemblage"),
    ("illusion-d-envol", "detail-assemblage-2", [(11, 312)], "plan-scan", "Détail d'assemblage"),
    ("illusion-d-envol", "detail-assemblage-3", [(11, 316)], "plan-scan", "Détail d'assemblage"),
    ("illusion-d-envol", "detail-assemblage-4", [(11, 320)], "plan-scan", "Détail d'assemblage"),
    ("illusion-d-envol", "croquis-perspective", [(12, 341)], "croquis", "Perspective dessinée à la main"),

    ("la-ruche", "plan-masse", [(14, 380), (15, 394)], "plan-scan", "Plan masse"),
    ("la-ruche", "plan-rdc", [(16, 407)], "plan-scan", "Plan RDC"),
    ("la-ruche", "plan-r-1", [(16, 411)], "plan-scan", "Plan R-1"),
    ("la-ruche", "plan-structure", [(17, 434)], "plan-scan", "Plan de structure"),
    ("la-ruche", "facade-ouest", [(17, 442)], "plan-scan", "Façade ouest"),
    ("la-ruche", "coupe-aa", [(17, 438)], "plan-scan", "Coupe AA"),
    ("la-ruche", "axonometrie-eclatee", [(18, 467)], "plan-scan", "Axonométrie éclatée"),
    ("la-ruche", "maquette-1", [(20, 508)], "photo", "Maquette"),
    ("la-ruche", "maquette-2", [(21, 520)], "photo", "Maquette"),
    ("la-ruche", "maquette-3", [(21, 521)], "photo", "Maquette, intérieur"),
    ("la-ruche", "maquette-4", [(21, 518)], "photo", "Maquette"),
    ("la-ruche", "maquette-5", [(21, 519)], "photo", "Maquette"),

    ("le-passage-des-artistes", "croquis-cour", [(22, 544)], "croquis", "Croquis de la cour"),
    ("le-passage-des-artistes", "plan-masse", [(24, 596)], "plan-scan", "Plan masse 1/250"),
    ("le-passage-des-artistes", "plan-rdc", [(26, 74)], "plan-scan", "Plan RDC"),
    ("le-passage-des-artistes", "plan-etages", [(27, 99)], "plan-scan", "Plan des étages"),
    ("le-passage-des-artistes", "maquette-1", [(28, 116)], "photo", "Maquette"),
    ("le-passage-des-artistes", "maquette-2", [(29, 130)], "photo", "Maquette, détail des fenêtres"),
    ("le-passage-des-artistes", "facade-sud", [(30, 159)], "plan-scan", "Façade sud"),
    ("le-passage-des-artistes", "facade-nord", [(30, 155)], "plan-scan", "Façade nord"),
    ("le-passage-des-artistes", "coupe", [(30, 153)], "plan-scan", "Coupe"),
    ("le-passage-des-artistes", "detail-axonometrie", [(31, 185)], "plan-scan", "Détail en axonométrie 1/20"),
    ("le-passage-des-artistes", "coupe-perspective", [(32, 201)], "plan-scan", "Coupe perspective 1/50"),
    ("le-passage-des-artistes", "experimentation-1", [(34, 226)], "photo", "Expérimentation en pierre massive"),
    ("le-passage-des-artistes", "experimentation-2", [(35, 246)], "photo", "Taille de la pierre"),
    ("le-passage-des-artistes", "experimentation-3", [(35, 244)], "photo", "Taille de la pierre"),

    ("entre-deux-regards", "maquette", [(36, 259)], "photo", "Maquette"),
    ("entre-deux-regards", "perspective-exterieure", [(44, 541)], "rendu", "Perspective extérieure"),
    ("entre-deux-regards", "perspective-cour", [(45, 37)], "rendu", "Perspective de la cour intérieure"),
    ("entre-deux-regards", "perspective-escalier", [(45, 35)], "rendu", "Perspective de l'escalier d'origine"),

    ("pilates-room", "rendu-accueil", [(46, 53)], "rendu", "Accueil"),
    ("pilates-room", "rendu-vestiaire", [(50, 251)], "rendu", "Vestiaire"),
    ("pilates-room", "rendu-coiffeuse", [(51, 261)], "rendu", "Coiffeuse"),
    ("pilates-room", "rendu-salle", [(51, 263)], "rendu", "Salle de pratique"),
    ("pilates-room", "planche-materiaux", [(52, 276)], "photo", "Planche de matériaux"),

    ("escalier-suspendu", "rendu", [(54, 303)], "rendu", "Escalier suspendu"),

    ("au-dela-des-projets", "photo", [(60, 611)], "photo", "Photographie"),
]

# Pages entières (planches composées) : (slug, nom, [pages côte à côte], légende)
PAGES = [
    ("pilates-room", "palette", [53], "Palette de matériaux"),
    ("au-dela-des-projets", "planche-dessins-photos-bricolage", [62, 63], "Dessins, photos, bricolage"),
]

# --- Plans vectoriels : (slug, nom, page, zone) ; zone = index de cluster, (gap, index) ou "tout"
VECTORS = [
    ("entre-deux-regards", "plan-masse-existant", 38, 0, "Plan masse existant 1/500"),
    ("entre-deux-regards", "plan-masse-projet", 39, 0, "Plan masse projet 1/500"),
    ("entre-deux-regards", "plan-rdc-existant", 40, 0, "Plan RDC existant, démolitions"),
    ("entre-deux-regards", "plan-etage-existant", 40, 1, "Plan étage existant, démolitions"),
    ("entre-deux-regards", "plan-rdc-projet", 41, 0, "Plan RDC projet"),
    ("entre-deux-regards", "plan-etage-projet", 41, 1, "Plan étage projet"),
    ("entre-deux-regards", "facade-ouest-existant", 42, (2, 0), "Façade ouest existante"),
    ("entre-deux-regards", "facade-est-existant", 42, (2, 1), "Façade est existante"),
    ("entre-deux-regards", "facade-sud-existant", 42, (2, 2), "Façade sud existante"),
    ("entre-deux-regards", "facade-nord-existant", 42, (2, 3), "Façade nord existante"),
    ("entre-deux-regards", "coupe-aa-existant", 42, (2, 4), "Coupe AA existante"),
    ("entre-deux-regards", "facade-ouest-projet", 43, (2, 0), "Façade ouest projet"),
    ("entre-deux-regards", "facade-est-projet", 43, (2, 1), "Façade est projet"),
    ("entre-deux-regards", "facade-sud-projet", 43, (2, 2), "Façade sud projet"),
    ("entre-deux-regards", "facade-nord-projet", 43, (2, 3), "Façade nord projet"),
    ("entre-deux-regards", "coupe-aa-projet", 43, (2, 4), "Coupe AA projet"),

    ("pilates-room", "plan-amenagement", 48, 0, "Plan d'aménagement"),
    ("pilates-room", "plan-electricite", 48, 1, "Plan électricité et éclairage"),
    ("pilates-room", "coupe-aa", 49, 0, "Coupe AA"),
    ("pilates-room", "coupe-bb", 49, 1, "Coupe BB"),
    ("pilates-room", "coupe-cc", 49, 2, "Coupe CC"),

    ("escalier-suspendu", "axonometrie", 56, 0, "Axonométrie de l'escalier"),
    ("escalier-suspendu", "vue-de-face", 57, (2, 0), "Vue de face"),
    ("escalier-suspendu", "vue-en-plan", 57, (2, 1), "Vue en plan"),
    ("escalier-suspendu", "planche-limon-marches", 58, "tout", "Limon et marches, détails"),
    ("escalier-suspendu", "planche-garde-corps", 59, "tout", "Garde-corps, profils des tubes"),
]


def save_webp(img, slug, name, kind):
    d = os.path.join(ROOT, "projets" if slug != "_site" else "", slug if slug != "_site" else "site", "images")
    os.makedirs(d, exist_ok=True)
    q = 90 if kind in ("plan-scan", "croquis", "planche") else 82
    out = {}
    for s in SIZES:
        im = img.copy()
        if max(im.size) > s:
            im.thumbnail((s, s), Image.LANCZOS)
        f = os.path.join(d, f"{name}-{s}.webp")
        im.save(f, "WEBP", quality=q, method=6)
        out[s] = {"fichier": os.path.relpath(f, ROOT), "px": list(im.size), "ko": round(os.path.getsize(f) / 1024)}
    return out


def render_clip(p, rect, ppi):
    rect = pymupdf.Rect(rect) & p.rect
    pix = p.get_pixmap(clip=rect, dpi=int(min(ppi, 600)), alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def native_ppi(info):
    b = pymupdf.Rect(info["bbox"])
    # côté long contre côté long : juste aussi pour une image tournée dans la mise en page
    return max(info["width"], info["height"]) / max(b.width, b.height) * 72


def extract_image(parts):
    """Rendu fidèle (masques, recadrages) à la résolution d'origine ; images en double page recollées."""
    tiles = []
    for n, xref in parts:
        p = page(n)
        info = next(i for i in p.get_image_info(xrefs=True) if i["xref"] == xref)
        ppi = max(150, native_ppi(info))
        tiles.append(render_clip(p, info["bbox"], ppi))
    if len(tiles) == 1:
        return tiles[0], ppi
    h = min(t.height for t in tiles)
    tiles = [t.resize((round(t.width * h / t.height), h)) for t in tiles]
    out = Image.new("RGB", (sum(t.width for t in tiles), h), "white")
    x = 0
    for t in tiles:
        out.paste(t, (x, 0))
        x += t.width
    return out, ppi


def main():
    report = {"images": [], "plans": []}
    for slug, name, parts, kind, legende in IMAGES:
        if parts == [(32, 201)]:  # coupe perspective sur double page : image d'origine complète
            img, ppi = extract_image([(32, 201)])
            p32 = page(32)
            info = next(i for i in p32.get_image_info(xrefs=True) if i["xref"] == 201)
            pix = pymupdf.Pixmap(p32.parent, 201)
            img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        elif parts == [(24, 596)]:  # plan masse sur double page : image d'origine recadrée sur les 2 pages
            p = page(24)
            pix = pymupdf.Pixmap(p.parent, 596)
            img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
            b = pymupdf.Rect(next(i for i in p.get_image_info(xrefs=True) if i["xref"] == 596)["bbox"])
            sx = img.width / b.width
            sy = img.height / b.height
            # partie visible : de x=0 sur la page 24 à x=595 sur la page 25 (soit 2 largeurs de page)
            x0, x1 = (0 - b.x0) * sx, (2 * p.rect.width - b.x0) * sx
            y0, y1 = (0 - b.y0) * sy, (p.rect.height - b.y0) * sy
            img = img.crop((round(x0), round(max(0, y0)), round(min(img.width, x1)), round(min(img.height, y1))))
            ppi = sx * 72
        else:
            img, ppi = extract_image(parts)
        files = save_webp(img, slug, name, kind)
        report["images"].append({"projet": slug, "nom": name, "type": kind, "legende": legende,
                                 "pages": sorted({n for n, _ in parts}), "source_px": list(img.size),
                                 "ppi_source": round(ppi), "fichiers": files})
        print("img", slug, name, img.size, round(ppi))
    for slug, name, pages_, legende in PAGES:
        tiles = [render_clip(page(n), page(n).rect, 250) for n in pages_]
        out = Image.new("RGB", (sum(t.width for t in tiles), tiles[0].height), "white")
        x = 0
        for t in tiles:
            out.paste(t, (x, 0))
            x += t.width
        files = save_webp(out, slug, name, "planche")
        report["images"].append({"projet": slug, "nom": name, "type": "planche", "legende": legende,
                                 "pages": pages_, "source_px": list(out.size), "fichiers": files})
        print("page", slug, name, out.size)
    for slug, name, n, zone, legende in VECTORS:
        p = page(n)
        if zone == "tout":
            cs = clusters(p, gap=2)
            r = cs[0]
            for c in cs[1:]:
                r |= c
        elif isinstance(zone, tuple):
            r = clusters(p, gap=zone[0])[zone[1]]
        else:
            r = clusters(p)[zone]
        d = os.path.join(ROOT, "projets", slug, "plans")
        os.makedirs(d, exist_ok=True)
        f = os.path.join(d, f"{name}.svg")
        doux = "#d6d0c6" if slug == "escalier-suspendu" else None
        count, size = export(p, r, f, title=legende, masque_doux=doux)
        report["plans"].append({"projet": slug, "nom": name, "legende": legende, "page": n,
                                "fichier": os.path.relpath(f, ROOT), "traces": count, "ko": round(size / 1024),
                                "format_pt": [round(r.width), round(r.height)]})
        print("svg", slug, name, count, round(size / 1024), "Ko")
    with open(os.path.join(ROOT, "extraction.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
