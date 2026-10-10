"""Fond de carte du territoire de Laura (accueil) : départements, Rhône, communes citées dans ses projets,
stages et formations. Sources libres : france-geojson (contours IGN/INSEE simplifiés, G. David) et
Natural Earth (fleuves). Écrit content/site/territoire.json (tracés SVG déjà projetés).
Usage : python3 tools/carte_territoire.py   (télécharge les sources dans /tmp/geo si absentes)"""
import json, math, os, urllib.request

GEO = '/tmp/geo'
SRC = {
    'dep.geojson': 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson',
    'rivers.geojson': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson',
}
DEPS = {'38': 'isere', '26': 'drome', '07': 'ardeche', '69': 'rhone'}
for d, n in DEPS.items():
    SRC[f'com-{d}.geojson'] = f'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements/{d}-{n}/communes-{d}-{n}.geojson'
os.makedirs(GEO, exist_ok=True)
for f, u in SRC.items():
    p = os.path.join(GEO, f)
    if not os.path.exists(p):
        urllib.request.urlretrieve(u, p)

# cadre : de Lyon à Valence, du Rhône à l'Oisans
LON0, LON1, LAT0, LAT1 = 4.45, 6.30, 44.78, 45.92
K = math.cos(math.radians((LAT0 + LAT1) / 2))
W = 1000
SC = W / ((LON1 - LON0) * K)
H = round((LAT1 - LAT0) * SC)
proj = lambda lon, lat: (round((lon - LON0) * K * SC, 1), round((LAT1 - lat) * SC, 1))

def chemin(anneaux, ferme=True):
    out = []
    for a in anneaux:
        pts, der = [], None
        for lon, lat in a:
            x, y = proj(lon, lat)
            if der and abs(x - der[0]) + abs(y - der[1]) < 1.2:
                continue
            pts.append((x, y)); der = (x, y)
        if len(pts) > 1:
            out.append('M' + 'L'.join(f'{x},{y}' for x, y in pts) + ('Z' if ferme else ''))
    return ''.join(out)

def centre(anneau):
    a = cx = cy = 0
    for (x1, y1), (x2, y2) in zip(anneau, anneau[1:] + anneau[:1]):
        c = x1 * y2 - x2 * y1; a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
    a /= 2
    return cx / (6 * a), cy / (6 * a)

deps = []
for f in json.load(open(os.path.join(GEO, 'dep.geojson')))['features']:
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    lons = [c[0] for p in polys for c in p[0]]; lats = [c[1] for p in polys for c in p[0]]
    if max(lons) < LON0 or min(lons) > LON1 or max(lats) < LAT0 or min(lats) > LAT1:
        continue
    grand = max(polys, key=lambda p: len(p[0]))[0]
    deps.append({'code': f['properties']['code'], 'nom': f['properties']['nom'], 'd': ''.join(chemin(p) for p in polys), 'centre': proj(*centre(grand))})

rhone = ''
for f in json.load(open(os.path.join(GEO, 'rivers.geojson')))['features']:
    if f['properties'].get('name') in ('Rhône', 'Rhone'):
        g = f['geometry']
        lignes = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        rhone += chemin(lignes, ferme=False)

COMMUNES = {'38': ['Grenoble', 'Proveysieux', 'Livet-et-Gavet', 'Beaurepaire', 'Salaise-sur-Sanne'], '26': ['Valence', 'Épinouze'], '07': ['Tournon-sur-Rhône'], '69': ['Villeurbanne', 'Caluire-et-Cuire']}
lieux = {}
for d, noms in COMMUNES.items():
    for f in json.load(open(os.path.join(GEO, f'com-{d}.geojson')))['features']:
        if f['properties']['nom'] in noms:
            g = f['geometry']
            polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
            lieux[f['properties']['nom']] = proj(*centre(max(polys, key=lambda p: len(p[0]))[0]))

dst = os.path.join(os.path.dirname(__file__), '..', 'content', 'site', 'territoire.json')
json.dump({'source': 'Contours : france-geojson (G. David, IGN/INSEE) ; Rhône : Natural Earth', 'w': W, 'h': H, 'echelleKm': round(SC / 111.32 * 1 / K * K, 4), 'deps': deps, 'rhone': rhone, 'lieux': lieux}, open(dst, 'w'), ensure_ascii=False)
print(f'{len(deps)} départements, {len(lieux)} communes, {W}x{H}, {os.path.getsize(dst)//1024} Ko')
