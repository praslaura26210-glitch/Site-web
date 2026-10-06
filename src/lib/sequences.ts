// Pages projet : une ouverture (titre et grande image), la présentation, puis des blocs choisis pour chaque projet.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };
const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });

export type Bloc =
  /** intertitre */
  | { t: 'inter'; titre: L3; note?: L3 }
  /** une image en pleine largeur */
  | { t: 'grand'; r: string }
  /** une rangée d'images ramenées à la même hauteur, sur toute la largeur */
  | { t: 'rang'; r: string[] }
  /** un texte (poème, récit, expérimentation, chiffres, palette) avec, ou non, une image à côté */
  | { t: 'texte'; k: 'poeme' | 'recit' | 'experimentation' | 'chiffres' | 'palette'; titre?: L3; r?: string; cote?: 'g' | 'd'; colonnes?: boolean }
  /** une visionneuse : un grand dessin à la fois, flèches pour passer au suivant */
  | { t: 'visionneuse'; titre: L3; r: string[]; k?: 'chiffres' }
  /**
   * composition de magazine : rangs de 12 colonnes ; dans chaque rang les images sont côte à côte,
   * de largeurs différentes et décalées en hauteur (mt, en vh), sans se superposer.
   */
  | { t: 'composition'; rangs: { r: string; col: [number, number]; mt?: number }[][] }
  /** existant / projet à comparer en faisant glisser un trait ; deux par ligne si « deux » */
  | { t: 'comparer'; deux?: boolean; items: { existant: string; projet: string; titre: L3 }[] };

export type Mise = { ouverture: string; pos?: string; blocs: Bloc[] };

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
  pente: D('Sur la pente', 'On the slope', 'Sul pendio'),
  maquette: D('Maquette', 'Model', 'Plastico'),
  site: D('Le site', 'The site', 'Il sito'),
  experimentation: D('Expérimentation constructive', 'Building experiment', 'Sperimentazione costruttiva'),
  vues: D('Vues', 'Views', 'Viste'),
  regard: D('Existant et projet', 'Existing and project', 'Esistente e progetto'),
  glisser: D("Faites glisser le trait : à gauche l'existant et ses démolitions, à droite le projet.", 'Drag the line: the existing building and its demolitions on the left, the project on the right.', 'Trascinate la linea: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.'),
  ambiances: D('Ambiances', 'Atmospheres', 'Atmosfere'),
  plans: D('Plans', 'Plans', 'Piante'),
  matieres: D('Matières', 'Materials', 'Materiali'),
  coupes: D('Coupes', 'Sections', 'Sezioni'),
  conception: D('Conception', 'Design', 'Progettazione'),
  techniques: D('Dessins techniques', 'Technical drawings', 'Disegni tecnici'),
};

export const MISES: Record<string, Mise> = {
  'illusion-d-envol': {
    ouverture: 'maquette',
    blocs: [
      { t: 'rang', r: ['croquis-perspective', 'axonometrie-eclatee'] },
      { t: 'texte', k: 'poeme', colonnes: true },
      { t: 'inter', titre: T.dessins },
      { t: 'visionneuse', titre: T.dessins, r: ['coupe-aa', 'plan-rdc', 'facade-sud'] },
      { t: 'inter', titre: T.assemblages },
      { t: 'rang', r: ['detail-assemblage-1', 'detail-assemblage-2', 'detail-assemblage-3', 'detail-assemblage-4'] },
    ],
  },
  'la-ruche': {
    ouverture: 'maquette-1',
    blocs: [
      { t: 'inter', titre: T.pente },
      { t: 'grand', r: 'coupe-aa' },
      { t: 'texte', k: 'poeme', r: 'maquette-3', cote: 'd' },
      { t: 'rang', r: ['maquette-2', 'maquette-4'] },
      { t: 'inter', titre: T.dessins },
      { t: 'visionneuse', titre: T.dessins, r: ['plan-masse', 'plan-rdc', 'plan-r-1', 'plan-structure', 'facade-ouest', 'axonometrie-eclatee'] },
      { t: 'rang', r: ['maquette-5'] },
    ],
  },
  'le-passage-des-artistes': {
    ouverture: 'maquette-2',
    blocs: [
      { t: 'inter', titre: T.site },
      { t: 'grand', r: 'plan-masse' },
      { t: 'rang', r: ['croquis-cour', 'maquette-1', 'detail-axonometrie'] },
      { t: 'grand', r: 'coupe-perspective' },
      { t: 'inter', titre: T.dessins },
      { t: 'visionneuse', titre: T.dessins, r: ['plan-rdc', 'plan-etages', 'facade-sud', 'facade-nord', 'coupe'] },
      { t: 'inter', titre: T.experimentation },
      { t: 'texte', k: 'experimentation', r: 'experimentation-2', cote: 'd' },
      { t: 'rang', r: ['experimentation-1', 'experimentation-3'] },
    ],
  },
  'entre-deux-regards': {
    ouverture: 'maquette',
    pos: '50% 60%',
    blocs: [
      { t: 'inter', titre: T.site },
      { t: 'grand', r: 'x:plan-masse-projet' },
      { t: 'inter', titre: T.vues },
      { t: 'visionneuse', titre: T.vues, r: ['perspective-exterieure', 'perspective-cour', 'perspective-escalier'] },
      { t: 'texte', k: 'recit' },
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
    ouverture: 'rendu-accueil',
    blocs: [
      { t: 'inter', titre: T.ambiances },
      { t: 'rang', r: ['rendu-salle', 'rendu-vestiaire', 'rendu-coiffeuse'] },
      { t: 'inter', titre: T.plans },
      { t: 'visionneuse', titre: T.plans, r: ['p:plan-amenagement', 'p:plan-electricite'], k: 'chiffres' },
      { t: 'texte', k: 'palette', titre: T.matieres, r: 'planche-materiaux', cote: 'g' },
      { t: 'inter', titre: T.coupes },
      { t: 'visionneuse', titre: T.coupes, r: ['p:coupe-aa', 'p:coupe-bb', 'p:coupe-cc'] },
    ],
  },
  'escalier-suspendu': {
    ouverture: 'rendu',
    blocs: [
      { t: 'texte', k: 'chiffres', titre: T.conception, r: 'p:axonometrie', cote: 'd' },
      { t: 'inter', titre: T.techniques },
      { t: 'visionneuse', titre: T.techniques, r: ['p:vue-de-face', 'p:vue-en-plan', 'p:planche-limon-marches', 'p:planche-garde-corps'] },
    ],
  },
};
