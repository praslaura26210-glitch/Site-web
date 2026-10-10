// Couche « expérience » : interactions du site écrites sans React, pour servir à la fois
// au site Next (via components/chrome/Experience.tsx) et à l'aperçu en une page (tools/apercu).
// Aucun import entre fichiers autre que des noms : l'aperçu les concatène dans une seule portée.

export type XPTextes = {
  explorer: string; rechercher: string; pages: string; projets: string; dessins: string; aucun: string; fermer: string;
  visite: string; visiteFin: string; visiteFinTexte: string; voirProjet: string; quitter: string; glisser: string;
  precedent: string; suivant: string; planche: string; retour: string;
  vueLabel: string; sommaire: string; planches: string; frise: string;
  chapitres: string; presentation: string; raccourcis: string; touches: string[][]; copier: string; copie: string; resultats: string; carnet: string; carnetAide: string; trame: string;
  zoomIn: string; zoomOut: string; zoomReset: string;
};
export type XPImage = { src: string; srcSmall?: string; w: number; h: number; pos?: string };
export type XPProjet = { slug: string; n: number; titre: string; programme: string; annee: number | null; lieu: string | null; resume: string; cover: XPImage; href: string };
export type XPDessin = { id: string; slug: string; projet: string; legende: string; thumb: string; w: number; h: number; href: string };
export type XPPage = { label: string; href: string };
export type XPDonnees = { lang: string; t: XPTextes; projets: XPProjet[]; dessins: XPDessin[]; pages: XPPage[]; portfolio: string };
export type XPContexte = {
  D: XPDonnees;
  /** navigation interne (routeur de Next, ou routeur de l'aperçu) */
  naviguer: (href: string, image?: HTMLElement | null) => void;
  /** pour un lien cliqué : l'adresse interne à suivre sans recharger, ou null pour laisser faire le navigateur */
  lien: (a: HTMLAnchorElement) => string | null;
  /** valeur à mettre dans un attribut href pour une adresse interne */
  href: (href: string) => string;
  /** ancre demandée (#d-…), sans le dièse */
  ancre: () => string;
};

export const xpCalme = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function xpEl<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | number | boolean | null | undefined> = {}, kids: (Node | string | null | undefined | false)[] = []): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = String(v);
    else if (k === 'text') e.textContent = String(v);
    else if (k === 'html') e.innerHTML = String(v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  kids.forEach((k) => { if (k) e.append(k); });
  return e;
}

/** Ouvre une boîte de dialogue plein écran ; la referme proprement (défilement rendu, élément retiré). */
export function xpDialogue(d: HTMLDialogElement, auFermer?: () => void) {
  document.body.append(d);
  const html = document.documentElement;
  d.addEventListener('close', () => { auFermer?.(); d.remove(); if (!document.querySelector('dialog[open]')) html.style.overflow = ''; });
  d.showModal();
  html.style.overflow = 'hidden';
  return d;
}

/** Glissé horizontal (doigt ou souris) : appelle va(+1/-1) au-delà d'un seuil. */
export function xpGlisse(zone: HTMLElement, va: (k: number) => void, actif: () => boolean = () => true) {
  let x0: number | null = null, y0 = 0;
  const down = (e: PointerEvent) => { if (!actif() || (e.target as Element).closest('button, a, input')) return; x0 = e.clientX; y0 = e.clientY; };
  const up = (e: PointerEvent) => {
    if (x0 == null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) va(dx < 0 ? 1 : -1);
  };
  zone.addEventListener('pointerdown', down);
  zone.addEventListener('pointerup', up);
  zone.addEventListener('pointercancel', () => (x0 = null));
}

/** Pour chercher sans tenir compte des accents ni des majuscules. */
export const xpNorm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Un raccourci clavier n'agit pas quand on écrit dans un champ. */
export const xpSaisie = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
};

export const xpFleche = (sens: 1 | -1) => `<svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true"><path d="${sens > 0 ? 'M0 6h22M17 1l5 5-5 5' : 'M24 6H2M7 1 2 6l5 5'}" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`;
