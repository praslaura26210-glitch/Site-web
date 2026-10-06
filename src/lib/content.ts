// Lecture des contenus (content/) au moment du build. Uniquement côté serveur.
import fs from 'node:fs';
import path from 'node:path';
import type { Lang } from '@/i18n';

const ROOT = path.join(process.cwd(), 'content');
const A_COMPLETER = '[À COMPLÉTER]';

/** Ordre validé par Laura : ce n'est pas l'ordre chronologique du book. */
export const ORDRE = [
  'entre-deux-regards',
  'le-passage-des-artistes',
  'pilates-room',
  'escalier-suspendu',
  'la-ruche',
  'illusion-d-envol',
] as const;

export type Image = {
  nom: string;
  type: string;
  legende: string;
  src: string; // 2000 px
  srcSmall: string; // 1000 px
  w: number;
  h: number;
};

export type Plan = { nom: string; legende: string; src: string; w: number; h: number; ko: number };

export type Projet = {
  slug: string;
  numero: string;
  ordre: number;
  titre: string;
  programme: string;
  cadre: string;
  annee: number | null;
  lieu: string | null;
  surface: string | null;
  enjeux: string | null;
  texte: string;
  recit_titre?: string;
  recit?: string;
  poeme?: string;
  experimentation?: string;
  images: Image[];
  plans: Plan[];
};

/** Une valeur [À COMPLÉTER] n'est jamais affichée sur le site public. */
function clean<T>(v: T): T | null {
  if (v == null) return null;
  if (typeof v === 'string' && (v.includes(A_COMPLETER) || v === 'sans objet')) return null;
  return v;
}

function readJSON(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function getProjet(slug: string, lang: Lang): Projet {
  const dir = path.join(ROOT, 'projets', slug);
  const d = readJSON(path.join(dir, 'data.json'));
  const tr = lang !== 'fr' && fs.existsSync(path.join(dir, `textes.${lang}.json`)) ? readJSON(path.join(dir, `textes.${lang}.json`)) : {};
  const t = { ...d, ...tr };
  const images: Image[] = (d.images || []).map((i: any) => ({
    nom: i.nom,
    type: i.type,
    legende: (tr.legendes && tr.legendes[i.nom]) || i.legende,
    src: `/media/${slug}/images/${i.nom}-2000.webp`,
    srcSmall: `/media/${slug}/images/${i.nom}-1000.webp`,
    w: i.fichiers['2000'].px[0],
    h: i.fichiers['2000'].px[1],
  }));
  const plans: Plan[] = (d.plans_vectoriels || []).map((p: any) => ({
    nom: p.nom,
    legende: p.legende,
    src: `/media/${slug}/plans/${p.nom}.svg`,
    w: p.format_pt[0],
    h: p.format_pt[1],
    ko: p.ko,
  }));
  return {
    slug,
    numero: d.numero,
    ordre: ORDRE.indexOf(slug as any) + 1,
    titre: d.titre,
    programme: t.programme,
    cadre: t.cadre,
    annee: clean(d.annee),
    lieu: clean(d.lieu),
    surface: clean(d.surface),
    enjeux: clean(t.enjeux),
    texte: t.texte,
    recit_titre: t.recit_titre,
    recit: t.recit,
    poeme: lang === 'fr' ? d.poeme : undefined,
    experimentation: t.experimentation,
    images,
    plans,
  };
}

export function getProjets(lang: Lang): Projet[] {
  return ORDRE.map((s) => getProjet(s, lang));
}

export function readSVG(slug: string, nom: string): string {
  return fs.readFileSync(path.join(ROOT, 'projets', slug, 'plans', `${nom}.svg`), 'utf8');
}

export function getCV() {
  return readJSON(path.join(ROOT, 'site', 'cv.json'));
}
