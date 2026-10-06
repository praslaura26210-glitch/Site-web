"""Relève dans le book les données de la maquette 3D d'« Entre deux regards ».

Murs = aplats noirs (poché) des plans ; démolitions = aplats beige du plan existant ;
zones d'usage = aplats mauves du plan projet. Échelle : les murs extérieurs font 4,2 pt,
les portes environ 6 pt de rayon -> 0,13 m/pt (bâtiment d'environ 48 x 16 m).
Hauteurs relevées sur la coupe AA et les façades (rapports mesurés, voir LISEZMOI).
Sortie : content/projets/entre-deux-regards/maquette.json, coordonnées en mètres,
origine au coin sud-ouest, x vers l'est, y vers le nord.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from book import page  # noqa: E402
from clusters import clusters  # noqa: E402

M = 0.13  # m par pt
NOIR, BEIGE, MAUVE = (0, 0, 0), (0.77, 0.68, 0.57), (0.52, 0.28, 0.35)


def close(c, ref, tol=0.03):
    return c is not None and all(abs(a - b) < tol for a, b in zip(c, ref))


def polys(d):
    """Polygones (listes de points) d'un tracé rempli."""
    out, cur = [], []
    for it in d["items"]:
        k = it[0]
        if k == "re":
            r = it[1]
            out.append([(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)])
        elif k == "qu":
            q = it[1]
            out.append([tuple(q.ul), tuple(q.ur), tuple(q.lr), tuple(q.ll)])
        elif k == "l":
            a, b = tuple(it[1]), tuple(it[2])
            if cur and (abs(cur[-1][0] - a[0]) > 1e-3 or abs(cur[-1][1] - a[1]) > 1e-3):
                out.append(cur)
                cur = []
            if not cur:
                cur.append(a)
            cur.append(b)
        elif k == "c":
            a, d_ = tuple(it[1]), tuple(it[4])
            if not cur:
                cur.append(a)
            cur.append(d_)
    if cur:
        out.append(cur)
    clean = []
    for p in out:
        if len(p) > 2 and abs(p[0][0] - p[-1][0]) < 1e-3 and abs(p[0][1] - p[-1][1]) < 1e-3:
            p = p[:-1]
        if len(p) >= 3:
            clean.append(p)
    return clean


def releve(n, idx):
    p = page(n)
    r = clusters(p)[idx]
    res = {"murs": [], "demolis": [], "zones": []}
    for d in p.get_drawings():
        if d["type"] not in ("f", "fs") or not r.contains(d["rect"]):
            continue
        f = d.get("fill")
        key = "murs" if close(f, NOIR, 0.06) else "demolis" if close(f, BEIGE) else "zones" if close(f, MAUVE) else None
        if key:
            for poly in polys(d):
                res[key].append(poly)
    return res


def bbox(polys_):
    xs = [x for p in polys_ for x, _ in p]
    ys = [y for p in polys_ for _, y in p]
    return min(xs), min(ys), max(xs), max(ys)


def to_m(polys_, ref):
    x0, y0, x1, y1 = ref
    # y du PDF vers le bas -> y nord vers le haut ; origine coin sud-ouest
    return [[[round((x - x0) * M, 3), round((y1 - y) * M, 3)] for x, y in p] for p in polys_]


def main():
    plans = {
        "rdc_existant": releve(40, 0), "etage_existant": releve(40, 1),
        "rdc_projet": releve(41, 0), "etage_projet": releve(41, 1),
    }
    out = {"echelle_m_par_pt": M, "plans": {}}
    for k, v in plans.items():
        # référence : emprise des murs noirs + démolis (le corps de bâtiment principal)
        allp = [p for p in v["murs"] + v["demolis"] if bbox([p])[2] - bbox([p])[0] < 400]
        ref = bbox(v["murs"])
        out["plans"][k] = {kk: to_m(vv, ref) for kk, vv in v.items()}
        out["plans"][k]["emprise"] = [round((ref[2] - ref[0]) * M, 2), round((ref[3] - ref[1]) * M, 2)]
        print(k, {kk: len(vv) for kk, vv in v.items()}, out["plans"][k]["emprise"])
    # zones : exposition (mauve soutenu) / restauration (mauve clair), classées d'après la légende du book
    rdc = out["plans"]["rdc_projet"]["zones"]
    L = out["plans"]["rdc_projet"]["emprise"][0]
    out["usages"] = {
        "rdc": [{"usage": "restauration" if min(x for x, _ in z) > L * 0.55 else "exposition", "poly": z} for z in rdc],
        "etage": [{"usage": "exposition", "poly": z} for z in out["plans"]["etage_projet"]["zones"]],
    }
    # niveaux (m), relevés sur la coupe AA projet et les façades : rapports mesurés à l'échelle du plan
    out["niveaux"] = {"rdc_ouest": -1.0, "rdc": 0.0, "etage": 3.9, "combles": 7.4, "egout": 8.6, "faitage": 11.8}
    # la cour : dernière travée à l'est, ouverte dans la toiture (plan étage : arbres visibles)
    out["cour"] = {"x0": round(L * 0.835, 2), "x1": L, "note": "travée est, toiture ouverte"}
    path = os.path.join(os.path.dirname(__file__), "..", "content", "projets", "entre-deux-regards", "maquette.json")
    json.dump(out, open(path, "w"), separators=(",", ":"))
    print(os.path.getsize(path) // 1024, "Ko")


if __name__ == "__main__":
    main()
