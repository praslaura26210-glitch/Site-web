import { xpCalme } from './outils';

/*
 * Ouverture de l'accueil : la page est déjà là, derrière un verre dépoli. Par-dessus, comme on dessine
 * à la main, chaque trait de la cabane est d'abord tracé en long axe qui traverse l'écran ; puis l'axe
 * s'efface et n'en reste que le morceau qui fait le logo, exactement à sa place. On voit ainsi comment
 * le logo a été construit. La porte vient en dernier, puis le nom ; ensuite le verre fond et la page s'ouvre.
 * Partagé par le site (components/home/Ouverture.tsx) et l'aperçu (tools/apercu/runtime.js).
 */

/** Le verre commence à fondre, puis fin de l'ouverture (ms) : à accorder avec home.module.css. */
const XP_OUV_DEGEL = 4600, XP_OUV_FIN = 5800;
/** Boîte du logo (viewBox de components/chrome/Logo.tsx). */
const XP_OUV_BOITE = { x: 12, y: 16, w: 98 };

/** Les segments des traits du logo, en coordonnées de l'écran (la porte n'a pas d'axe). */
function xpOuvSegments(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const s = r.width / XP_OUV_BOITE.w;
  const segs: { xy: [number, number, number, number]; i: number; epaisseur: number }[] = [];
  svg.querySelectorAll('path').forEach((p, i) => {
    if (p.hasAttribute('data-porte')) return;
    const [x1, y1, x2, y2] = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    // l'axe a exactement l'épaisseur du trait du logo, pour qu'ils se confondent
    const epaisseur = Number(p.getAttribute('stroke-width') || 1) * s;
    segs.push({ xy: [r.left + (x1 - XP_OUV_BOITE.x) * s, r.top + (y1 - XP_OUV_BOITE.y) * s, r.left + (x2 - XP_OUV_BOITE.x) * s, r.top + (y2 - XP_OUV_BOITE.y) * s], i, epaisseur });
  });
  return segs;
}

/** La droite qui porte un segment, coupée aux bords de l'écran (méthode de Liang-Barsky). */
function xpOuvAxe([x1, y1, x2, y2]: number[], W: number, H: number) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = -1e6, t1 = 1e6;
  const bord = (p: number, q: number) => {
    if (p === 0) return;
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  };
  bord(-dx, x1); bord(dx, W - x1); bord(-dy, y1); bord(dy, H - y1);
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

/** Lance l'ouverture dans le calque `el` ; `fin` est appelé quand la page doit devenir visible. Retourne le nettoyage. */
export function xpOuverture(el: HTMLElement, fin: () => void) {
  const html = document.documentElement;
  if (xpCalme()) { fin(); return () => {}; }
  el.removeAttribute('data-out');
  el.removeAttribute('data-degel');
  el.setAttribute('data-actif', '');
  // les axes, calculés pour cet écran
  el.querySelector('.xp-ouv-axes')?.remove();
  const logo = el.querySelector<SVGSVGElement>('svg');
  if (logo) {
    const W = innerWidth, H = innerHeight;
    const NS = 'http://www.w3.org/2000/svg';
    const axes = document.createElementNS(NS, 'svg');
    axes.setAttribute('class', 'xp-ouv-axes');
    axes.setAttribute('viewBox', `0 0 ${W} ${H}`);
    axes.setAttribute('aria-hidden', 'true');
    xpOuvSegments(logo).forEach(({ xy: seg, i, epaisseur }) => {
      const [a, b, c, d] = xpOuvAxe(seg, W, H);
      const l = document.createElementNS(NS, 'line');
      // l'axe part du bord le plus éloigné du logo, pour qu'on le voie traverser l'écran
      const inverse = Math.hypot(seg[0] - a, seg[1] - b) < Math.hypot(seg[2] - c, seg[3] - d);
      const [xa, ya, xb, yb] = inverse ? [c, d, a, b] : [a, b, c, d];
      l.setAttribute('x1', xa.toFixed(1)); l.setAttribute('y1', ya.toFixed(1));
      l.setAttribute('x2', xb.toFixed(1)); l.setAttribute('y2', yb.toFixed(1));
      l.style.setProperty('--len', Math.hypot(xb - xa, yb - ya).toFixed(0));
      l.style.setProperty('--i', String(i));
      l.style.strokeWidth = `${epaisseur.toFixed(2)}px`;
      axes.append(l);
    });
    el.prepend(axes);
  }
  let fini = false;
  const t: ReturnType<typeof setTimeout>[] = [];
  // le verre fond : la page s'ouvre
  const degel = (out: number) => {
    if (fini) return;
    fini = true;
    el.setAttribute('data-degel', '');
    delete html.dataset.intro;
    fin();
    t.push(setTimeout(() => el.setAttribute('data-out', ''), out));
  };
  t.push(setTimeout(() => degel(XP_OUV_FIN - XP_OUV_DEGEL), XP_OUV_DEGEL));
  // un clic ou une touche abrège
  const passe = () => { t.forEach(clearTimeout); degel(XP_OUV_FIN - XP_OUV_DEGEL); };
  const touche = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') passe(); };
  addEventListener('keydown', touche);
  el.addEventListener('click', passe);
  return () => { t.forEach(clearTimeout); removeEventListener('keydown', touche); el.removeEventListener('click', passe); };
}
