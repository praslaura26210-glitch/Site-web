import { xpCalme } from './outils';

/*
 * Ouverture de l'accueil : la page est déjà là, derrière un verre dépoli. Par-dessus, comme on dessine
 * à la main, chaque trait de la cabane est tracé en long axe qui traverse l'écran ; puis les deux bouts
 * de l'axe s'effacent et il reste le trait du logo. L'axe est fait de trois morceaux mis bout à bout
 * (avant le logo, le trait du logo, après) : rien ne se superpose, donc jamais de double trait.
 * La porte vient en dernier, puis le nom ; ensuite le verre fond et la page s'ouvre.
 * Partagé par le site (components/home/Ouverture.tsx) et l'aperçu (tools/apercu/runtime.js).
 */

/** Le verre commence à fondre, puis fin de l'ouverture (ms) : à accorder avec home.module.css. */
const XP_OUV_DEGEL = 3600, XP_OUV_FIN = 4800;
/** Boîte du logo (viewBox de components/chrome/Logo.tsx). */
const XP_OUV_BOITE = { x: 12, y: 16, w: 98 };

/** Les traits du logo en coordonnées de l'écran : les cinq droites, et la porte à part. */
function xpOuvTraits(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const s = r.width / XP_OUV_BOITE.w;
  const ecran = (n: number[]) => n.map((v, k) => (k % 2 ? r.top + (v - XP_OUV_BOITE.y) * s : r.left + (v - XP_OUV_BOITE.x) * s));
  const droites: number[][] = [];
  let porte: number[] = [];
  svg.querySelectorAll('path').forEach((p) => {
    const n = ecran((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g)?.map(Number) || []);
    if (p.hasAttribute('data-porte')) porte = n; else droites.push(n);
  });
  return { droites, porte };
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
  // une fois par visite : en revenant sur l'accueil, on arrive directement sur la page
  try { sessionStorage.setItem('lp-intro', '1'); } catch { /* stockage indisponible : l'ouverture se rejouera */ }
  el.setAttribute('data-actif', '');
  // les axes, calculés pour cet écran ; le logo du calque ne sert qu'à les placer (il est masqué)
  el.querySelector('.xp-ouv-axes')?.remove();
  const logo = el.querySelector<SVGSVGElement>('svg');
  const anims: Animation[] = [];
  if (logo) {
    const W = innerWidth, H = innerHeight;
    const NS = 'http://www.w3.org/2000/svg';
    const axes = document.createElementNS(NS, 'svg');
    axes.setAttribute('class', 'xp-ouv-axes');
    axes.setAttribute('viewBox', `0 0 ${W} ${H}`);
    axes.setAttribute('aria-hidden', 'true');
    const main = 'cubic-bezier(.45, .05, .35, 1)';
    const { droites, porte } = xpOuvTraits(logo);
    droites.forEach((seg, i) => {
      const [a, b, c, d] = xpOuvAxe(seg, W, H);
      // l'axe part du bord le plus éloigné du logo, pour qu'on le voie traverser l'écran
      const inverse = Math.hypot(seg[0] - a, seg[1] - b) < Math.hypot(seg[2] - c, seg[3] - d);
      const [xa, ya, xb, yb] = inverse ? [c, d, a, b] : [a, b, c, d];
      const len = Math.hypot(xb - xa, yb - ya);
      // où commence et finit le trait du logo, le long de l'axe
      const t1 = Math.hypot(seg[0] - xa, seg[1] - ya), t2 = Math.hypot(seg[2] - xa, seg[3] - ya);
      const debut = Math.min(t1, t2), fin = Math.max(t1, t2);
      const ux = (xb - xa) / len, uy = (yb - ya) / len;
      const point = (t: number) => [xa + ux * t, ya + uy * t];
      // le tracé avance à vitesse constante d'un bord à l'autre ; chaque morceau prend le relais du précédent
      const trace = 420, depart = 120 + i * 230, efface = depart + trace + 80;
      ([[0, debut, true], [debut, fin, false], [fin, len, true]] as [number, number, boolean][]).forEach(([t0, t1, bout]) => {
        const lg = t1 - t0;
        if (lg < 0.5) return;
        const [x1, y1] = point(t0), [x2, y2] = point(t1);
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', x1.toFixed(2)); l.setAttribute('y1', y1.toFixed(2));
        l.setAttribute('x2', x2.toFixed(2)); l.setAttribute('y2', y2.toFixed(2));
        l.style.strokeDasharray = `0 ${lg}`;
        axes.append(l);
        anims.push(l.animate([{ strokeDasharray: `0 ${lg}` }, { strokeDasharray: `${lg} ${lg}` }], { duration: (trace * lg) / len, delay: depart + (trace * t0) / len, fill: 'forwards' }));
        // les deux bouts de l'axe s'effacent ; le morceau du milieu reste : c'est le trait du logo
        if (bout) anims.push(l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: efface, easing: 'ease', fill: 'forwards' }));
      });
    });
    if (porte.length) {
      const p = document.createElementNS(NS, 'polyline');
      p.setAttribute('points', porte.map((v) => v.toFixed(1)).join(' '));
      let lp = 0;
      for (let k = 2; k < porte.length; k += 2) lp += Math.hypot(porte[k] - porte[k - 2], porte[k + 1] - porte[k - 1]);
      p.style.strokeDasharray = `0 ${lp}`;
      axes.append(p);
      anims.push(p.animate([{ strokeDasharray: `0 ${lp}` }, { strokeDasharray: `${lp} ${lp}` }], { duration: 400, delay: 120 + droites.length * 230 + 230, easing: main, fill: 'forwards' }));
    }
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
  return () => { t.forEach(clearTimeout); anims.forEach((x) => x.cancel()); removeEventListener('keydown', touche); el.removeEventListener('click', passe); };
}
