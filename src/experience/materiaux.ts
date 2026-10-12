import { xpCalme } from './outils';

/**
 * Pilates Room : la table des matériaux. On attrape un échantillon (souris ou doigt) et on le pose
 * ailleurs ; pendant qu'on le tient, il se soulève et s'incline dans le sens du mouvement ;
 * un double-clic le fait pivoter ; « Remettre en place » rend la composition de départ.
 * Au clavier : flèches pour déplacer, R pour tourner.
 */
export function xpMateriaux(root: HTMLElement) {
  const table = root.querySelector<HTMLElement>('[data-materiaux]');
  if (!table) return () => {};
  const items = [...table.querySelectorAll<HTMLElement>('[data-echantillon]')];
  // composition de départ : une pour l'écran large, une pour le téléphone (table en hauteur)
  const etroit = () => matchMedia('(max-width: 760px)').matches;
  const depart = (el: HTMLElement) => JSON.parse((etroit() ? el.dataset.departM : el.dataset.depart)!) as number[];
  const etat = new Map(items.map((el) => {
    const [x, y, r] = depart(el);
    return [el, { x, y, r }];
  }));
  let z = items.length;
  const pose = (el: HTMLElement, incline = 0) => {
    const s = etat.get(el)!;
    // l'échantillon reste sur la table
    const lx = (el.offsetWidth / table.clientWidth) * 100, ly = (el.offsetHeight / table.clientHeight) * 100;
    s.x = Math.min(Math.max(s.x, -2), 102 - lx);
    s.y = Math.min(Math.max(s.y, -2), 102 - ly);
    el.style.setProperty('--x', s.x.toFixed(2));
    el.style.setProperty('--y', s.y.toFixed(2));
    el.style.setProperty('--r', (s.r + incline).toFixed(1));
  };
  const devant = (el: HTMLElement) => { el.style.zIndex = String(++z); };

  let tenu: HTMLElement | null = null, dx = 0, dy = 0, vx = 0, lastX = 0;
  const prend = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-echantillon]');
    if (!el || e.button > 0) return;
    e.preventDefault();
    tenu = el;
    const r = el.getBoundingClientRect();
    dx = e.clientX - r.left; dy = e.clientY - r.top; lastX = e.clientX; vx = 0;
    el.setPointerCapture(e.pointerId);
    el.dataset.tenu = '';
    devant(el);
  };
  const deplace = (e: PointerEvent) => {
    if (!tenu) return;
    const t = table.getBoundingClientRect();
    const s = etat.get(tenu)!;
    s.x = ((e.clientX - dx - t.left) / t.width) * 100;
    s.y = ((e.clientY - dy - t.top) / t.height) * 100;
    // l'inclinaison suit la vitesse horizontale, amortie
    vx = vx * 0.7 + (e.clientX - lastX) * 0.3; lastX = e.clientX;
    pose(tenu, xpCalme() ? 0 : Math.max(-9, Math.min(9, vx * 0.8)));
  };
  const lache = () => {
    if (!tenu) return;
    delete tenu.dataset.tenu;
    pose(tenu);
    tenu = null;
  };
  const tourne = (el: HTMLElement, pas = 30) => { etat.get(el)!.r += pas; devant(el); pose(el); };
  const double = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-echantillon]');
    if (el) tourne(el);
  };
  const touche = (e: KeyboardEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-echantillon]');
    if (!el) return;
    const s = etat.get(el)!;
    const pas = e.shiftKey ? 6 : 2;
    if (e.key === 'ArrowLeft') s.x -= pas; else if (e.key === 'ArrowRight') s.x += pas;
    else if (e.key === 'ArrowUp') s.y -= pas; else if (e.key === 'ArrowDown') s.y += pas;
    else if (e.key === 'r' || e.key === 'R') s.r += 15;
    else return;
    e.preventDefault();
    devant(el);
    pose(el);
  };
  const ranger = () => items.forEach((el) => {
    const [x, y, r] = depart(el);
    Object.assign(etat.get(el)!, { x, y, r });
    el.dataset.range = '';
    pose(el);
    setTimeout(() => delete el.dataset.range, 700);
  });
  const btn = root.querySelector<HTMLElement>('[data-materiaux-ranger]');
  table.addEventListener('pointerdown', prend);
  table.addEventListener('pointermove', deplace);
  table.addEventListener('pointerup', lache);
  table.addEventListener('pointercancel', lache);
  table.addEventListener('dblclick', double);
  table.addEventListener('keydown', touche);
  btn?.addEventListener('click', ranger);
  // passage d'un écran large à un écran étroit (ou l'inverse) : on reprend la composition adaptée
  let mode = etroit();
  const recale = () => {
    if (etroit() !== mode) { mode = etroit(); items.forEach((el) => { const [x, y, r] = depart(el); Object.assign(etat.get(el)!, { x, y, r }); }); }
    items.forEach((el) => pose(el));
  };
  addEventListener('resize', recale);
  requestAnimationFrame(recale);
  return () => { removeEventListener('resize', recale); btn?.removeEventListener('click', ranger); };
}
