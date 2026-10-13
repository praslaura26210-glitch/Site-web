import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { MATS } from './data.js';

// ------------------------------------------------------------------ textures
const loader = new THREE.TextureLoader();
const texCache = new Map();
let maxAniso = 8;
export function setAnisotropy(a) { maxAniso = a; }

THREE.Cache.enabled = true;
// une texture par (fichier, échelle) : les UV des géométries sont en centimètres,
// une tuile couvre `size` cm
function tex(path, size, srgb) {
  const key = path + '@' + size;
  if (texCache.has(key)) return texCache.get(key);
  const t = loader.load(path);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  t.repeat.set(1 / size, 1 / size);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const matCache = new Map();
// opts.displace : matériau destiné à une face subdivisée (relief réel)
export function pbr(key, opts = {}) {
  const ck = key + (opts.displace ? ':d' : '');
  if (matCache.has(ck)) return matCache.get(ck);
  const m = MATS[key];
  const base = `tex/${m.tex}_`;
  const map = tex(base + 'albedo.jpg', m.size, true);
  const normalMap = tex(base + 'normal.jpg', m.size);
  const orm = tex(base + 'orm.jpg', m.size);
  const params = {
    map, normalMap, roughnessMap: orm, aoMap: orm, metalnessMap: orm,
    roughness: 1, metalness: m.metal ?? 1, aoMapIntensity: 1,
    color: new THREE.Color(m.color || '#ffffff'),
  };
  if (!m.metal) params.metalness = 1; // le canal B de l'ORM vaut 0 : surface non métallique
  if (m.metal) { params.metalnessMap = null; params.metalness = m.metal; }
  if (opts.displace && m.disp) {
    params.displacementMap = tex(base + 'height.jpg', m.size);
    params.displacementScale = m.disp;
    params.displacementBias = -m.disp;
  }
  let mat;
  if (m.alpha) {
    params.alphaMap = tex(base + 'alpha.jpg', m.size);
    params.transparent = true;
    params.side = THREE.DoubleSide;
    params.depthWrite = false;
    mat = new THREE.MeshPhysicalMaterial({ ...params, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') });
  } else {
    mat = new THREE.MeshStandardMaterial(params);
  }
  mat.normalScale = new THREE.Vector2(m.nscale ?? 1, m.nscale ?? 1);
  matCache.set(ck, mat);
  return mat;
}

// ------------------------------------------------------------------ UV en cm
function boxUVcm(geo, w, h, d) {
  const uv = geo.attributes.uv;
  // ordre des faces de BoxGeometry : +x, -x, +y, -y, +z, -z (4 sommets chacune)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]);
  }
}
function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
}

function shadowed(mesh, cast = true) { mesh.castShadow = cast; mesh.receiveShadow = true; return mesh; }

// ------------------------------------------------------------------ constructeurs
const hidden = new THREE.MeshBasicMaterial({ visible: false });

function slab(it, hi) {
  const g = new THREE.Group();
  const { w, d, t } = it;
  const body = new THREE.BoxGeometry(w, t, d);
  boxUVcm(body, w, t, d);
  const m = pbr(it.mat);
  const bodyMesh = shadowed(new THREE.Mesh(body, [m, m, hidden, m, m, m]));
  bodyMesh.position.y = t / 2;
  g.add(bodyMesh);
  const dens = hi ? 9 : 4.5; // subdivisions par cm pour le relief
  const sx = Math.min(hi ? 420 : 200, Math.max(16, Math.round(w * dens)));
  const sy = Math.min(hi ? 420 : 200, Math.max(16, Math.round(d * dens)));
  const top = new THREE.PlaneGeometry(w, d, sx, sy);
  top.rotateX(-Math.PI / 2);
  scaleUV(top, w, d);
  const topMesh = shadowed(new THREE.Mesh(top, pbr(it.mat, { displace: true })));
  topMesh.position.y = t + 0.002;
  g.add(topMesh);
  return g;
}

function pinked(it) {
  // échantillon de tissu à bords crantés (ciseaux cranteurs)
  const { w, d } = it, tooth = 0.7;
  const s = new THREE.Shape();
  const pts = [];
  const edge = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / tooth);
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 0.5) / n;
      pts.push([x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]);
      pts.push([x0 + (x1 - x0) * b + nx * 0.35, y0 + (y1 - y0) * b + ny * 0.35]);
    }
  };
  edge(-w / 2, -d / 2, w / 2, -d / 2, 0, -1);
  edge(w / 2, -d / 2, w / 2, d / 2, 1, 0);
  edge(w / 2, d / 2, -w / 2, d / 2, 0, 1);
  edge(-w / 2, d / 2, -w / 2, -d / 2, -1, 0);
  s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p));
  const geo = new THREE.ExtrudeGeometry(s, { depth: it.t, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(geo, pbr(it.mat))));
  return g;
}

function drape(it) {
  // voilage posé en plis souples
  const { w, d } = it;
  const geo = new THREE.PlaneGeometry(w, d, 120, 180);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const k = (z + d / 2) / d;
    const fold = Math.sin(x * 0.85 + Math.sin(z * 0.15) * 1.6) * 0.5 + 0.5;
    const y = 0.15 + fold * (0.25 + 1.1 * k * k) + Math.sin(x * 2.1 + z * 0.4) * 0.06;
    p.setY(i, y);
    p.setX(i, x * (1 - 0.06 * k * fold));
  }
  geo.computeVertexNormals();
  scaleUV(geo, w, d);
  const mesh = new THREE.Mesh(geo, pbr(it.mat));
  mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

function ribbed(it, hi) {
  // carreau à baguettes en relief, émaillé
  const { w, d } = it, n = 5, r = w / n / 2, base = 0.7;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, base);
  for (let i = n - 1; i >= 0; i--) {
    const cx = -w / 2 + r + i * 2 * r;
    s.absarc(cx, base, r * 0.98, 0, Math.PI, false);
  }
  s.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.12, bevelSegments: 3, curveSegments: hi ? 32 : 18, steps: 1 });
  geo.translate(0, 0, -d / 2);
  const g = new THREE.Group();
  const m = pbr(it.mat).clone();
  m.roughness = 0.35; // émail brillant : on atténue la carte
  g.add(shadowed(new THREE.Mesh(geo, m)));
  return g;
}

function claustra(it) {
  const { w, d, t } = it;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath();
  const cols = 2, rows = 7, mx = 1.1, my = 1.2, gap = 0.6;
  const cw = (w - 2 * mx) / cols, ch = (d - 2 * my) / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const x0 = -w / 2 + mx + c * cw + gap / 2, x1 = x0 + cw - gap;
    const y0 = -d / 2 + my + r * ch + gap / 2, y1 = y0 + ch - gap;
    const h = new THREE.Path();
    if ((r + c) % 2) { h.moveTo(x0, y0); h.lineTo(x1, y0); h.lineTo((x0 + x1) / 2, y1); }
    else { h.moveTo(x0, y1); h.lineTo((x0 + x1) / 2, y0); h.lineTo(x1, y1); }
    h.closePath();
    s.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2);
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(geo, pbr(it.mat))));
  return g;
}

function archShape(w, h, inset = 0) {
  const r = w / 2 - inset, x0 = -w / 2 + inset, x1 = w / 2 - inset, y0 = -h / 2 + inset, yc = h / 2 - w / 2;
  const s = new THREE.Shape();
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, yc);
  s.absarc(0, yc, r, 0, Math.PI, false);
  s.lineTo(x0, y0);
  return s;
}

function mirror(it) {
  const { w, d } = it, f = 1.1;
  const outer = archShape(w, d);
  outer.holes.push(archShape(w, d, f));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 1.6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 3, curveSegments: 48 });
  frame.rotateX(-Math.PI / 2);
  const glass = new THREE.ShapeGeometry(archShape(w, d, f - 0.05), 48);
  glass.rotateX(-Math.PI / 2);
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(frame, pbr(it.mat))));
  const gm = new THREE.MeshPhysicalMaterial({ color: '#f7e2d9', metalness: 1, roughness: 0.04, envMapIntensity: 4.5 });
  const gl = new THREE.Mesh(glass, gm);
  gl.position.y = 0.9; gl.receiveShadow = true;
  g.add(gl);
  return g;
}

function profile(it) {
  // angle de cadre de menuiserie : section en L avec feuillure
  const g = new THREE.Group();
  const m = pbr(it.mat);
  const L1 = 24, L2 = 17, W = 4.2;
  const mk = (wd, h, inset) => {
    const s = new THREE.Shape();
    s.moveTo(inset, inset); s.lineTo(L1, inset); s.lineTo(L1, inset + wd); s.lineTo(inset + wd, inset + wd);
    s.lineTo(inset + wd, L2); s.lineTo(inset, L2); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 2 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(-L1 / 2, 0, L2 / 2);
    return shadowed(new THREE.Mesh(geo, m));
  };
  g.add(mk(W, 3.2, 0));
  const lip = mk(1.6, 1.4, W - 0.2); lip.position.y = 0; g.add(lip);
  return g;
}

function tube(it) {
  const r = 1.25;
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(new THREE.Vector3(-16, r, 0), new THREE.Vector3(6, r, 0)));
  path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(6, r, 0), new THREE.Vector3(10, r, 0), new THREE.Vector3(10, r, 4)));
  path.add(new THREE.LineCurve3(new THREE.Vector3(10, r, 4), new THREE.Vector3(10, r, 14)));
  const geo = new THREE.TubeGeometry(path, 160, r, 32, false);
  scaleUV(geo, 34, 2 * Math.PI * r);
  const g = new THREE.Group();
  const m = pbr(it.mat);
  g.add(shadowed(new THREE.Mesh(geo, m)));
  const flange = new THREE.CylinderGeometry(3.6, 3.6, 0.7, 64);
  flange.rotateZ(Math.PI / 2);
  const fl = shadowed(new THREE.Mesh(flange, m));
  fl.position.set(-16.3, 3.6, 0);
  g.add(fl);
  [-1, 1].forEach(sg => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.4, 32), m);
    cap.rotation.x = Math.PI / 2; cap.position.set(10, r, 14 + 0.3 * (sg + 1) / 2);
    if (sg > 0) g.add(shadowed(cap));
  });
  return g;
}

function blackMetal() {
  const m = pbr('metal_noir').clone();
  m.metalness = 0.45;
  return m;
}

function lever(it) {
  const g = new THREE.Group();
  const m = blackMetal();
  const rose = new THREE.CylinderGeometry(2.6, 2.7, 0.9, 64);
  const ro = shadowed(new THREE.Mesh(rose, m)); ro.position.y = 0.45; g.add(ro);
  const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 3.4, 40), m)); neck.position.y = 2.6; g.add(neck);
  const bar = new THREE.CapsuleGeometry(0.95, 11.5, 12, 32);
  bar.rotateZ(Math.PI / 2);
  const b = shadowed(new THREE.Mesh(bar, m)); b.position.set(5.4, 4.6, 0); g.add(b);
  return g;
}

function knob(it) {
  const pts = [[0, 0], [1.15, 0], [1.15, 0.12], [0.75, 0.5], [0.7, 1.4], [1.5, 1.9], [1.8, 2.3], [1.75, 2.65], [1.2, 2.85], [0, 2.9]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 96);
  scaleUV(geo, 11, 4);
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(geo, blackMetal())));
  return g;
}

function vase(it) {
  const prof = it.shape === 'round'
    ? [[0, 0], [2.6, 0], [3.6, 0.6], [4.4, 2.4], [4.3, 4.6], [3.1, 6.4], [1.6, 7.3], [1.25, 8.1], [1.4, 8.6], [1.1, 8.65]]
    : [[0, 0], [4.2, 0], [4.9, 0.4], [5.2, 2], [5.3, 9], [5.0, 11.6], [3.6, 14.2], [1.9, 16.2], [1.5, 18.6], [1.65, 21.4], [1.35, 21.5]];
  const pts = prof.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(80), 96);
  const h = prof[prof.length - 1][1];
  scaleUV(geo, 30, h);
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(geo, pbr(it.mat))));
  return g;
}

function pendant(it) {
  // suspension « bocal » posée sur le flanc, câble noir
  const g = new THREE.Group();
  const prof = [[1.6, 0], [2.6, 0.4], [5.0, 1.6], [6.4, 4], [6.6, 8], [6.3, 11], [5.4, 12.4], [5.0, 12.6]];
  const glassGeo = new THREE.LatheGeometry(new THREE.SplineCurve(prof.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(60), 96);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.4, ior: 1.5, side: THREE.DoubleSide, envMapIntensity: 2.2 });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.receiveShadow = true;
  const holder = new THREE.Group();
  holder.add(glass);
  const black = blackMetal();
  const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 1.6, 40), black)); cap.position.y = -0.6; holder.add(cap);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.8, 8, 24), new THREE.MeshStandardMaterial({ color: '#fff7e8', emissive: '#ffe2b0', emissiveIntensity: 0.6, roughness: 0.2 }));
  bulb.position.y = 2.6; holder.add(bulb);
  holder.rotation.z = Math.PI / 2;
  holder.position.set(6.3, 6.6, 0);
  g.add(holder);
  const cable = new THREE.CatmullRomCurve3([[6.9, 6.6, 0], [8.5, 1.2, 0], [12, 0.3, 2], [17, 0.3, 0], [22, 0.3, -4], [26, 0.3, -1]].map(p => new THREE.Vector3(...p)));
  g.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(cable, 120, 0.22, 10, false), new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.5 }))));
  g.children.forEach(c => (c.position.x -= 10));
  return g;
}

const photoCache = new Map();
function photo(it, aspectOf) {
  const g = new THREE.Group();
  const asp = aspectOf(it.img); // largeur / hauteur
  const L = it.long, b = 0.9;
  const iw = asp >= 1 ? L : L * asp, ih = asp >= 1 ? L / asp : L;
  const W = iw + 2 * b, D = ih + 2 * b + (asp >= 1 ? 0 : 0);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D), new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.85 }));
  paper.position.y = 0.03;
  g.add(shadowed(paper));
  if (!photoCache.has(it.img)) {
    const t = loader.load(`photos/${it.img}.jpg`);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    photoCache.set(it.img, t);
  }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), new THREE.MeshStandardMaterial({ map: photoCache.get(it.img), roughness: 0.45 }));
  pic.rotation.x = -Math.PI / 2; pic.position.y = 0.062; pic.receiveShadow = true;
  g.add(pic);
  // bandes de masking tape
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#e7dcc4', roughness: 0.9, transparent: true, opacity: 0.82 });
  [[-1, -1, 0.6], [1, -1, -0.5]].forEach(([sx, sz, a]) => {
    const tp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.03, 1.8), tapeMat);
    tp.position.set(sx * (W / 2 - 0.8), 0.08, sz * (D / 2 - 0.2));
    tp.rotation.y = a;
    tp.receiveShadow = true;
    g.add(tp);
  });
  return g;
}

function text(it, font) {
  const g = new THREE.Group();
  if (!font) return g;
  const geo = new TextGeometry(it.text, { font, size: it.size, depth: 0.8, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
  geo.rotateX(-Math.PI / 2);
  // les lettres de bois se lisent mieux avec le fil horizontal
  g.add(shadowed(new THREE.Mesh(geo, pbr(it.mat))));
  return g;
}

export function buildItem(it, ctx, hi = false) {
  switch (it.kind) {
    case 'slab': return slab(it, hi);
    case 'pinked': return pinked(it);
    case 'drape': return drape(it);
    case 'ribbed': return ribbed(it, hi);
    case 'claustra': return claustra(it);
    case 'mirror': return mirror(it);
    case 'profile': return profile(it);
    case 'tube': return tube(it);
    case 'lever': return lever(it);
    case 'knob': return knob(it);
    case 'vase': return vase(it);
    case 'pendant': return pendant(it);
    case 'photo': return photo(it, ctx.aspectOf);
    case 'text': return text(it, ctx.font);
  }
  return new THREE.Group();
}
