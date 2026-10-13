import { xpCalme } from './outils';

/**
 * Pilates Room : la planche des matériaux, en volume. Les échantillons ne bougent pas : c'est la caméra
 * qui bouge. Elle part de la vue de dessus (comme la planche à plat), s'incline quand la planche arrive à
 * l'écran, puis respire un peu, comme tenue à la main.
 * Glisser : tourner autour. La molette : se rapprocher, reculer. Cliquer un échantillon : la caméra s'en approche et son nom s'écrit ; recliquer,
 * cliquer ailleurs ou Échap : elle recule. Sur téléphone, le doigt tourne la caméra à l'horizontale.
 */
type Cam = { yaw: number; tilt: number; zoom: number; px: number; py: number };
const VOLUME = { yaw: -14, tilt: 52 };

export function xpMateriaux(root: HTMLElement) {
  const scene = root.querySelector<HTMLElement>('[data-materiaux-scene]');
  const table = root.querySelector<HTMLElement>('[data-materiaux]');
  if (!scene || !table) return () => {};
  const items = [...table.querySelectorAll<HTMLElement>('[data-echantillon]')];
  // la fiche à côté de la planche : la liste des matériaux, ou la fiche de celui qu'on regarde
  const bloc = scene.closest<HTMLElement>('[data-materiaux-bloc]') || root;
  const liste = bloc.querySelector<HTMLElement>('[data-fiche-liste]');
  const fiches = [...bloc.querySelectorAll<HTMLElement>('[data-fiche]')];
  const calme = xpCalme();
  const etroit = () => matchMedia('(max-width: 760px)').matches;

  // chaque échantillon repose sur la planche, ou sur le plus haut de ceux qui sont dessous
  const empile = () => {
    const poses: { g: number; d: number; h: number; b: number; haut: number }[] = [];
    items.forEach((el, i) => {
      const m = Math.min(el.offsetWidth, el.offsetHeight) * 0.12;
      const b = { g: el.offsetLeft + m, d: el.offsetLeft + el.offsetWidth - m, h: el.offsetTop + m, b: el.offsetTop + el.offsetHeight - m };
      const z = poses.filter((p) => p.g < b.d && b.g < p.d && p.h < b.b && b.h < p.b).reduce((mx, p) => Math.max(mx, p.haut), 0);
      el.style.setProperty('--z0', `${z}px`);
      el.style.zIndex = String(i + 1);
      poses.push({ ...b, haut: z + (Number(el.dataset.ep) || 1) });
    });
  };

  // ---------- la caméra ----------
  let P = 1100;
  const vue = { yaw: 0, tilt: 0, zoom: 1 };
  if (calme) Object.assign(vue, VOLUME);
  const cam: Cam = { ...vue, px: 0, py: 0 };
  let vise: HTMLElement | null = null;
  const cible = (): Cam => {
    if (!vise) return { ...vue, px: 0, py: 0 };
    return {
      yaw: vue.yaw, tilt: vue.tilt < 4 ? 0 : 54, zoom: etroit() ? 2 : 2.3,
      px: table.clientWidth / 2 - (vise.offsetLeft + vise.offsetWidth / 2),
      py: table.clientHeight / 2 - (vise.offsetTop + vise.offsetHeight / 2),
    };
  };
  const t0 = performance.now();
  let last = t0, raf = 0, visible = false, tenu = false;
  const image = (now: number) => {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const c = cible();
    const k = calme ? 1 : 1 - Math.exp(-dt / 0.42);
    (Object.keys(cam) as (keyof Cam)[]).forEach((p) => { cam[p] += (c[p] - cam[p]) * k; });
    let yaw = cam.yaw, tilt = cam.tilt, zoom = cam.zoom;
    if (!calme && !tenu && vue.tilt >= 4) {
      const t = (now - t0) / 1000;
      yaw += 3 * Math.sin(t * 0.55) + 0.7 * Math.sin(t * 1.3);
      tilt += 1.5 * Math.sin(t * 0.8 + 1);
      zoom *= 1 + 0.012 * Math.sin(t * 0.43 + 2);
    }
    table.style.transform = `translateZ(${(P * (1 - 1 / zoom)).toFixed(1)}px) rotateX(${tilt.toFixed(2)}deg) rotateZ(${yaw.toFixed(2)}deg) translate3d(${cam.px.toFixed(1)}px, ${cam.py.toFixed(1)}px, 0)`;
    const a = (yaw * Math.PI) / 180;
    table.style.setProperty('--sx', `${(50 - 60 * Math.sin(a)).toFixed(1)}%`);
    table.style.setProperty('--sy', `${(55 - tilt * 0.9).toFixed(1)}%`);
    if (visible) raf = requestAnimationFrame(image);
  };
  const anime = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(image); } };

  // la caméra s'incline une fois, quand la planche arrive à l'écran
  let premiere = !calme;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) return;
    anime();
    if (premiere && e.intersectionRatio > 0.4) { premiere = false; setTimeout(() => { Object.assign(vue, VOLUME); }, 500); }
  }, { threshold: [0, 0.45] });
  io.observe(scene);

  const viser = (el: HTMLElement | null) => {
    if (vise) delete vise.dataset.vise;
    vise = el && el !== vise ? el : null;
    if (vise) vise.dataset.vise = '';
    scene.toggleAttribute('data-proche', !!vise);
    const f = vise?.dataset.echantillon || '';
    fiches.forEach((x) => { x.hidden = x.dataset.fiche !== f; });
    if (liste) liste.hidden = !!f;
    items.forEach((x) => x.setAttribute('aria-pressed', String(x === vise)));
    anime();
  };

  // glisser : la caméra tourne ; un clic sans glisser : s'approcher, ou reculer
  let geste: { id: number; x: number; y: number; lx: number; ly: number; touche: boolean; bouge: boolean } | null = null;
  let aBouge = false;
  const prend = (e: PointerEvent) => {
    if (e.button > 0) return;
    geste = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, touche: e.pointerType === 'touch', bouge: false };
    aBouge = false;
    if (!geste.touche) e.preventDefault();
  };
  const deplace = (e: PointerEvent) => {
    if (!geste || e.pointerId !== geste.id) return;
    const dx = e.clientX - geste.lx, dy = e.clientY - geste.ly;
    geste.lx = e.clientX; geste.ly = e.clientY;
    if (!geste.bouge) {
      if (Math.hypot(e.clientX - geste.x, e.clientY - geste.y) < 5) return;
      geste.bouge = aBouge = tenu = true;
      try { scene.setPointerCapture(e.pointerId); } catch { /* le doigt est déjà parti */ }
      scene.dataset.geste = '';
    }
    vue.yaw += dx * 0.28;
    if (!geste.touche) vue.tilt = Math.min(68, Math.max(0, vue.tilt - dy * 0.18));
    premiere = false;
    anime();
  };
  const lache = (e: PointerEvent) => {
    if (!geste || e.pointerId !== geste.id) return;
    delete scene.dataset.geste;
    geste = null; tenu = false;
  };
  const clic = (e: MouseEvent) => {
    if (aBouge) { aBouge = false; return; }
    viser((e.target as Element).closest<HTMLElement>('[data-echantillon]'));
  };
  const touche = (e: KeyboardEvent) => { if (e.key === 'Escape' && vise) viser(null); };
  // la liste de la fiche : un nom ouvre sa fiche (et la caméra va voir l'échantillon) ; « tous » y revient
  const choisir = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-choisir]');
    if (!b) return;
    const el = items.find((x) => x.dataset.echantillon === b.dataset.choisir) || null;
    if (el !== vise) viser(el);
    if (!el) liste?.querySelector<HTMLElement>(`[data-choisir]`)?.focus({ preventScroll: true });
  };
  bloc.addEventListener('click', choisir);
  bloc.addEventListener('keydown', touche);
  // la molette rapproche ou recule la caméra ; arrivée au bout, elle rend la main à la page
  const molette = (e: WheelEvent) => {
    const z = Math.min(3, Math.max(0.75, vue.zoom * Math.exp(-e.deltaY * 0.0016)));
    if (z === vue.zoom) return;
    e.preventDefault();
    vue.zoom = z; premiere = false;
    if (vise && e.deltaY > 0) viser(null);
    anime();
  };
  scene.addEventListener('pointerdown', prend);
  scene.addEventListener('pointermove', deplace);
  scene.addEventListener('pointerup', lache);
  scene.addEventListener('pointercancel', lache);
  scene.addEventListener('click', clic);
  scene.addEventListener('wheel', molette, { passive: false });

  const recale = () => {
    P = parseFloat(getComputedStyle(scene).perspective) || 1100;
    empile(); anime();
  };
  addEventListener('resize', recale);
    requestAnimationFrame(recale);
  return () => { bloc.removeEventListener('click', choisir); bloc.removeEventListener('keydown', touche); io.disconnect(); cancelAnimationFrame(raf); visible = false; removeEventListener('resize', recale); };
}
