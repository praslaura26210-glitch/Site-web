import { xpEl, xpSaisie, type XPContexte } from './outils';

/*
 * Loupe (page projet), comme un compte-fils posé sur la planche : on l'active, puis on survole un dessin
 * pour en lire les traits, les hachures et les cotes, sans quitter la page. La loupe lit l'image en
 * haute définition (ou le plan vectoriel). Molette : grossir ; touche L ou bouton : refermer.
 */
export function xpLoupe(ctx: XPContexte, root: HTMLElement) {
  if (!root.querySelector('[data-projet]')) return () => {};
  const T = ctx.D.t;
  const html = document.documentElement;
  const tactile = matchMedia('(hover: none)').matches;
  const bouton = xpEl('button', { type: 'button', class: 'xp-loupe-btn', 'aria-pressed': 'false', title: `${T.loupe} (L)`, html: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="8.5" cy="8.5" r="6"/><path d="m13 13 5 5M6 8.5h5M8.5 6v5"/></svg><span>' + T.loupe + '</span>' });
  const aide = xpEl('p', { class: 'xp-loupe-aide', hidden: true, text: tactile ? T.loupeAideTactile : T.loupeAide });
  const lentille = xpEl('div', { class: 'xp-loupe', 'aria-hidden': 'true', hidden: true });
  document.body.append(bouton, aide, lentille);
  let actif = false, Z = 3, cible: HTMLImageElement | null = null, tAide = 0;

  const source = (img: HTMLImageElement) => {
    const z = img.closest<HTMLElement>('[data-zoom]')?.dataset.zoom;
    if (z) { try { const d = JSON.parse(z); return d.full || d.preview || d.svg || img.currentSrc; } catch { /* données illisibles */ } }
    return (img.currentSrc || img.src).replace('-1000.webp', '-2000.webp');
  };
  const place = (x: number, y: number) => {
    if (!cible) return;
    const r = cible.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) { lentille.hidden = true; cible = null; return; }
    const D = lentille.offsetWidth || 240;
    const dy = tactile ? -D * 0.75 : 0; // au doigt, la loupe se place au-dessus pour rester visible
    lentille.style.transform = `translate(${x - D / 2}px, ${y - D / 2 + dy}px)`;
    lentille.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    lentille.style.backgroundPosition = `${-((x - r.left) * Z - D / 2)}px ${-((y - r.top) * Z - D / 2)}px`;
  };
  const surImage = (e: PointerEvent) => {
    if (!actif) return;
    const img = (e.target as Element).closest?.('figure img, [class*="__visScene"] img') as HTMLImageElement | null;
    if (!img || !root.contains(img)) { if (!lentille.contains(e.target as Node)) { lentille.hidden = true; cible = null; } return; }
    if (img !== cible) { cible = img; lentille.style.backgroundImage = `url("${source(img)}")`; lentille.toggleAttribute('data-dessin', !!img.closest('[class*="__dessin"], [class*="__visScene"]')); }
    lentille.hidden = false;
    place(e.clientX, e.clientY);
  };
  const molette = (e: WheelEvent) => {
    if (!actif || !cible) return;
    e.preventDefault();
    Z = Math.min(8, Math.max(1.6, Z * Math.exp(-e.deltaY * 0.002)));
    place(e.clientX, e.clientY);
  };
  const bascule = (o = !actif) => {
    actif = o;
    html.toggleAttribute('data-loupe', o);
    bouton.setAttribute('aria-pressed', String(o));
    if (!o) { lentille.hidden = true; cible = null; aide.hidden = true; return; }
    aide.hidden = false; clearTimeout(tAide); tAide = window.setTimeout(() => (aide.hidden = true), 4500);
  };
  const touche = (e: KeyboardEvent) => {
    if (xpSaisie(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); bascule(); }
    else if (e.key === 'Escape' && actif) bascule(false);
  };
  bouton.addEventListener('click', () => bascule());
  addEventListener('pointermove', surImage, { passive: true });
  addEventListener('pointerdown', surImage, { passive: true });
  addEventListener('wheel', molette, { passive: false });
  addEventListener('keydown', touche);
  const defile = () => { lentille.hidden = true; cible = null; };
  addEventListener('scroll', defile, { passive: true });
  return () => {
    bascule(false);
    removeEventListener('pointermove', surImage); removeEventListener('pointerdown', surImage);
    removeEventListener('wheel', molette); removeEventListener('keydown', touche); removeEventListener('scroll', defile);
    clearTimeout(tAide); bouton.remove(); aide.remove(); lentille.remove();
  };
}
