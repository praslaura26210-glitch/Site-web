import type { Fiche, Statut, TypeFiche } from '../types';

/** Minuscules, sans accents ni ponctuation : « Pisé » → « pise ». */
function normCar(c: string): string {
  const l = c.toLowerCase();
  if (l === 'œ') return 'oe';
  if (l === 'æ') return 'ae';
  if (l === 'ß') return 'ss';
  const d = l.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /^[a-z0-9]*$/.test(d) ? d : ' ';
}

export function normaliser(s: string): string {
  return [...s].map(normCar).join('').replace(/\s+/g, ' ').trim();
}

/** Version normalisée + correspondance vers les positions du texte d'origine (pour les extraits). */
function normAvecCarte(s: string): { n: string; carte: number[] } {
  let n = '';
  const carte: number[] = [];
  [...s].forEach((c, i) => {
    const x = normCar(c);
    for (const k of x) {
      n += k;
      carte.push(i);
    }
  });
  return { n, carte };
}

const INVARIABLES = new Set('sens temps corps fois vers cas plus sous dans tres apres gneiss pays'.split(' '));

/** Pluriel → singulier, grossièrement : « ruines » → « ruine », « matériaux » → « materiau ». */
function racine(mot: string): string {
  if (mot.length < 4 || INVARIABLES.has(mot)) return mot;
  if (mot.endsWith('x') && /[aeiou]ux$/.test(mot)) return mot.slice(0, -1);
  if (mot.endsWith('s') && !/[siuo]s$/.test(mot)) return mot.slice(0, -1);
  return mot;
}

const racines = (s: string) => normaliser(s).split(' ').map(racine).join(' ');

const MOTS_VIDES = new Set('de la le les des du d l et en a au aux un une ou sur dans par pour the of and di il lo e'.split(' '));

export interface Filtres {
  q: string;
  type: TypeFiche | null;
  statut: Statut | null;
  motsCles: string[];
}

export const FILTRES_VIDES: Filtres = { q: '', type: null, statut: null, motsCles: [] };

/** Chaque « concept » de la requête : l'un de ses termes doit apparaître dans la fiche. */
export function concepts(q: string, synonymes: string[][]): string[][] {
  let reste = ` ${racines(q)} `;
  const trouves: string[][] = [];
  const groupes = synonymes.map((g) => [...new Set(g.map(racines).filter(Boolean))]);
  // les expressions les plus longues d'abord : « terre compactée » avant « terre »
  const termes = groupes.flatMap((g, i) => g.map((t) => ({ t, i }))).sort((a, b) => b.t.length - a.t.length);
  for (const { t, i } of termes) {
    if (reste.includes(` ${t} `)) {
      reste = reste.replace(` ${t} `, ' ');
      if (!trouves.includes(groupes[i])) trouves.push(groupes[i]);
    }
  }
  for (const mot of reste.split(' ')) {
    if (mot && !MOTS_VIDES.has(mot)) trouves.push([mot]);
  }
  return trouves;
}

interface Champ {
  nom: string;
  poids: number;
  textes: string[];
}

function champs(f: Fiche): Champ[] {
  return [
    { nom: 'titre', poids: 10, textes: [f.titre] },
    { nom: 'auteur', poids: 8, textes: f.auteurs },
    { nom: 'mot-clé', poids: 6, textes: f.motsCles },
    { nom: 'éditeur', poids: 3, textes: [f.editeur ?? ''] },
    { nom: 'ce que j’en retiens', poids: 2, textes: [f.retenu ?? ''] },
    { nom: 'lien avec mon travail', poids: 2, textes: [f.lienTravail ?? ''] },
    { nom: 'citation', poids: 2, textes: f.citations.map((c) => `${c.texte} ${c.note ?? ''}`) },
    { nom: 'autre', poids: 1, textes: [f.emplacement ?? '', f.source ?? '', f.credit ?? '', f.annee ?? ''] },
  ];
}

/** Le terme commence-t-il un mot du texte ? (« ruine » trouve « ruines ») */
const contient = (texteNorm: string, terme: string) => ` ${texteNorm}`.includes(` ${terme}`);

export interface Extrait {
  champ: string;
  page?: string;
  texte: string;
}

export interface Resultat {
  fiche: Fiche;
  score: number;
  extrait?: Extrait;
}

const CHAMPS_EXTRAIT = new Set(['ce que j’en retiens', 'lien avec mon travail', 'citation', 'éditeur', 'autre']);

function extrait(f: Fiche, termes: string[]): Extrait | undefined {
  for (const c of champs(f)) {
    if (!CHAMPS_EXTRAIT.has(c.nom)) continue;
    for (const [i, t] of c.textes.entries()) {
      if (!t) continue;
      const { n, carte } = normAvecCarte(t);
      const pos = termes.map((x) => ` ${n}`.indexOf(` ${x}`)).filter((p) => p >= 0).sort((a, b) => a - b)[0];
      if (pos === undefined) continue;
      const debut = carte[Math.max(0, pos - 60)] ?? 0;
      const fin = carte[Math.min(n.length - 1, pos + 120)] ?? t.length;
      const morceau = t.slice(debut, fin + 1).trim();
      return {
        champ: c.nom,
        page: c.nom === 'citation' ? f.citations[i]?.page : undefined,
        texte: (debut > 0 ? '… ' : '') + morceau + (fin + 1 < t.length ? ' …' : ''),
      };
    }
  }
  return undefined;
}

export function chercher(fiches: Fiche[], filtres: Filtres, synonymes: string[][]): Resultat[] {
  const cs = filtres.q.trim() ? concepts(filtres.q, synonymes) : [];
  const res: Resultat[] = [];
  for (const f of fiches) {
    if (filtres.type && f.type !== filtres.type) continue;
    if (filtres.statut && f.statut !== filtres.statut) continue;
    if (filtres.motsCles.some((m) => !f.motsCles.includes(m))) continue;
    if (!cs.length) {
      res.push({ fiche: f, score: 0 });
      continue;
    }
    const norm = champs(f).map((c) => ({ ...c, n: c.textes.map(normaliser) }));
    let score = 0;
    let ok = true;
    for (const concept of cs) {
      let meilleur = 0;
      for (const c of norm) {
        if (c.n.some((t) => concept.some((terme) => contient(t, terme)))) meilleur = Math.max(meilleur, c.poids);
      }
      if (!meilleur) { ok = false; break; }
      score += meilleur;
    }
    if (!ok) continue;
    const titreSeul = cs.every((concept) => concept.some((t) => contient(normaliser(f.titre), t) || f.auteurs.some((a) => contient(normaliser(a), t))));
    res.push({ fiche: f, score, extrait: titreSeul ? undefined : extrait(f, cs.flat()) });
  }
  if (cs.length) res.sort((a, b) => b.score - a.score || a.fiche.titre.localeCompare(b.fiche.titre, 'fr'));
  return res;
}

/** Découpe un texte pour surligner les termes cherchés. */
export function decouper(texte: string, termes: string[]): { t: string; m: boolean }[] {
  if (!termes.length) return [{ t: texte, m: false }];
  const { n, carte } = normAvecCarte(texte);
  const marques = new Array(texte.length).fill(false);
  for (const terme of termes) {
    let i = -1;
    while ((i = ` ${n}`.indexOf(` ${terme}`, i + 1)) !== -1) {
      const debut = carte[i] ?? 0;
      const fin = carte[Math.min(i + terme.length - 1, carte.length - 1)] ?? debut;
      for (let k = debut; k <= fin; k++) marques[k] = true;
    }
  }
  const out: { t: string; m: boolean }[] = [];
  for (let k = 0; k < texte.length; k++) {
    const dernier = out[out.length - 1];
    if (dernier && dernier.m === marques[k]) dernier.t += texte[k];
    else out.push({ t: texte[k], m: marques[k] });
  }
  return out;
}

/** Suggestions de mots-clés pendant la saisie. */
export function suggerer(saisie: string, tous: { mot: string; famille: string }[], exclus: string[]): { mot: string; famille: string }[] {
  const s = normaliser(saisie);
  if (!s) return [];
  const pris = new Set(exclus);
  const debut: typeof tous = [];
  const dedans: typeof tous = [];
  for (const x of tous) {
    if (pris.has(x.mot)) continue;
    const n = normaliser(x.mot);
    if (contient(n, s)) debut.push(x);
    else if (n.includes(s)) dedans.push(x);
  }
  return [...debut, ...dedans].slice(0, 8);
}
