import { xpEl, type XPContexte } from './outils';

/*
 * Mouvements de la page. Règle : un mouvement n'existe que s'il répond à une question du visiteur.
 *   « Où suis-je ? » (orientation) · « Qu'est-ce qui a réagi ? » (retour d'action)
 *   « D'où vient ce que je vois ? » (continuité) · « Qu'est-ce que je peux faire ici ? » (indice)
 * Rien de décoratif, rien qui retienne le contenu : le texte et les images sont lisibles tout de suite.
 * Durées courtes (de 150 à 450 ms ; seule la photo qui devient couverture prend un peu plus).
 */

/** En-tête : il s'efface quand on descend (plus de place pour les images) et revient dès qu'on remonte. */
export function xpEntete() {
  const html = document.documentElement;
  let y0 = scrollY;
  const defile = () => {
    const y = scrollY;
    if (document.querySelector('header[data-open]')) return;
    if (y > 240 && y > y0 + 4) html.dataset.enteteCache = '';
    else if (y < y0 - 4 || y < 120) delete html.dataset.enteteCache;
    y0 = y;
  };
  addEventListener('scroll', defile, { passive: true });
  return () => removeEventListener('scroll', defile);
}

/**
 * Préchargement : dès qu'on survole un projet (ou qu'on le sélectionne au clavier), sa grande image
 * se charge. Au clic, la page s'ouvre sans attente et la photo reste nette pendant la transition.
 */
export function xpPrecharge(ctx: XPContexte) {
  const fait = new Set<string>();
  const vise = (e: Event) => {
    const a = (e.target as Element).closest?.('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    const p = ctx.D.projets.find((x) => h.endsWith(`/projets/${x.slug}/`) || h.endsWith(`/projets/${x.slug}`));
    if (!p || fait.has(p.slug)) return;
    fait.add(p.slug);
    new Image().src = p.cover.src;
  };
  document.addEventListener('pointerover', vise, { passive: true });
  document.addEventListener('focusin', vise);
  return () => { document.removeEventListener('pointerover', vise); document.removeEventListener('focusin', vise); };
}

/** Images : celles qui ne sont pas encore arrivées apparaissent en fondu court au lieu de surgir par morceaux. */
export function xpImagesDouces(root: HTMLElement) {
  const imgs = [...root.querySelectorAll<HTMLImageElement>('figure img, [class*="__carteImg"] img, [class*="__tuile"] img, .xp-frise-img img')].filter((i) => !i.complete);
  imgs.forEach((i) => {
    i.dataset.attente = '';
    const fin = () => { delete i.dataset.attente; };
    i.addEventListener('load', fin, { once: true });
    i.addEventListener('error', fin, { once: true });
  });
  return () => imgs.forEach((i) => delete i.dataset.attente);
}

/**
 * Carnet de dessins (accueil) : tous les dessins des projets sur une ligne, que le visiteur fait défiler
 * lui-même (glisser, molette, flèches). Rien ne bouge tout seul. Survol : légende ; clic : le dessin dans son projet.
 */
export function xpCarnet(ctx: XPContexte, root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-carnet]');
  if (!box) return () => {};
  const piste = box.querySelector<HTMLElement>('[data-carnet-piste]')!;
  const fenetre = box.querySelector<HTMLElement>('.xp-carnet-fenetre')!;
  const legende = box.querySelector<HTMLElement>('[data-carnet-legende]');
  const jauge = box.querySelector<HTMLElement>('[data-carnet-jauge]');
  if (!piste.children.length) ctx.D.dessins.forEach((d) => {
    const a = xpEl('a', { href: ctx.href(d.href), class: 'xp-carnet-item', draggable: 'false', 'aria-label': `${d.legende}, ${d.projet}`, 'data-xp-libre': '' }, [
      xpEl('img', { src: d.thumb, alt: '', loading: 'lazy', draggable: 'false', width: Math.round(d.w), height: Math.round(d.h) }),
    ]);
    const montre = () => { if (legende) legende.innerHTML = `<b>${d.legende}</b> · ${d.projet}`; };
    a.addEventListener('pointerenter', montre);
    a.addEventListener('focus', montre);
    a.addEventListener('click', (e) => { e.preventDefault(); if (!bouge) ctx.naviguer(d.href); });
    piste.append(a);
  });
  const maj = () => {
    const max = fenetre.scrollWidth - fenetre.clientWidth;
    if (jauge) jauge.style.transform = `scaleX(${max > 0 ? Math.max(0.06, fenetre.scrollLeft / max) : 1})`;
  };
  fenetre.addEventListener('scroll', maj, { passive: true });
  fenetre.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const max = fenetre.scrollWidth - fenetre.clientWidth;
    if ((e.deltaY > 0 && fenetre.scrollLeft < max - 1) || (e.deltaY < 0 && fenetre.scrollLeft > 1)) { e.preventDefault(); fenetre.scrollLeft += e.deltaY; }
  }, { passive: false });
  // glisser à la souris (au doigt, le défilement natif suffit)
  let x0: number | null = null, s0 = 0, bouge = false;
  fenetre.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = fenetre.scrollLeft; bouge = false; });
  const glisse = (e: PointerEvent) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 6) { bouge = true; box.dataset.tire = ''; }
    fenetre.scrollLeft = s0 - dx;
  };
  const lache = () => { x0 = null; delete box.dataset.tire; setTimeout(() => (bouge = false), 0); };
  addEventListener('pointermove', glisse);
  addEventListener('pointerup', lache);
  box.addEventListener('pointerleave', () => { if (legende) legende.textContent = legende.dataset.defaut || ''; });
  fenetre.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    fenetre.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * fenetre.clientWidth * 0.6, behavior: 'smooth' });
  });
  requestAnimationFrame(maj);
  return () => { removeEventListener('pointermove', glisse); removeEventListener('pointerup', lache); };
}

const CLE_VUS = 'lp-projets-vus';
/** Projets déjà ouverts : un petit point à côté de leur titre dans les listes, pour savoir où l'on en est. */
export function xpDejaVus(ctx: XPContexte, root: HTMLElement) {
  let vus: string[] = [];
  try { vus = JSON.parse(localStorage.getItem(CLE_VUS) || '[]'); } catch { /* stockage indisponible */ }
  const ici = root.querySelector<HTMLElement>('[data-projet]')?.dataset.projet;
  if (ici && !vus.includes(ici)) {
    vus.push(ici);
    try { localStorage.setItem(CLE_VUS, JSON.stringify(vus)); } catch { /* idem */ }
  }
  root.querySelectorAll<HTMLAnchorElement>('a[href*="/projets/"]').forEach((a) => {
    const slug = (a.getAttribute('href') || '').match(/\/projets\/([^/#]+)/)?.[1];
    const titre = a.querySelector('[class*="__lT"], [class*="__carteT"], .xp-frise-t');
    if (!slug || !titre || !vus.includes(slug) || slug === ici || titre.querySelector('.xp-vu')) return;
    titre.append(xpEl('span', { class: 'xp-vu', title: ctx.D.t.dejaVu }, [xpEl('span', { class: 'sr-only', text: ctx.D.t.dejaVu })]));
  });
  return () => {};
}
