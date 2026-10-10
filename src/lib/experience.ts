// Données de la couche « expérience » (explorateur, visite guidée), calculées au build pour chaque langue.
import { dict, type Lang } from '@/i18n';
import type { XPDonnees, XPDessin } from '@/experience/outils';
import { couverture } from '@/components/home/ProjetsGrille';
import { PDF_HREF } from '@/components/chrome/liens';
import { getProjet, getProjets, type Projet } from './content';
import { media } from './media';
import { CREDITS, MISES, type Bloc } from './sequences';

/** Identifiant d'ancre d'une image de projet (repris par Planche et Visionneuse). */
export const ancreDessin = (ref: string) => `d-${ref.replace(/^\w:/, '')}`;

const refsDe = (b: Bloc): string[] => {
  switch (b.t) {
    case 'grand': return [b.r];
    case 'rang': case 'visionneuse': return b.r;
    case 'texte': return b.r ? [b.r] : [];
    case 'composition': return b.rangs.flat().map((x) => x.r);
    default: return [];
  }
};

/** Nature d'une pièce du projet, d'après son type et sa légende ; l'ordre de NATURES est celui du feuilletage. */
export const NATURES = ['croquis', 'maquette', 'site', 'plan', 'coupe', 'axo', 'detail', 'materiaux', 'experimentation', 'rendu', 'autre'] as const;
const nature = (legende: string, type: string, nom: string) => {
  const l = legende.toLowerCase();
  if (type === 'croquis' || /croquis|à la main/.test(l)) return 'croquis';
  if (/maquette/.test(l)) return 'maquette';
  if (/^experimentation/.test(nom) || /expérimentation|taille de la pierre/.test(l)) return 'experimentation';
  if (/plan masse/.test(l)) return 'site';
  if (/matériaux/.test(l)) return 'materiaux';
  if (/détail|assemblage|garde-corps|limon/.test(l)) return 'detail';
  if (/axonom/.test(l)) return 'axo';
  if (/coupe|façade|vue de face/.test(l)) return 'coupe';
  if (/plan/.test(l)) return 'plan';
  if (type === 'rendu' || /perspective/.test(l)) return 'rendu';
  return 'autre';
};

/** Les une ou deux premières phrases du texte de présentation. */
const resume = (p: Projet) => {
  const phrases = p.texte.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || [p.texte];
  let s = phrases[0].trim();
  if (s.length < 140 && phrases[1]) s += ' ' + phrases[1].trim();
  return s;
};

export function donneesExperience(lang: Lang): XPDonnees {
  const t = dict(lang);
  const projets = getProjets(lang);
  const dessins: XPDessin[] = [];
  for (const p of projets) {
    const vus = new Set<string>();
    const cr = CREDITS[p.slug] || { defaut: '' };
    const mise = MISES[p.slug];
    const pFr = lang === 'fr' ? p : getProjet(p.slug, 'fr'); // la nature se lit sur la légende française
    const refs = [...(mise ? [mise.ouverture] : []), ...(mise?.blocs || []).flatMap(refsDe)];
    for (const r of refs) {
      if (vus.has(r)) continue;
      vus.add(r);
      const m = media(p, r);
      const vect = m.kind === 'plan' && m.src === m.svg;
      dessins.push({
        id: ancreDessin(r), slug: p.slug, projet: p.titre, legende: m.legende, thumb: m.srcSmall || m.src, w: m.w, h: m.h, href: `/${lang}/projets/${p.slug}/#${ancreDessin(r)}`,
        preview: vect ? undefined : m.src, svg: m.svg, full: m.full, credit: cr.images?.[r.replace(/^\w:/, '')] ?? (cr.defaut || undefined), dessin: m.kind === 'plan' || !!m.scan,
        nature: nature(media(pFr, r).legende, p.images.find((i) => i.nom === r.replace(/^\w:/, ''))?.type || (m.kind === 'plan' ? 'plan' : ''), r.replace(/^\w:/, '')),
      });
    }
  }
  return {
    lang,
    t: { ...t.xp, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, zoomReset: t.projet.zoomReset },
    projets: projets.map((p, i) => {
      const { img, pos } = couverture(p);
      return { slug: p.slug, n: i + 1, titre: p.titre, programme: p.programme, annee: p.annee, lieu: p.lieu, resume: resume(p), cover: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos }, href: `/${lang}/projets/${p.slug}/` };
    }),
    dessins,
    pages: [
      { label: t.nav.home, href: `/${lang}/` },
      { label: t.nav.projets, href: `/${lang}/projets/` },
      { label: t.nav.apropos, href: `/${lang}/a-propos/` },
      { label: t.nav.references, href: `/${lang}/references/` },
      { label: t.nav.contact, href: `/${lang}/contact/` },
      { label: t.footer.mentions, href: `/${lang}/mentions-legales/` },
    ],
    portfolio: PDF_HREF,
  };
}
