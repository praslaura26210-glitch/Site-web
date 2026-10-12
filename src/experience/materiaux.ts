import { xpCalme } from './outils';

/**
 * Pilates Room : la table des matériaux, en volume.
 * Une caméra regarde la table : elle part de la vue de dessus (comme la planche), puis s'incline quand la
 * table arrive à l'écran ; ensuite elle bouge très légèrement, comme tenue à la main.
 * Glisser sur la table : tourner autour. Glisser un échantillon : le déplacer (il retombe à plat, sur la
 * table ou sur l'échantillon qui est dessous). Cliquer un échantillon : la caméra s'en approche ; recliquer,
 * ou cliquer la table, ou Échap : elle recule. Au clavier : flèches pour déplacer, R pour tourner.
 * Sur téléphone, le doigt fait tourner la caméra (à l'horizontale) ; les échantillons s'ouvrent d'un tapotement.
 */
type Cam = { yaw: number; tilt: number; zoom: number; px: number; py: number };
const VOLUME = { yaw: -16, tilt: 50 };

export function xpMateriaux(root: HTMLElement) {
  const scene = root.querySelector<HTMLElement>('[data-materiaux-scene]');
  const table = root.querySelector<HTMLElement>('[data-materiaux]');
  if (!scene || !table) return () => {};
  const items = [...table.querySelectorAll<HTMLElement>('[data-echantillon]')];
  const nomEl = scene.querySelector<HTMLElement>('[data-materiaux-nom]');
  const vueBtn = scene.querySelector<HTMLElement>('[data-cam="vue"]');
  const calme = xpCalme();

  // ---------- les échantillons sur la table ----------
  const etroit = () => matchMedia('(max-width: 760px)').matches;
  const depart = (el: HTMLElement) => JSON.parse((etroit() ? el.dataset.departM : el.dataset.depart)!) as number[];
  const etat = new Map(items.map((el, i) => {
    const [x, y, r] = depart(el);
    return [el, { x, y, r, ordre: i, ep: Number(el.dataset.ep) || 1 }];
  }));
  let ordre = items.length;
  const pose = (el: HTMLElement) => {
    const s = etat.get(el)!;
    const lx = (el.offsetWidth / table.clientWidth) * 100, ly = (el.offsetHeight / table.clientHeight) * 100;
    s.x = Math.min(Math.max(s.x, -4), 104 - lx);
    s.y = Math.min(Math.max(s.y, -4), 104 - ly);
    el.style.setProperty('--x', s.x.toFixed(2));
    el.style.setProperty('--y', s.y.toFixed(2));
    el.style.setProperty('--r', s.r.toFixed(1));
  };
  // la gravité : chaque échantillon repose sur la table, ou sur le plus haut de ceux qui sont dessous
  const empile = () => {
    const boite = (el: HTMLElement) => {
      const m = Math.min(el.offsetWidth, el.offsetHeight) * 0.15;
      return { g: el.offsetLeft + m, d: el.offsetLeft + el.offsetWidth - m, h: el.offsetTop + m, b: el.offsetTop + el.offsetHeight - m };
    };
    const poses: { b: ReturnType<typeof boite>; haut: number }[] = [];
    [...items].sort((a, b) => etat.get(a)!.ordre - etat.get(b)!.ordre).forEach((el) => {
      const b = boite(el);
      const z = poses.filter((p) => p.b.g < b.d && b.g < p.b.d && p.b.h < b.b && b.h < p.b.b).reduce((m, p) => Math.max(m, p.haut), 0);
      el.style.setProperty('--z0', `${z}px`);
      el.style.zIndex = String(etat.get(el)!.ordre + 1);
      poses.push({ b, haut: z + etat.get(el)!.ep });
    });
  };
  const dessus = (el: HTMLElement) => { etat.get(el)!.ordre = ++ordre; };

  // ---------- la caméra ----------
  let P = 1100; // la perspective de la scène (.matScene), relue au redimensionnement
  const vue = { yaw: 0, tilt: 0, zoom: 1 };
  if (calme) Object.assign(vue, VOLUME);
  const cam: Cam = { ...vue, px: 0, py: 0 };
  let vise: HTMLElement | null = null;
  const cible = (): Cam => {
    if (!vise) return { ...vue, px: 0, py: 0 };
    return {
      yaw: vue.yaw, tilt: vue.tilt < 4 ? 0 : 56, zoom: etroit() ? 1.9 : 2.3,
      px: table.clientWidth / 2 - (vise.offsetLeft + vise.offsetWidth / 2),
      py: table.clientHeight / 2 - (vise.offsetTop + vise.offsetHeight / 2),
    };
  };
  const ecritVue = () => {
    const plat = vue.tilt < 4;
    if (vueBtn) vueBtn.textContent = (plat ? vueBtn.dataset.volume : vueBtn.dataset.dessus) || '';
  };
  let t0 = performance.now(), last = t0, raf = 0, visible = false, tenu = false;
  const image = (now: number) => {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const c = cible();
    const k = calme ? 1 : 1 - Math.exp(-dt / 0.38);
    (Object.keys(cam) as (keyof Cam)[]).forEach((p) => { cam[p] += (c[p] - cam[p]) * k; });
    // comme filmé : la caméra respire un peu, sauf vue de dessus ou si l'on bouge quelque chose
    let yaw = cam.yaw, tilt = cam.tilt, zoom = cam.zoom;
    if (!calme && !tenu && vue.tilt >= 4) {
      const t = (now - t0) / 1000;
      yaw += 3.2 * Math.sin(t * 0.57) + 0.8 * Math.sin(t * 1.31);
      tilt += 1.6 * Math.sin(t * 0.79 + 1);
      zoom *= 1 + 0.012 * Math.sin(t * 0.43 + 2);
    }
    table.style.transform = `translateZ(${(P * (1 - 1 / zoom)).toFixed(1)}px) rotateX(${tilt.toFixed(2)}deg) rotateZ(${yaw.toFixed(2)}deg) translate3d(${cam.px.toFixed(1)}px, ${cam.py.toFixed(1)}px, 0)`;
    // le reflet sur les faces suit l'angle de vue
    const a = (yaw * Math.PI) / 180;
    table.style.setProperty('--sx', `${(50 - 60 * Math.sin(a)).toFixed(1)}%`);
    table.style.setProperty('--sy', `${(55 - tilt * 0.9).toFixed(1)}%`);
    if (visible) raf = requestAnimationFrame(image);
  };
  const anime = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(image); } };

  // la caméra s'incline une fois, quand la table arrive à l'écran
  let premiere = !calme;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) {
      anime();
      if (premiere && e.intersectionRatio > 0.4) { premiere = false; setTimeout(() => { Object.assign(vue, VOLUME); ecritVue(); }, 450); }
    }
  }, { threshold: [0, 0.45] });
  io.observe(scene);

  const viser = (el: HTMLElement | null) => {
    if (vise) delete vise.dataset.vise;
    vise = el && el !== vise ? el : null;
    if (vise) vise.dataset.vise = '';
    scene.toggleAttribute('data-proche', !!vise);
    if (nomEl) nomEl.textContent = vise?.getAttribute('aria-label') || '';
    anime();
  };

  // ---------- souris et doigt ----------
  let geste: { id: number; x: number; y: number; lx: number; ly: number; el: HTMLElement | null; mode: '' | 'orbite' | 'deplace'; touche: boolean } | null = null;
  let aBouge = false, vx = 0;
  const prend = (e: PointerEvent) => {
    if (e.button > 0 || (e.target as Element).closest('[data-cam]')) return;
    const el = (e.target as Element).closest<HTMLElement>('[data-echantillon]');
    geste = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, el, mode: '', touche: e.pointerType === 'touch' };
    aBouge = false; vx = 0;
    if (!geste.touche) e.preventDefault();
  };
  const deplace = (e: PointerEvent) => {
    if (!geste || e.pointerId !== geste.id) return;
    const dx = e.clientX - geste.lx, dy = e.clientY - geste.ly;
    geste.lx = e.clientX; geste.ly = e.clientY;
    if (!geste.mode) {
      if (Math.hypot(e.clientX - geste.x, e.clientY - geste.y) < 5) return;
      geste.mode = geste.el && !geste.touche ? 'deplace' : 'orbite';
      aBouge = true; tenu = true;
      try { scene.setPointerCapture(e.pointerId); } catch { /* le doigt est déjà parti */ }
      if (geste.mode === 'deplace') { dessus(geste.el!); geste.el!.dataset.tenu = ''; geste.el!.style.zIndex = String(++ordre + 1); }
      scene.dataset.geste = geste.mode;
    }
    if (geste.mode === 'orbite') {
      vue.yaw += dx * 0.28;
      if (!geste.touche) vue.tilt = Math.min(68, Math.max(0, vue.tilt - dy * 0.18));
      ecritVue();
    } else {
      // du déplacement à l'écran au déplacement sur la table : on défait le zoom, l'inclinaison, la rotation
      const z = cam.zoom, ti = (cam.tilt * Math.PI) / 180, a = (-cam.yaw * Math.PI) / 180;
      const sx = dx / z, sy = dy / z / Math.max(0.35, Math.cos(ti));
      const s = etat.get(geste.el!)!;
      s.x += ((sx * Math.cos(a) - sy * Math.sin(a)) / table.clientWidth) * 100;
      s.y += ((sx * Math.sin(a) + sy * Math.cos(a)) / table.clientHeight) * 100;
      vx = vx * 0.7 + dx * 0.3;
      geste.el!.style.setProperty('--inc', calme ? '0' : String(Math.max(-14, Math.min(14, vx * 1.2))));
      pose(geste.el!);
    }
    anime();
  };
  const lache = (e: PointerEvent) => {
    if (!geste || e.pointerId !== geste.id) return;
    if (geste.mode === 'deplace') {
      delete geste.el!.dataset.tenu;
      geste.el!.style.setProperty('--inc', '0');
      empile();
      if (vise === geste.el) anime();
    }
    delete scene.dataset.geste;
    geste = null; tenu = false;
  };
  // un clic sans glisser : s'approcher de l'échantillon, ou reculer
  const clic = (e: MouseEvent) => {
    if (aBouge) { aBouge = false; return; }
    if ((e.target as Element).closest('[data-cam]')) return;
    viser((e.target as Element).closest<HTMLElement>('[data-echantillon]'));
  };
  const touche = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && vise) { viser(null); return; }
    const el = (e.target as Element).closest<HTMLElement>('[data-echantillon]');
    if (!el) return;
    const s = etat.get(el)!;
    const pas = e.shiftKey ? 6 : 2;
    if (e.key === 'ArrowLeft') s.x -= pas; else if (e.key === 'ArrowRight') s.x += pas;
    else if (e.key === 'ArrowUp') s.y -= pas; else if (e.key === 'ArrowDown') s.y += pas;
    else if (e.key === 'r' || e.key === 'R') s.r += 15;
    else return;
    e.preventDefault();
    dessus(el); pose(el); empile();
  };
  const bouton = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-cam]');
    if (!b) return;
    const quoi = b.dataset.cam;
    if (quoi === 'plus') vue.zoom = Math.min(2.6, vue.zoom * 1.25);
    else if (quoi === 'moins') vue.zoom = Math.max(0.7, vue.zoom / 1.25);
    else if (vue.tilt < 4) Object.assign(vue, VOLUME);
    else Object.assign(vue, { yaw: 0, tilt: 0 });
    premiere = false;
    ecritVue(); anime();
  };
  const ranger = () => {
    viser(null);
    items.forEach((el, i) => {
      const [x, y, r] = depart(el);
      Object.assign(etat.get(el)!, { x, y, r, ordre: i });
      el.dataset.range = '';
      pose(el);
      setTimeout(() => delete el.dataset.range, 700);
    });
    Object.assign(vue, VOLUME, { zoom: 1 });
    ecritVue(); empile(); anime();
  };
  const btn = root.querySelector<HTMLElement>('[data-materiaux-ranger]');
  scene.addEventListener('pointerdown', prend);
  scene.addEventListener('pointermove', deplace);
  scene.addEventListener('pointerup', lache);
  scene.addEventListener('pointercancel', lache);
  scene.addEventListener('click', clic);
  scene.addEventListener('click', bouton);
  scene.addEventListener('keydown', touche);
  btn?.addEventListener('click', ranger);

  // passage d'un écran large à un écran étroit (ou l'inverse) : on reprend la composition adaptée
  let mode = etroit();
  const recale = () => {
    P = parseFloat(getComputedStyle(scene).perspective) || 1100;
    if (etroit() !== mode) { mode = etroit(); items.forEach((el) => { const [x, y, r] = depart(el); Object.assign(etat.get(el)!, { x, y, r }); }); }
    items.forEach(pose);
    empile(); anime();
  };
  addEventListener('resize', recale);
  ecritVue();
  requestAnimationFrame(recale);
  return () => { io.disconnect(); cancelAnimationFrame(raf); visible = false; removeEventListener('resize', recale); btn?.removeEventListener('click', ranger); };
}
