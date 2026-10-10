import { xpCalme } from './outils';

/* Passage d'une page à l'autre : la nouvelle page monte comme une feuille de calque glissée sur l'ancienne,
   qui recule un peu. Quand on clique sur un projet, sa photo se déplace et s'agrandit jusqu'à devenir
   la grande image du projet (View Transitions ; sans elles, la navigation reste simple). */

type DocVT = Document & { startViewTransition?: (f: () => Promise<void> | void) => { finished: Promise<void>; ready: Promise<void> } };

let enCours = false;

/** Lance une transition autour de la mise à jour de la page. `image` : la photo à transformer en couverture. */
export function xpTransition(maj: () => Promise<void> | void, image?: HTMLElement | null) {
  const d = document as DocVT;
  if (!d.startViewTransition || xpCalme() || enCours) { maj(); return; }
  enCours = true;
  const html = document.documentElement;
  // la couverture de la page qu'on quitte ne doit pas porter le même nom que la photo cliquée
  const anciens = [...document.querySelectorAll('[data-xp-cover]')];
  anciens.forEach((e) => e.setAttribute('data-xp-ancien', ''));
  if (image) image.style.setProperty('view-transition-name', 'xp-cover');
  html.dataset.vt = image ? 'cover' : '';
  let vt;
  try {
    vt = d.startViewTransition(async () => {
      if (image) image.style.removeProperty('view-transition-name');
      await maj();
    });
  } catch { enCours = false; delete html.dataset.vt; maj(); return; }
  vt.finished.finally(() => { anciens.forEach((e) => e.removeAttribute('data-xp-ancien')); enCours = false; delete html.dataset.vt; delete html.dataset.charge; });
}

/** La photo du lien cliqué, si le lien mène à une page projet et montre une photo. */
export function xpImageDuLien(a: Element): HTMLElement | null {
  if (!/\/projets\/[^/]+\/?(#.*)?$/.test(a.getAttribute('href') || '')) return null;
  const visible = (i: Element | null) => (i && (i as HTMLElement).getBoundingClientRect().width > 0 ? (i as HTMLElement) : null);
  const dans = visible(a.querySelector('img'));
  if (dans) return dans;
  // sommaire de l'accueil : la grande image est à côté de la liste
  const apercu = a.closest('[class*="__index"]')?.querySelector('[class*="__apercu"] img[data-on]');
  return visible(apercu || null);
}
