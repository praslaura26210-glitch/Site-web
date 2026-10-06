"""Exporte un dessin vectoriel du book (zone d'une page) en SVG propre.

- un seul dessin par fichier (zone donnée par clusters.py)
- épaisseurs de trait d'origine conservées
- fond supprimé ; les remplissages blancs (masques d'Archicad) prennent la couleur
  du papier du site via la variable CSS --papier (blanc si le SVG est ouvert seul)
- le noir pur devient la variable --encre (brun très foncé sur le site)
- tracés consécutifs de même style fusionnés pour alléger le fichier
"""
import html
import os
import pymupdf

PREC = 2


def _n(v):
    s = f"{v:.{PREC}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def _pt(p, o):
    return f"{_n(p.x - o.x)} {_n(p.y - o.y)}"


def _color(c):
    if c is None:
        return None
    if len(c) == 1:  # niveaux de gris
        c = (c[0],) * 3
    elif len(c) == 4:  # CMJN -> RVB
        k = c[3]
        c = tuple((1 - v) * (1 - k) for v in c[:3])
    r, g, b = (round(v * 255) for v in c[:3])
    if (r, g, b) == (255, 255, 255):
        return "var(--papier,#fff)"
    if r < 40 and g < 40 and b < 40:
        return "var(--encre,#000)"
    return f"#{r:02x}{g:02x}{b:02x}"


def _d(items, o, close):
    out, cur = [], None
    for it in items:
        k = it[0]
        if k == "l":
            a, b = it[1], it[2]
            if cur is None or abs(cur.x - a.x) > 1e-3 or abs(cur.y - a.y) > 1e-3:
                out.append("M" + _pt(a, o))
            out.append("L" + _pt(b, o))
            cur = b
        elif k == "c":
            a, b, c, d = it[1:5]
            if cur is None or abs(cur.x - a.x) > 1e-3 or abs(cur.y - a.y) > 1e-3:
                out.append("M" + _pt(a, o))
            out.append("C" + " ".join(_pt(p, o) for p in (b, c, d)))
            cur = d
        elif k == "re":
            r = it[1]
            out.append(f"M{_pt(r.tl, o)}H{_n(r.x1 - o.x)}V{_n(r.y1 - o.y)}H{_n(r.x0 - o.x)}Z")
            cur = None
        elif k == "qu":
            q = it[1]
            out.append("M" + "L".join(_pt(p, o) for p in (q.ul, q.ur, q.lr, q.ll)) + "Z")
            cur = None
    if close and out and not out[-1].endswith("Z"):
        out.append("Z")
    return "".join(out)


def _style(d):
    fill = _color(d.get("fill")) if d["type"] in ("f", "fs") else None
    stroke = _color(d.get("color")) if d["type"] in ("s", "fs") else None
    st = []
    st.append(f"fill:{fill}" if fill else "fill:none")
    if fill and d.get("fill_opacity", 1) < 1:
        st.append(f"fill-opacity:{_n(d['fill_opacity'])}")
    if fill and d.get("even_odd"):
        st.append("fill-rule:evenodd")
    if stroke:
        st.append(f"stroke:{stroke}")
        st.append(f"stroke-width:{_n(d.get('width') or 0.1) if (d.get('width') or 0) > 0.01 else '0.1'}")
        caps = {0: "butt", 1: "round", 2: "square"}
        lc = d.get("lineCap")
        lc = lc[0] if isinstance(lc, (tuple, list)) else lc
        if lc:
            st.append(f"stroke-linecap:{caps.get(int(lc), 'butt')}")
        lj = d.get("lineJoin")
        if lj:
            st.append(f"stroke-linejoin:{ {0: 'miter', 1: 'round', 2: 'bevel'}.get(int(lj), 'miter')}")
        dash = d.get("dashes")
        if dash and dash.startswith("[") and dash[1:dash.index("]")].strip():
            st.append("stroke-dasharray:" + ",".join(dash[1:dash.index("]")].split()))
        if d.get("stroke_opacity", 1) < 1:
            st.append(f"stroke-opacity:{_n(d['stroke_opacity'])}")
    return ";".join(st)


def export(p, rect, path, margin=4, text=True, title=None, masque_doux=None, restyle=None):
    """Écrit le SVG de la zone `rect` de la page `p`. Renvoie (nb tracés, taille octets).

    masque_doux : couleur donnée aux grands aplats noirs qui, dans le PDF, sont adoucis par un
    masque de transparence (dalles grisées des planches techniques) que PyMuPDF ne restitue pas.

    Les masques de découpe (clip) du PDF sont respectés : un tracé entièrement masqué est
    ignoré, un tracé partiellement masqué est enveloppé dans son clipPath.
    """
    zone = pymupdf.Rect(rect) + (-margin, -margin, margin, margin)
    o = zone.tl
    # préfixe unique par fichier : plusieurs SVG insérés dans la même page HTML ne se mélangent pas
    import hashlib
    px = "p" + hashlib.md5(os.path.basename(path).encode() + str(p.number).encode()).hexdigest()[:4]
    groups, styles, clipdefs = [], {}, {}
    count = 0
    clips = []  # pile : (niveau, scissor, id du clipPath)
    for d in p.get_drawings(extended=True):
        lvl = d.get("level", 0)
        while clips and clips[-1][0] >= lvl:
            clips.pop()
        if d["type"] == "group":
            continue
        if d["type"] == "clip":
            sc = pymupdf.Rect(d["scissor"])
            if clips:
                sc &= clips[-1][1]
            key = _d(d["items"], o, True) + ("e" if d.get("even_odd") else "")
            cid = clipdefs.setdefault(key, f"{px}c{len(clipdefs)}")
            clips.append((lvl, sc, cid))
            continue
        r = pymupdf.Rect(d["rect"])
        rr = r + (-0.01, -0.01, 0.01, 0.01)  # les traits horizontaux/verticaux ont une boîte plate
        vis = (rr & clips[-1][1]) if clips else rr
        if vis.is_empty:
            continue  # entièrement masqué par le clip
        if not zone.contains(vis):
            continue
        # fond : grand aplat blanc sans trait qui couvre tout le dessin
        if d["type"] == "f" and d.get("fill") and min(d["fill"]) > 0.98 and r.width > zone.width * 0.9 and r.height > zone.height * 0.9:
            continue
        clip = None
        if clips:
            sc = clips[-1][1]
            if not sc.contains(r + (-0.5, -0.5, 0.5, 0.5)):
                clip = clips[-1][2]
        s = _style(d)
        if masque_doux and d["type"] == "f" and max(d.get("fill") or (1,)) < 0.05 and r.width * r.height > 1500:
            s = s.replace("var(--encre,#000)", masque_doux)
        if restyle:
            s = restyle(d) or s
        cls = styles.setdefault(s, f"{px}s{len(styles)}")
        dd = _d(d["items"], o, d.get("closePath"))
        if not dd:
            continue
        count += 1
        if groups and groups[-1][0] == cls and groups[-1][2] == clip:
            groups[-1][1].append(dd)
        else:
            groups.append((cls, [dd], clip))
    used = {c for _, _, c in groups if c}
    defs = []
    for key, cid in clipdefs.items():
        if cid in used:
            ev = key.endswith("e")
            dd = key[:-1] if ev else key
            defs.append(f'<clipPath id="{cid}"><path d="{dd}"{" clip-rule=\"evenodd\"" if ev else ""}/></clipPath>')
    body = []
    for c, ds, clip in groups:
        cp = f' clip-path="url(#{clip})"' if clip else ""
        body.append(f'<path class="{c}"{cp} d="{"".join(ds)}"/>')
    if text:
        for b in p.get_text("dict", clip=zone)["blocks"]:
            for line in b.get("lines", []):
                dx, dy = line["dir"]
                for sp in line["spans"]:
                    t = sp["text"].strip()
                    if not t or not zone.contains(pymupdf.Rect(sp["bbox"])):
                        continue
                    x, y = sp["origin"]
                    col = _color(tuple(((sp["color"] >> s) & 255) / 255 for s in (16, 8, 0))) or "var(--encre,#000)"
                    tr = ""
                    if abs(dy) > 1e-3:
                        import math
                        tr = f' transform="rotate({_n(math.degrees(math.atan2(dy, dx)))} {_n(x - o.x)} {_n(y - o.y)})"'
                    body.append(f'<text class="{px}t" x="{_n(x - o.x)}" y="{_n(y - o.y)}" font-size="{_n(sp["size"])}" style="fill:{col}"{tr}>{html.escape(t)}</text>')
    css = "".join(f".{c}{{{s}}}" for s, c in styles.items())
    css += f"text.{px}t{{font-family:var(--police-plan,Montserrat,Arial,sans-serif)}}"
    ttl = f"<title>{html.escape(title)}</title>" if title else ""
    dfs = f"<defs>{''.join(defs)}</defs>" if defs else ""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(zone.width)} {_n(zone.height)}" '
           f'width="{_n(zone.width)}pt" height="{_n(zone.height)}pt">{ttl}<style>{css}</style>{dfs}{"".join(body)}</svg>')
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    return count, len(svg.encode())
