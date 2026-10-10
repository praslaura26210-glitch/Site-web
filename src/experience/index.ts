import { xpCarnet, xpDejaVus, xpEntete, xpImagesDouces, xpPrecharge } from './anim';
import { xpChapitres } from './chapitres';
import { xpExplorer } from './explorer';
import { xpFiches } from './fiches';
import { xpLightboxPage } from './lightbox';
import { xpDialogue, xpEl, xpSaisie, type XPContexte } from './outils';
import { xpImageDuLien } from './transition';
import { xpVisite } from './visite';
import { xpVues } from './vues';

/** Aide : les raccourcis clavier du site. */
export function xpRaccourcis(ctx: XPContexte) {
  if (document.querySelector('dialog.xp-ra')) return;
  const T = ctx.D.t;
  const fermer = xpEl('button', { type: 'button', class: 'lien', text: T.fermer });
  const d = xpEl('dialog', { class: 'xp-ra', 'aria-label': T.raccourcis }, [
    xpEl('h2', { class: 'eyebrow', text: T.raccourcis }),
    xpEl('dl', {}, T.touches.map(([k, v]) => xpEl('div', {}, [xpEl('dt', {}, k.split(/\s+/).map((x) => xpEl('kbd', { text: x }))), xpEl('dd', { text: v })]))),
    fermer,
  ]);
  fermer.addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  xpDialogue(d);
  fermer.focus();
}

/** Une fois pour toutes : raccourcis, boutons [data-xp], trait de chargement entre deux pages. */
export function xpDemarrer(ctx: XPContexte) {
  const actions = {
    explorer: () => xpExplorer(ctx, { visite: () => xpVisite(ctx), raccourcis: () => xpRaccourcis(ctx) }),
    visite: () => xpVisite(ctx),
    raccourcis: () => xpRaccourcis(ctx),
  };
  const clic = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-xp]');
    if (b) {
      const a = actions[b.dataset.xp as keyof typeof actions];
      if (a) { e.preventDefault(); a(); }
      return;
    }
    // copier une adresse
    const c = (e.target as Element).closest<HTMLElement>('[data-copier]');
    if (c) {
      e.preventDefault();
      const fini = () => { c.dataset.copie = ''; setTimeout(() => delete c.dataset.copie, 1800); };
      navigator.clipboard?.writeText(c.dataset.copier!).then(fini, () => {
        const r = document.createRange(); const s = getSelection();
        const cible = c.parentElement?.querySelector('[data-copier-texte]') || c;
        r.selectNodeContents(cible); s?.removeAllRanges(); s?.addRange(r);
      });
      return;
    }
  };
  // liens internes : navigation avec transition (rideau, et photo du projet qui devient sa couverture)
  const lien = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
    if (a.closest('dialog') || a.hasAttribute('data-xp-libre')) return;
    const cible = ctx.lien(a);
    if (!cible) return;
    e.preventDefault();
    e.stopPropagation();
    document.documentElement.dataset.charge = '';
    ctx.naviguer(cible, xpImageDuLien(a));
  };
  const touche = (e: KeyboardEvent) => {
    if (xpSaisie(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'k' || e.key === 'K' || e.key === '/') actions.explorer();
    else if (e.key === 'v' || e.key === 'V') actions.visite();
    else if (e.key === '?') actions.raccourcis();
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && (e.target === document.body || e.target === document.documentElement)) {
      // page projet : ← → pour le projet précédent ou suivant
      const a = document.querySelector<HTMLAnchorElement>(e.key === 'ArrowRight' ? '[data-projet-suivant]' : '[data-projet-precedent]');
      if (!a) return;
      document.documentElement.dataset.charge = '';
      a.click();
    } else return;
    e.preventDefault();
  };
  document.addEventListener('click', clic);
  document.addEventListener('click', lien, true);
  addEventListener('keydown', touche);
  const autres = [xpEntete(), xpPrecharge(ctx)];
  return () => { document.removeEventListener('click', clic); document.removeEventListener('click', lien, true); removeEventListener('keydown', touche); autres.forEach((f) => f()); };
}

/** À chaque page affichée : visionneuse, chapitres, vues, fiches. Retourne le nettoyage. */
export function xpPage(ctx: XPContexte, root: HTMLElement) {
  delete document.documentElement.dataset.charge;
  delete document.documentElement.dataset.enteteCache;
  const f = [
    xpLightboxPage(ctx, root), xpChapitres(ctx, root), xpVues(root), xpFiches(ctx, root),
    xpCarnet(ctx, root), xpImagesDouces(root), xpDejaVus(ctx, root),
  ];
  return () => f.forEach((x) => x());
}
