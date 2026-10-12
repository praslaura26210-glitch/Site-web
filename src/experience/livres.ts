import { xpCalme, xpDialogue, xpEl, xpFleche, xpGlisse, xpSaisie, type XPContexte } from './outils';

/*
 * Page Projets : chaque projet est un livre. Un clic l'ouvre en mini-magazine : une double page
 * (à gauche le texte, puis les images du projet), et l'on tourne les pages comme dans un vrai livre
 * (la feuille pivote autour de la reliure). Sur téléphone, une page à la fois.
 */

type XPPageLivre = { texte: true } | { src: string; legende: string; dessin?: boolean };

/** Une page du livre : la page de texte ou une image avec sa légende et son numéro. */
function xpPageLivre(ctx: XPContexte, slug: string, page: XPPageLivre, n: number) {
  const p = ctx.D.projets.find((x) => x.slug === slug)!;
  if ('texte' in page) {
    return xpEl('div', { class: 'xp-lv-page xp-lv-texte' }, [
      xpEl('p', { class: 'xp-lv-n', text: String(p.n).padStart(2, '0') }),
      xpEl('h2', { class: 'xp-lv-titre', text: p.titre }),
      xpEl('p', { class: 'xp-lv-meta', text: [p.programme, p.lieu, p.annee].filter(Boolean).join(' · ') }),
      xpEl('p', { class: 'xp-lv-resume', text: p.resume }),
      xpEl('a', { class: 'lien xp-lv-lien', href: ctx.href(p.href), 'data-xp-livre-voir': '', text: `${ctx.D.t.voirTout} →` }),
    ]);
  }
  return xpEl('figure', { class: `xp-lv-page xp-lv-image${page.dessin ? ' xp-lv-dessin' : ''}` }, [
    xpEl('img', { src: page.src, alt: page.legende, draggable: 'false' }),
    xpEl('figcaption', {}, [xpEl('span', { text: page.legende }), xpEl('span', { class: 'xp-lv-folio', text: String(n) })]),
  ]);
}

/** Ouvre le livre d'un projet. */
function xpOuvrirLivre(ctx: XPContexte, slug: string, retour: HTMLElement) {
  const T = ctx.D.t;
  const p = ctx.D.projets.find((x) => x.slug === slug);
  if (!p) return;
  const images = ctx.D.dessins.filter((d) => d.slug === slug).map((d) => ({ src: d.preview || d.thumb, legende: d.legende, dessin: d.dessin }));
  const pages: XPPageLivre[] = [{ texte: true }, ...images];
  const simple = () => matchMedia('(max-width: 760px)').matches; // une page à la fois
  let k = 0; // première page visible (à gauche en double page)
  const pas = () => (simple() ? 1 : 2);

  const gauche = xpEl('div', { class: 'xp-lv-cote xp-lv-g' });
  const droite = xpEl('div', { class: 'xp-lv-cote xp-lv-d' });
  const livre = xpEl('div', { class: 'xp-lv-livre' }, [gauche, droite]);
  const compte = xpEl('span', { class: 'xp-lv-compte' });
  const prec = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.precedent, html: xpFleche(-1) });
  const suiv = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.suivant, html: xpFleche(1) });
  const fermer = xpEl('button', { type: 'button', class: 'lien xp-lv-fermer', text: T.fermer });
  const d = xpEl('dialog', { class: 'xp-lv', 'aria-label': p.titre }, [
    xpEl('div', { class: 'xp-lv-scene' }, [livre]),
    xpEl('div', { class: 'xp-lv-bas' }, [prec, compte, suiv, fermer]),
  ]);

  const rendu = (i: number) => (i >= 0 && i < pages.length ? xpPageLivre(ctx, slug, pages[i], i) : xpEl('div', { class: 'xp-lv-page xp-lv-vide' }));
  const affiche = () => {
    livre.toggleAttribute('data-simple', simple());
    gauche.replaceChildren(rendu(k));
    droite.replaceChildren(simple() ? xpEl('span') : rendu(k + 1));
    const total = Math.ceil(pages.length / pas());
    compte.innerHTML = `${String(Math.floor(k / pas()) + 1).padStart(2, '0')}<span> / ${String(total).padStart(2, '0')}</span>`;
    prec.toggleAttribute('disabled', k === 0);
    suiv.toggleAttribute('disabled', k + pas() >= pages.length);
  };

  let tourne = false;
  const tourner = (sens: 1 | -1) => {
    const n = pas();
    const cible = k + sens * n;
    if (tourne || cible < 0 || cible >= pages.length) return;
    if (xpCalme()) { k = cible; affiche(); return; }
    tourne = true;
    // la feuille qui tourne : recto et verso, posée sur la page qu'on quitte
    const recto = xpEl('div', { class: 'xp-lv-recto' });
    const verso = xpEl('div', { class: 'xp-lv-verso' });
    const feuille = xpEl('div', { class: 'xp-lv-feuille' }, [recto, verso]);
    if (simple()) {
      // une page : la page courante s'en va (vers l'avant) ou la précédente revient (vers l'arrière)
      if (sens > 0) { recto.append(rendu(k)); gauche.replaceChildren(rendu(cible)); }
      else { recto.append(rendu(cible)); feuille.dataset.depart = 'tournee'; }
      feuille.dataset.cote = 'g';
    } else if (sens > 0) {
      recto.append(rendu(k + 1)); verso.append(rendu(k + 2));
      droite.replaceChildren(rendu(k + 3));
      feuille.dataset.cote = 'd';
    } else {
      recto.append(rendu(k)); verso.append(rendu(k - 1));
      gauche.replaceChildren(rendu(k - 2));
      feuille.dataset.cote = 'g';
    }
    livre.append(feuille);
    const debut = feuille.dataset.depart ? 'rotateY(-180deg)' : 'rotateY(0deg)';
    const fin = simple() ? (sens > 0 ? 'rotateY(-180deg)' : 'rotateY(0deg)') : sens > 0 ? 'rotateY(-180deg)' : 'rotateY(180deg)';
    const a = feuille.animate([{ transform: debut }, { transform: fin }], { duration: 750, easing: 'cubic-bezier(.45, .05, .3, 1)' });
    a.finished.then(() => { feuille.remove(); k = cible; affiche(); tourne = false; });
  };

  prec.addEventListener('click', () => tourner(-1));
  suiv.addEventListener('click', () => tourner(1));
  fermer.addEventListener('click', () => d.close());
  // un clic sur la page de droite tourne la page, sur celle de gauche revient en arrière
  livre.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) return;
    const r = livre.getBoundingClientRect();
    tourner((e as MouseEvent).clientX > r.left + r.width / 2 ? 1 : -1);
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('keydown', (e) => {
    if (xpSaisie(e)) return;
    if (e.key === 'ArrowRight') tourner(1); else if (e.key === 'ArrowLeft') tourner(-1); else return;
    e.preventDefault();
  });
  // le lien « voir le projet en entier » ferme le livre et mène à la page du projet
  d.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('[data-xp-livre-voir]');
    if (!a) return;
    e.preventDefault();
    d.close();
    ctx.naviguer(p.href);
  });
  xpGlisse(livre, (s) => tourner(s > 0 ? 1 : -1));
  addEventListener('resize', affiche);
  d.addEventListener('close', () => removeEventListener('resize', affiche));
  affiche();
  xpDialogue(d, () => retour.focus());
  suiv.focus();
  images.slice(0, 4).forEach((x) => { new Image().src = x.src; });
}

/** Branche les livres de la page Projets. */
export function xpLivres(ctx: XPContexte, root: HTMLElement) {
  const etagere = root.querySelector<HTMLElement>('[data-etagere]');
  if (!etagere) return () => {};
  const clic = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-livre]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    xpOuvrirLivre(ctx, a.dataset.livre!, a);
  };
  etagere.addEventListener('click', clic);
  return () => etagere.removeEventListener('click', clic);
}
