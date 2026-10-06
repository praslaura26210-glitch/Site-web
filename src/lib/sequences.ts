// Pages projet : un même gabarit (texte et fiche en tête, grande image, puis le projet),
// avec, pour chaque projet, les modules qui lui conviennent.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };
const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });

/** Une image placée sur une grille de 12 colonnes : [colonne de départ, largeur], décalage vertical (vh), alignement. */
export type Place = { r: string; col: [number, number]; mt?: number; bas?: boolean };

export type Bloc =
  /** intertitre de partie */
  | { t: 'inter'; titre: L3; note?: L3 }
  /** images disposées librement, rang par rang */
  | { t: 'galerie'; rangs: Place[][] }
  /** un texte (poème, récit, expérimentation, chiffres, palette) avec une image à côté */
  | { t: 'texte'; k: 'poeme' | 'recit' | 'experimentation' | 'chiffres' | 'palette'; titre?: L3; r?: string; cote?: 'g' | 'd' }
  /** existant / projet à comparer en faisant glisser un trait ; deux par ligne si « deux » */
  | { t: 'comparer'; deux?: boolean; items: { existant: string; projet: string; titre: L3 }[] }
  /** un même plan en plusieurs versions, à choisir */
  | { t: 'bascule'; titre: L3; options: { label: L3; r: string }[]; chiffres?: boolean }
  /** des dessins en vignettes : on clique pour les voir en grand */
  | { t: 'vignettes'; titre: L3; note?: L3; items: string[] };

export type Mise = {
  /** grande image sous l'en-tête (recadrée ; le clic l'ouvre en entier) */
  hero?: { r: string; pos?: string };
  blocs: Bloc[];
};

/** Chiffres clés lus sur les plans. */
export const CHIFFRES: Record<string, { label: L3; valeur: L3 }[]> = {
  'pilates-room': [
    { label: D('Salle de cours', 'Studio', 'Sala corsi'), valeur: D('60 m²', '60 m²', '60 m²') },
    { label: D('Accueil', 'Reception', 'Accoglienza'), valeur: D('20 m²', '20 m²', '20 m²') },
    { label: D('Hauteur sous plafond', 'Ceiling height', 'Altezza interna'), valeur: D('2,70 m', '2.70 m', '2,70 m') },
  ],
  'escalier-suspendu': [
    { label: D('Hauteur à franchir', 'Height to climb', 'Altezza da superare'), valeur: D('2 930 mm', '2,930 mm', '2.930 mm') },
    { label: D('Longueur du limon', 'Stringer length', 'Lunghezza del cosciale'), valeur: D('4 704 mm', '4,704 mm', '4.704 mm') },
    { label: D('Pente', 'Pitch', 'Pendenza'), valeur: D('38,5°', '38.5°', '38,5°') },
    { label: D('Garde-corps (palier)', 'Railing (landing)', 'Parapetto (pianerottolo)'), valeur: D('968 mm', '968 mm', '968 mm') },
  ],
};

/** Mention d'auteur des images (affichée seulement quand on agrandit une image). */
export const CREDITS: Record<string, { defaut: string; images?: Record<string, string> }> = {
  'illusion-d-envol': { defaut: '© Laura Pras' },
  'la-ruche': { defaut: '© Laura Pras' },
  'le-passage-des-artistes': { defaut: '', images: { 'experimentation-1': '© Damien Vielfaure', 'experimentation-2': '© Damien Vielfaure', 'experimentation-3': '© Damien Vielfaure' } },
  'entre-deux-regards': { defaut: '© Laura Pras' },
  'pilates-room': { defaut: '© Laura Pras pour MTG Intérieur' },
  'escalier-suspendu': { defaut: '© Laura Pras' },
};

const T = {
  dessins: D('Dessins', 'Drawings', 'Disegni'),
  assemblages: D('Assemblages', 'Joints', 'Giunzioni'),
  maquette: D('Maquette', 'Model', 'Plastico'),
  site: D('Sur la pente', 'On the slope', 'Sul pendio'),
  experimentation: D('Expérimentation constructive', 'Building experiment', 'Sperimentazione costruttiva'),
  regard: D('Existant et projet', 'Existing and project', 'Esistente e progetto'),
  glisser: D("Faites glisser le trait : à gauche l'existant et ses démolitions, à droite le projet.", 'Drag the line: the existing building and its demolitions on the left, the project on the right.', 'Trascinate la linea: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.'),
  ambiances: D('Ambiances', 'Atmospheres', 'Atmosfere'),
  plans: D('Plans', 'Plans', 'Piante'),
  matieres: D('Matières', 'Materials', 'Materiali'),
  coupes: D('Coupes', 'Sections', 'Sezioni'),
  cliquer: D('Cliquez sur un dessin pour le voir en détail.', 'Click a drawing to see it in detail.', 'Cliccate su un disegno per vederlo nel dettaglio.'),
  techniques: D('Dessins techniques', 'Technical drawings', 'Disegni tecnici'),
  conception: D('Conception', 'Design', 'Progettazione'),
};

export const MISES: Record<string, Mise> = {
  'illusion-d-envol': {
    hero: { r: 'croquis-perspective', pos: '50% 72%' },
    blocs: [
      { t: 'texte', k: 'poeme', r: 'axonometrie-eclatee', cote: 'd' },
      { t: 'inter', titre: T.dessins },
      { t: 'galerie', rangs: [[{ r: 'coupe-aa', col: [1, 8] }], [{ r: 'plan-rdc', col: [2, 5] }, { r: 'facade-sud', col: [7, 6], bas: true }]] },
      { t: 'inter', titre: T.assemblages },
      { t: 'galerie', rangs: [[{ r: 'detail-assemblage-1', col: [1, 3] }, { r: 'detail-assemblage-2', col: [4, 3], mt: 8 }, { r: 'detail-assemblage-3', col: [7, 3], mt: 2 }, { r: 'detail-assemblage-4', col: [10, 3], mt: 10 }]] },
    ],
  },
  'la-ruche': {
    hero: { r: 'maquette-2', pos: '50% 60%' },
    blocs: [
      { t: 'texte', k: 'poeme', r: 'maquette-3', cote: 'g' },
      { t: 'inter', titre: T.site },
      { t: 'galerie', rangs: [[{ r: 'coupe-aa', col: [1, 12] }], [{ r: 'plan-masse', col: [1, 6] }, { r: 'axonometrie-eclatee', col: [8, 4], mt: 6 }]] },
      { t: 'inter', titre: T.dessins },
      { t: 'galerie', rangs: [[{ r: 'plan-rdc', col: [1, 6] }, { r: 'plan-r-1', col: [7, 6], mt: 10 }], [{ r: 'plan-structure', col: [1, 7] }, { r: 'facade-ouest', col: [8, 5], bas: true }]] },
      { t: 'inter', titre: T.maquette },
      { t: 'galerie', rangs: [[{ r: 'maquette-5', col: [1, 7] }, { r: 'maquette-4', col: [9, 4], mt: 12 }]] },
    ],
  },
  'le-passage-des-artistes': {
    hero: { r: 'coupe-perspective', pos: '50% 55%' },
    blocs: [
      { t: 'galerie', rangs: [[{ r: 'croquis-cour', col: [1, 5] }, { r: 'maquette-2', col: [7, 5], mt: 10 }]] },
      { t: 'inter', titre: T.dessins },
      { t: 'galerie', rangs: [[{ r: 'plan-masse', col: [1, 4] }, { r: 'plan-rdc', col: [5, 4], mt: 8 }, { r: 'plan-etages', col: [9, 4], mt: 3 }], [{ r: 'facade-sud', col: [1, 12] }], [{ r: 'coupe', col: [1, 7] }, { r: 'facade-nord', col: [9, 4], bas: true }], [{ r: 'detail-axonometrie', col: [4, 5] }]] },
      { t: 'texte', k: 'experimentation', titre: T.experimentation, r: 'experimentation-2', cote: 'd' },
      { t: 'galerie', rangs: [[{ r: 'experimentation-1', col: [1, 5] }, { r: 'experimentation-3', col: [7, 6], mt: 10 }]] },
    ],
  },
  'entre-deux-regards': {
    hero: { r: 'perspective-exterieure', pos: '50% 55%' },
    blocs: [
      { t: 'galerie', rangs: [[{ r: 'x:plan-masse-projet', col: [1, 12] }]] },
      { t: 'galerie', rangs: [[{ r: 'maquette', col: [1, 4] }, { r: 'perspective-cour', col: [5, 8], bas: true }]] },
      { t: 'texte', k: 'recit', r: 'perspective-escalier', cote: 'd' },
      { t: 'inter', titre: T.regard, note: T.glisser },
      {
        t: 'comparer', deux: true, items: [
          { existant: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet', titre: D('Plan RDC', 'Ground floor', 'Piano terra') },
          { existant: 'c:plan-etage-existant', projet: 'c:plan-etage-projet', titre: D('Plan étage', 'Upper floor', 'Piano primo') },
        ],
      },
      {
        t: 'comparer', items: [
          { existant: 'c:facade-sud-existant', projet: 'c:facade-sud-projet', titre: D('Façade sud', 'South elevation', 'Prospetto sud') },
          { existant: 'c:coupe-aa-existant', projet: 'c:coupe-aa-projet', titre: D('Coupe AA', 'Section AA', 'Sezione AA') },
        ],
      },
    ],
  },
  'pilates-room': {
    hero: { r: 'rendu-salle', pos: '50% 60%' },
    blocs: [
      { t: 'galerie', rangs: [[{ r: 'rendu-accueil', col: [1, 5] }, { r: 'rendu-vestiaire', col: [6, 3], mt: 10 }, { r: 'rendu-coiffeuse', col: [9, 4], bas: true }]] },
      { t: 'bascule', titre: T.plans, chiffres: true, options: [{ label: D('Aménagement', 'Layout', 'Arredo'), r: 'p:plan-amenagement' }, { label: D('Électricité et éclairage', 'Electrical and lighting', 'Impianto elettrico e illuminazione'), r: 'p:plan-electricite' }] },
      { t: 'texte', k: 'palette', titre: T.matieres, r: 'planche-materiaux', cote: 'g' },
      { t: 'vignettes', titre: T.coupes, note: T.cliquer, items: ['p:coupe-aa', 'p:coupe-bb', 'p:coupe-cc'] },
    ],
  },
  'escalier-suspendu': {
    blocs: [
      { t: 'texte', k: 'chiffres', titre: T.conception, r: 'rendu', cote: 'g' },
      { t: 'galerie', rangs: [[{ r: 'p:axonometrie', col: [4, 6] }]] },
      { t: 'vignettes', titre: T.techniques, note: T.cliquer, items: ['p:vue-de-face', 'p:vue-en-plan', 'p:planche-limon-marches', 'p:planche-garde-corps'] },
    ],
  },
};
