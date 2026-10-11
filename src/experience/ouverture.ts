import { xpCalme } from './outils';

/*
 * Ouverture de l'accueil, sur fond blanc. Les cinq traits de la cabane sont d'abord tracés très vite,
 * en noir, en longs axes qui traversent l'écran, comme les lignes de construction d'un dessin ;
 * la cabane s'encre dedans et les axes s'effacent, la porte vient en dernier, puis le nom.
 * Ensuite le blanc devient un verre dépoli : on devine la page derrière, longtemps, puis il fond.
 * Partagé par le site (components/home/Ouverture.tsx) et l'aperçu (tools/apercu/runtime.js).
 */

/** Le blanc devient verre dépoli, puis le verre fond, puis fin de l'ouverture (ms) : à accorder avec home.module.css. */
const XP_OUV_FLOU = 3300, XP_OUV_DEGEL = 5100, XP_OUV_FIN = 7800;
/** Boîte du logo (viewBox de components/chrome/Logo.tsx). */
const XP_OUV_BOITE = { x: 12, y: 16, w: 98 };

/** Les segments des traits du logo, en coordonnées de l'écran (la porte n'a pas d'axe). */
function xpOuvSegments(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const s = r.width / XP_OUV_BOITE.w;
  const segs: [number, number, number, number][] = [];
  svg.querySelectorAll('path:not([data-porte])').forEach((p) => {
    const n = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    for (let i = 0; i + 3 < n.length; i += 2) {
      const [x1, y1, x2, y2] = n.slice(i, i + 4);
      segs.push([r.left + (x1 - XP_OUV_BOITE.x) * s, r.top + (y1 - XP_OUV_BOITE.y) * s, r.left + (x2 - XP_OUV_BOITE.x) * s, r.top + (y2 - XP_OUV_BOITE.y) * s]);
    }
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
  el.removeAttribute('data-flou');
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
    xpOuvSegments(logo).forEach((seg, i) => {
      const [a, b, c, d] = xpOuvAxe(seg, W, H);
      const l = document.createElementNS(NS, 'line');
      // l'axe part du bord le plus éloigné du logo, pour qu'on le voie traverser l'écran
      const inverse = Math.hypot(seg[0] - a, seg[1] - b) < Math.hypot(seg[2] - c, seg[3] - d);
      const [xa, ya, xb, yb] = inverse ? [c, d, a, b] : [a, b, c, d];
      l.setAttribute('x1', xa.toFixed(1)); l.setAttribute('y1', ya.toFixed(1));
      l.setAttribute('x2', xb.toFixed(1)); l.setAttribute('y2', yb.toFixed(1));
      l.style.setProperty('--len', Math.hypot(xb - xa, yb - ya).toFixed(0));
      l.style.setProperty('--i', String(i));
      axes.append(l);
    });
    el.prepend(axes);
  }
  let fini = false;
  const t: ReturnType<typeof setTimeout>[] = [];
  // le blanc devient verre dépoli : la page est là, derrière, floue
  const flou = (degel: number, out: number) => {
    if (fini) return;
    fini = true;
    el.setAttribute('data-flou', '');
    delete html.dataset.intro;
    fin();
    t.push(setTimeout(() => el.setAttribute('data-degel', ''), degel), setTimeout(() => el.setAttribute('data-out', ''), out));
  };
  t.push(setTimeout(() => flou(XP_OUV_DEGEL - XP_OUV_FLOU, XP_OUV_FIN - XP_OUV_FLOU), XP_OUV_FLOU));
  // un clic ou une touche abrège : le verre fond tout de suite
  const passe = () => {
    if (!fini) { t.forEach(clearTimeout); flou(60, 1600); return; }
    el.setAttribute('data-degel', '');
  };
  const touche = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') passe(); };
  addEventListener('keydown', touche);
  el.addEventListener('click', passe);
  return () => { t.forEach(clearTimeout); removeEventListener('keydown', touche); el.removeEventListener('click', passe); };
}
