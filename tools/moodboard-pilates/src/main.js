import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { BOARD, ITEMS } from './data.js';
import { buildItem, setAnisotropy } from './builders.js';

const STORE_KEY = 'moodboard-pilates-v1';
const $ = s => document.querySelector(s);
const deg = THREE.MathUtils.degToRad;

// ------------------------------------------------------------------ état
const defaults = () => ({
  mode: 'compose', labels: false, lettering: true,
  items: Object.fromEntries(ITEMS.map((it, i) => [it.id, { x: it.x, z: it.z, rot: it.rot, order: i }])),
});
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    for (const id in d.items) if (s.items && s.items[id]) Object.assign(d.items[id], s.items[id]);
    d.mode = s.mode === 'lock' ? 'lock' : 'compose';
    d.labels = !!s.labels;
    d.lettering = s.lettering !== false;
    return d;
  } catch { return d; }
}
let state = load();
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); flash('Composition enregistrée'); } catch { flash("Enregistrement impossible dans ce navigateur"); }
  }, 250);
}
function flash(msg) {
  const el = $('#status');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(flash.t);
  flash.t = setTimeout(() => el.classList.remove('on'), 1600);
}

// ------------------------------------------------------------------ rendu principal
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);
setAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.42;

const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
const HOME = { pos: new THREE.Vector3(0, 250, 105), target: new THREE.Vector3(0, 0, 2) };
const HOME_DIR = new THREE.Vector3(0, 250, 103).normalize();
let userMoved = false;
camera.position.copy(HOME.pos);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.maxPolarAngle = deg(68);
controls.minDistance = 40;
controls.maxDistance = 340;
controls.screenSpacePanning = false;
controls.update();
controls.addEventListener('start', () => (userMoved = true));

// lumière : soleil doux en haut à gauche + fill
const sun = new THREE.DirectionalLight('#fff6ec', 2.5);
sun.position.set(-80, 140, -55);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 70, bottom: -70, near: 20, far: 400 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 7;
sun.shadow.blurSamples = 16;
sun.shadow.intensity = 0.85;
scene.add(sun);
scene.add(new THREE.HemisphereLight('#fffaf2', '#d8d0c4', 0.15));

// sol et planche
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -BOARD.t; ground.receiveShadow = true;
scene.add(ground);
const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w, BOARD.t, BOARD.d), new THREE.MeshStandardMaterial({ color: '#efece7', roughness: 0.9 }));
board.position.y = -BOARD.t / 2; board.receiveShadow = true; board.castShadow = true;
scene.add(board);

function applyThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  // le fond est peint par la page (canevas transparent) : aucune couleur à recalculer ici
  void cs;
}
applyThemeColors();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyThemeColors);
new MutationObserver(applyThemeColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ombre de contact douce sous chaque élément
function softTexture(round) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  g.filter = 'blur(12px)'; g.fillStyle = '#fff';
  if (round) { g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.fill(); }
  else g.fillRect(26, 26, 76, 76);
  const t = new THREE.CanvasTexture(c);
  return t;
}
const softRect = softTexture(false), softRound = softTexture(true);

// ------------------------------------------------------------------ éléments
const nodes = new Map(); // id -> { it, root, lx, lz, hx, hz, h, y, ty }
const ctx = { aspectOf: id => photoAspect[id] || 1.4, font: null };
const photoAspect = {};

function makeNode(it) {
  const inner = buildItem(it, ctx);
  const root = new THREE.Group();
  root.add(inner);
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(inner);
  const n = { it, root, inner, cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2,
    hx: (bb.max.x - bb.min.x) / 2, hz: (bb.max.z - bb.min.z) / 2, h: bb.max.y, y: 0, ty: 0 };
  const round = it.kind === 'vase' || it.kind === 'knob';
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#000', alphaMap: round ? softRound : softRect, transparent: true, opacity: it.kind === 'photo' || it.kind === 'drape' ? 0.16 : 0.26, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2;
  sh.scale.set(n.hx * 2 * 1.6 + 2, n.hz * 2 * 1.6 + 2, 1);
  sh.position.set(n.cx, 0.02, n.cz);
  sh.raycast = () => {};
  sh.renderOrder = -1;
  root.add(sh);
  root.traverse(o => { o.userData.id = it.id; });
  scene.add(root);
  nodes.set(it.id, n);
  return n;
}

function obb(n, s) {
  const r = deg(s.rot), c = Math.cos(r), si = Math.sin(r);
  // rotation autour de y : x' = x c + z s ; z' = -x s + z c
  const cx = s.x + n.cx * c + n.cz * si, cz = s.z - n.cx * si + n.cz * c;
  return { cx, cz, ax: [c, -si], az: [si, c], hx: n.hx - 0.25, hz: n.hz - 0.25 };
}
function overlap(a, b) {
  const axes = [a.ax, a.az, b.ax, b.az];
  const d = [b.cx - a.cx, b.cz - a.cz];
  for (const ax of axes) {
    const proj = o => Math.abs(o.hx * (o.ax[0] * ax[0] + o.ax[1] * ax[1])) + Math.abs(o.hz * (o.az[0] * ax[0] + o.az[1] * ax[1]));
    if (Math.abs(d[0] * ax[0] + d[1] * ax[1]) > proj(a) + proj(b)) return false;
  }
  return true;
}

function visibleIds() {
  return ITEMS.filter(it => it.kind !== 'text' || state.lettering).map(it => it.id);
}

function layout(instant = false) {
  const ids = visibleIds().sort((a, b) => state.items[a].order - state.items[b].order);
  const placed = [];
  for (const id of ids) {
    const n = nodes.get(id); if (!n) continue;
    const s = state.items[id];
    const o = obb(n, s);
    let y = 0;
    for (const p of placed) if (overlap(o, p.o)) y = Math.max(y, p.top);
    n.ty = y + (y > 0 ? 0.02 : 0);
    if (instant) n.y = n.ty;
    placed.push({ o, top: n.ty + n.h });
    n.root.position.set(s.x, n.y, s.z);
    n.root.rotation.y = deg(s.rot);
  }
  for (const it of ITEMS) {
    const n = nodes.get(it.id);
    if (n) n.root.visible = it.kind !== 'text' || state.lettering;
  }
}

// ------------------------------------------------------------------ étiquettes
const labelLayer = $('#labels');
const labels = new Map();
function makeLabel(it) {
  const el = document.createElement('div');
  el.className = 'tag';
  el.innerHTML = `<b></b><span></span>`;
  el.querySelector('b').textContent = it.name;
  el.querySelector('span').textContent = it.maker;
  if (/non identifié/.test(it.maker)) el.classList.add('unknown');
  labelLayer.appendChild(el);
  labels.set(it.id, el);
}
const v3 = new THREE.Vector3();
function updateLabels() {
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const [id, el] of labels) {
    const n = nodes.get(id);
    const show = n && n.root.visible && (state.labels || id === hoverId || id === selectedId) && !detailOpen;
    el.classList.toggle('on', !!show);
    // toutes les étiquettes affichées : version courte, sauf l'élément survolé ou sélectionné
    el.classList.toggle('compact', state.labels && id !== hoverId && id !== selectedId);
    if (!show) continue;
    const s = state.items[id], o = obb(n, s);
    v3.set(o.cx, n.y + n.h + 0.5, o.cz).project(camera);
    el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * w}px, ${(-v3.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
  }
  // barre d'outils de l'élément sélectionné
  const tb = $('#itemTools');
  if (selectedId && state.mode === 'compose' && !detailOpen) {
    const n = nodes.get(selectedId), s = state.items[selectedId], o = obb(n, s);
    v3.set(o.cx, n.y, o.cz + n.hz).project(camera);
    tb.hidden = false;
    tb.style.transform = `translate(${Math.min(w - 120, Math.max(120, (v3.x * 0.5 + 0.5) * w))}px, ${Math.min(h - 60, (-v3.y * 0.5 + 0.5) * h + 14)}px) translate(-50%, 0)`;
  } else tb.hidden = true;
}

// ------------------------------------------------------------------ interactions
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hoverId = null, selectedId = null, drag = null, down = null, detailOpen = false;

function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = [...nodes.values()].filter(n => n.root.visible).map(n => n.root);
  const hit = ray.intersectObjects(objs, true)[0];
  return hit ? hit.object.userData.id : null;
}

function select(id) {
  selectedId = id;
  $('#selName').textContent = id ? ITEMS.find(i => i.id === id).name : '';
}

stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const id = pick(e);
  down = { x: e.clientX, y: e.clientY, id };
  if (id && state.mode === 'compose') {
    controls.enabled = false;
    const s = state.items[id];
    const maxOrder = Math.max(...Object.values(state.items).map(v => v.order));
    if (s.order !== maxOrder) s.order = maxOrder + 1;
    select(id);
    const n = nodes.get(id);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -n.y);
    const p = new THREE.Vector3();
    ray.ray.intersectPlane(plane, p);
    drag = { id, plane, off: new THREE.Vector3(p.x - s.x, 0, p.z - s.z), moved: false };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('grabbing');
  }
}, { capture: true });

stage.addEventListener('pointermove', e => {
  if (drag) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(drag.plane, p)) {
      const s = state.items[drag.id];
      s.x = THREE.MathUtils.clamp(p.x - drag.off.x, -BOARD.w / 2 - 6, BOARD.w / 2 + 6);
      s.z = THREE.MathUtils.clamp(p.z - drag.off.z, -BOARD.d / 2 - 6, BOARD.d / 2 + 6);
      drag.moved = true;
      layout();
    }
    return;
  }
  if (e.pointerType === 'mouse') {
    const id = pick(e);
    if (id !== hoverId) { hoverId = id; stage.classList.toggle('hovering', !!id); }
  }
});

function endPointer(e) {
  const wasClick = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5;
  if (drag) {
    stage.releasePointerCapture?.(e.pointerId);
    if (drag.moved) save();
    drag = null;
    stage.classList.remove('grabbing');
  }
  controls.enabled = true;
  if (wasClick) {
    if (state.mode === 'lock' && down.id) openDetail(down.id);
    if (state.mode === 'compose' && !down.id) select(null);
  }
  down = null;
}
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);
stage.addEventListener('dblclick', e => { const id = pick(e); if (id) openDetail(id); });

function rotateSel(step) {
  if (!selectedId || state.mode !== 'compose') return;
  state.items[selectedId].rot = (state.items[selectedId].rot + step + 360) % 360;
  layout(); save();
}
function sendBack() {
  if (!selectedId) return;
  const minOrder = Math.min(...Object.values(state.items).map(v => v.order));
  state.items[selectedId].order = minOrder - 1;
  layout(); save();
}
$('#rotL').onclick = () => rotateSel(-15);
$('#rotR').onclick = () => rotateSel(15);
$('#back').onclick = sendBack;
$('#look').onclick = () => selectedId && openDetail(selectedId);
addEventListener('keydown', e => {
  if (e.target.closest('input, button') && e.key !== 'Escape') return;
  if (e.key === 'Escape') { detailOpen ? closeDetail() : select(null); }
  if (detailOpen) return;
  if (e.key === 'q' || e.key === 'Q') rotateSel(e.shiftKey ? -5 : -15);
  if (e.key === 'e' || e.key === 'E') rotateSel(e.shiftKey ? 5 : 15);
});
stage.addEventListener('wheel', e => {
  if (state.mode === 'compose' && selectedId && e.altKey) { e.preventDefault(); e.stopPropagation(); rotateSel(e.deltaY > 0 ? 5 : -5); }
}, { capture: true, passive: false });

// ------------------------------------------------------------------ barre d'outils générale
function syncUI() {
  document.body.dataset.mode = state.mode;
  $('#modeCompose').setAttribute('aria-pressed', state.mode === 'compose');
  $('#modeLock').setAttribute('aria-pressed', state.mode === 'lock');
  $('#tLabels').setAttribute('aria-pressed', state.labels);
  $('#tLetter').setAttribute('aria-pressed', state.lettering);
  $('#hint').textContent = state.mode === 'compose'
    ? 'Glisser un échantillon pour le déplacer · Q / E ou Alt + molette pour le tourner · double-clic pour l’examiner'
    : 'Composition figée · clic sur un échantillon pour l’examiner · glisser pour tourner autour de la planche';
}
$('#modeCompose').onclick = () => { state.mode = 'compose'; syncUI(); save(); };
$('#modeLock').onclick = () => { state.mode = 'lock'; select(null); syncUI(); save(); };
$('#tLabels').onclick = () => { state.labels = !state.labels; syncUI(); save(); };
$('#tLetter').onclick = () => { state.lettering = !state.lettering; layout(); syncUI(); save(); };
$('#home').onclick = () => { userMoved = false; flyTo(HOME.pos, HOME.target); };
const resetBtn = $('#reset');
resetBtn.onclick = () => {
  if (!resetBtn.classList.contains('confirm')) {
    resetBtn.classList.add('confirm'); resetBtn.textContent = 'Confirmer la réinitialisation';
    clearTimeout(resetBtn.t);
    resetBtn.t = setTimeout(() => { resetBtn.classList.remove('confirm'); resetBtn.textContent = 'Réinitialiser'; }, 3500);
    return;
  }
  resetBtn.classList.remove('confirm'); resetBtn.textContent = 'Réinitialiser';
  const keep = { mode: state.mode, labels: state.labels, lettering: state.lettering };
  state = { ...defaults(), ...keep };
  select(null); layout(); save();
};

let fly = null;
function flyTo(pos, target) { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), k: 0 }; }

// inventaire
function buildInventory() {
  const list = $('#invList');
  const cats = [...new Set(ITEMS.map(i => i.cat))];
  for (const c of cats) {
    const h = document.createElement('h3'); h.textContent = c; list.appendChild(h);
    for (const it of ITEMS.filter(i => i.cat === c)) {
      const b = document.createElement('button');
      b.className = 'inv-row';
      b.innerHTML = '<b></b><span></span>';
      b.querySelector('b').textContent = it.name;
      b.querySelector('span').textContent = it.maker;
      b.onclick = () => openDetail(it.id);
      list.appendChild(b);
    }
  }
}
$('#invToggle').onclick = () => {
  const p = $('#inventory'); p.hidden = !p.hidden;
  $('#invToggle').setAttribute('aria-expanded', !p.hidden);
};
$('#invClose').onclick = () => { $('#inventory').hidden = true; $('#invToggle').setAttribute('aria-expanded', false); };

// ------------------------------------------------------------------ vue de près
let dv = null;
function initDetail() {
  const canvasWrap = $('#detailStage');
  const r = new THREE.WebGLRenderer({ antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 0.95;
  canvasWrap.appendChild(r.domElement);
  const sc = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r);
  sc.environment = pm.fromScene(new RoomEnvironment(r), 0.04).texture;
  sc.environmentIntensity = 0.22;
  const cam = new THREE.PerspectiveCamera(32, 1, 0.5, 1000);
  const ctl = new OrbitControls(cam, r.domElement);
  ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.6;
  ctl.addEventListener('start', () => (ctl.autoRotate = false));
  const light = new THREE.DirectionalLight('#fff4e6', 3.6);
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0004; light.shadow.normalBias = 0.02; light.shadow.radius = 3; light.shadow.blurSamples = 12;
  sc.add(light, light.target);
  sc.add(new THREE.HemisphereLight('#ffffff', '#cfc7bb', 0.12));
  const plinth = new THREE.Mesh(new THREE.CircleGeometry(200, 64), new THREE.MeshStandardMaterial({ color: '#d9d4cc', roughness: 1 }));
  plinth.rotation.x = -Math.PI / 2; plinth.position.y = -0.01; plinth.receiveShadow = true;
  sc.add(plinth);
  dv = { r, sc, cam, ctl, light, plinth, obj: null, radius: 20 };
  const resize = () => {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvasWrap);
  resize();
  $('#lightEl').oninput = placeLight;
  $('#lightAz').oninput = placeLight;
}
function placeLight() {
  const el = deg(+$('#lightEl').value), az = deg(+$('#lightAz').value);
  const d = dv.radius * 4;
  dv.light.position.set(Math.cos(az) * Math.cos(el) * d, Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d);
  const s = dv.radius * 1.6;
  Object.assign(dv.light.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: d * 3 });
  dv.light.shadow.camera.updateProjectionMatrix();
  $('#lightElOut').textContent = `${$('#lightEl').value}°`;
}
function openDetail(id) {
  const it = ITEMS.find(i => i.id === id);
  if (!dv) initDetail();
  if (dv.obj) { dv.sc.remove(dv.obj); }
  const obj = buildItem(it, ctx, true);
  obj.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; } });
  dv.sc.add(obj); dv.obj = obj;
  const bb = new THREE.Box3().setFromObject(obj);
  const c = bb.getCenter(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z;
  const size = bb.getSize(new THREE.Vector3());
  dv.radius = Math.max(size.x, size.z, size.y) * 0.6 + 1;
  dv.ctl.target.set(0, size.y * 0.35, 0);
  dv.cam.position.set(dv.radius * 1.05, dv.radius * 1.6, dv.radius * 2.15);
  dv.ctl.minDistance = dv.radius * 0.5; dv.ctl.maxDistance = dv.radius * 6;
  dv.ctl.autoRotate = true;
  placeLight();
  const sc = getComputedStyle(document.documentElement).getPropertyValue('--detail-bg').trim() || '#e2ddd6';
  dv.sc.background = new THREE.Color(sc);
  dv.plinth.material.color.set(sc).multiplyScalar(0.96);
  $('#dCat').textContent = it.cat;
  $('#dName').textContent = it.name;
  $('#dMaker').textContent = it.maker;
  $('#dWhere').textContent = it.where;
  $('#dNote').textContent = it.note || '—';
  const dims = it.w ? `${fmt(it.w)} × ${fmt(it.d)} cm` : `${fmt(size.x)} × ${fmt(size.z)} cm`;
  $('#dSize').textContent = dims;
  $('#detail').hidden = false;
  detailOpen = true;
  select(null);
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  $('#dClose').focus();
}
const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
function closeDetail() { $('#detail').hidden = true; detailOpen = false; }
$('#dClose').onclick = closeDetail;
$('#detail').addEventListener('pointerdown', e => { if (e.target.id === 'detail') closeDetail(); });

// ------------------------------------------------------------------ boucle
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // recule la caméra sur écran étroit pour garder la planche entière
  camera.fov = w / h < 1 ? 30 : 25;
  camera.updateProjectionMatrix();
  // cadrage : la planche entière tient dans l'écran, quel que soit le format
  const vf = deg(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  const dist = Math.max((BOARD.w / 2 + 8) / Math.tan(hf), (BOARD.d / 2 + 14) / Math.tan(vf)) * 1.08;
  HOME.pos.copy(HOME.target).addScaledVector(HOME_DIR, dist);
  controls.maxDistance = Math.max(340, dist * 1.6);
  if (!userMoved) camera.position.copy(HOME.pos);
}
new ResizeObserver(resize).observe(stage);

function tick() {
  requestAnimationFrame(tick);
  if (fly) {
    fly.k = Math.min(1, fly.k + 0.04);
    const e = 1 - Math.pow(1 - fly.k, 3);
    camera.position.lerpVectors(fly.p0, fly.p1, e);
    controls.target.lerpVectors(fly.t0, fly.t1, e);
    if (fly.k >= 1) fly = null;
  }
  for (const n of nodes.values()) {
    if (Math.abs(n.ty - n.y) > 0.001) { n.y += (n.ty - n.y) * 0.25; n.root.position.y = n.y; }
  }
  if (detailOpen && dv) { dv.ctl.update(); dv.r.render(dv.sc, dv.cam); return; }
  controls.update();
  renderer.render(scene, camera);
  updateLabels();
}

// ------------------------------------------------------------------ démarrage
async function start() {
  const imgs = [...new Set(ITEMS.filter(i => i.kind === 'photo').map(i => i.img))];
  await Promise.all(imgs.map(src => new Promise(res => {
    const im = new Image();
    im.onload = () => { photoAspect[src] = im.naturalWidth / im.naturalHeight; res(); };
    im.onerror = res;
    im.src = `photos/${src}.jpg`;
  })));
  try { ctx.font = await new FontLoader().loadAsync('mont.typeface.json'); } catch { ctx.font = null; }
  ITEMS.forEach(it => { makeNode(it); makeLabel(it); });
  buildInventory();
  layout(true);
  syncUI();
  resize();
  tick();
  THREE.DefaultLoadingManager.onLoad = () => document.body.classList.add('ready');
  setTimeout(() => document.body.classList.add('ready'), 6000);
}
start();
