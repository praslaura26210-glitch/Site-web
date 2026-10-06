// Pages projet : trois mises en page, pour comparer.
// - « blog » : texte et image alternent de part et d'autre, tout apparaît en descendant ;
// - « livrable » : des planches de rendu, avec cartouche, comme un dossier remis ;
// - « collage » : images et textes dispersés, de tailles et d'inclinaisons variées, qui bougent au défilement.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };
/** une image, ou un dessin existant / projet à comparer */
export type Img = string | { existant: string; projet: string; titre: L3 };
/** un texte : celui du projet, le récit, l'expérimentation, des strophes du poème, les chiffres, la palette, ou un texte écrit ici */
export type Texte = 'projet' | 'chapeau' | 'reste' | 'recit' | 'experimentation' | 'chiffres' | 'palette' | { poeme: [number, number] } | L3;

export type Ligne = { images: Img[]; texte?: Texte };
export type Planche = { titre: L3; images: string[]; texte?: Texte };
/** collage : position dans une grille de 12 colonnes, décalage vertical (vh), inclinaison (°), vitesse de parallaxe */
export type Morceau = { r?: string; texte?: Texte; col: [number, number]; mt?: number; rot?: number; v?: number; grand?: boolean };

export type Mise =
  | { type: 'blog'; lignes: Ligne[] }
  | { type: 'livrable'; planches: Planche[] }
  | { type: 'collage'; morceaux: Morceau[] };

const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });

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

const GLISSER = D(
  "Faites glisser le trait : à gauche l'existant et ses démolitions, à droite le projet.",
  'Drag the line: the existing building and its demolitions on the left, the project on the right.',
  'Trascinate la linea: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.',
);

export const MISES: Record<string, Mise> = {
  'illusion-d-envol': {
    type: 'blog',
    lignes: [
      { images: ['croquis-perspective'], texte: 'projet' },
      { images: ['axonometrie-eclatee'], texte: { poeme: [0, 2] } },
      { images: ['coupe-aa'], texte: { poeme: [2, 4] } },
      { images: ['plan-rdc'], texte: { poeme: [4, 5] } },
      { images: ['facade-sud'] },
      { images: ['detail-assemblage-1', 'detail-assemblage-2'] },
      { images: ['detail-assemblage-3', 'detail-assemblage-4'] },
    ],
  },
  'la-ruche': {
    type: 'livrable',
    planches: [
      { titre: D('Le projet', 'The project', 'Il progetto'), images: ['maquette-2', 'maquette-3'], texte: 'projet' },
      { titre: D('Plans', 'Plans', 'Piante'), images: ['plan-masse', 'plan-rdc', 'plan-r-1'] },
      { titre: D('Coupe, structure et façade', 'Section, structure and elevation', 'Sezione, struttura e prospetto'), images: ['coupe-aa', 'plan-structure', 'facade-ouest'] },
      { titre: D('Axonométrie', 'Axonometric view', 'Assonometria'), images: ['axonometrie-eclatee'], texte: { poeme: [0, 3] } },
      { titre: D('Maquette', 'Model', 'Plastico'), images: ['maquette-5', 'maquette-4'] },
    ],
  },
  'le-passage-des-artistes': {
    type: 'collage',
    morceaux: [
      { texte: 'chapeau', col: [1, 6], grand: true },
      { r: 'croquis-cour', col: [8, 4], rot: -1.5, v: 0.08 },
      { r: 'maquette-2', col: [2, 4], mt: 2, rot: 1.2, v: -0.06 },
      { texte: 'reste', col: [7, 5], mt: 10 },
      { r: 'coupe-perspective', col: [1, 8], mt: 4, v: 0.04 },
      { r: 'plan-rdc', col: [9, 3], mt: 10, rot: 1.5, v: 0.14 },
      { r: 'plan-etages', col: [2, 3], mt: 4, rot: -1, v: -0.06 },
      { r: 'facade-sud', col: [5, 8], mt: 12, v: 0.05 },
      { r: 'facade-nord', col: [1, 4], mt: 2, rot: -2, v: 0.1 },
      { r: 'coupe', col: [5, 7], mt: 8, rot: 0.6, v: -0.04 },
      { r: 'detail-axonometrie', col: [3, 3], mt: 4, rot: 1.4, v: 0.12 },
      { r: 'plan-masse', col: [7, 4], mt: 10, rot: -0.8, v: -0.06 },
      { texte: 'experimentation', col: [1, 6], mt: 8, grand: true },
      { r: 'experimentation-2', col: [7, 6], mt: 2, rot: -1, v: 0.08 },
      { r: 'experimentation-1', col: [2, 4], mt: 6, rot: 2, v: -0.1 },
      { r: 'experimentation-3', col: [7, 5], mt: 12, rot: -1.5, v: 0.06 },
    ],
  },
  'entre-deux-regards': {
    type: 'blog',
    lignes: [
      { images: ['perspective-exterieure'], texte: 'projet' },
      { images: ['perspective-cour'], texte: 'recit' },
      { images: ['perspective-escalier'] },
      { images: [{ existant: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet', titre: D('Plan RDC', 'Ground floor', 'Piano terra') }], texte: GLISSER },
      { images: [{ existant: 'c:plan-etage-existant', projet: 'c:plan-etage-projet', titre: D('Plan étage', 'Upper floor', 'Piano primo') }] },
      { images: [{ existant: 'c:facade-sud-existant', projet: 'c:facade-sud-projet', titre: D('Façade sud', 'South elevation', 'Prospetto sud') }] },
      { images: [{ existant: 'c:coupe-aa-existant', projet: 'c:coupe-aa-projet', titre: D('Coupe AA', 'Section AA', 'Sezione AA') }] },
      { images: ['x:plan-masse-projet'] },
    ],
  },
  'pilates-room': {
    type: 'blog',
    lignes: [
      { images: ['rendu-salle'], texte: 'projet' },
      { images: ['rendu-vestiaire', 'rendu-coiffeuse'], texte: 'chiffres' },
      { images: ['planche-materiaux'], texte: 'palette' },
      { images: ['p:plan-amenagement'] },
      { images: ['p:coupe-cc'] },
      { images: ['p:coupe-aa', 'p:coupe-bb'] },
      { images: ['p:plan-electricite'] },
    ],
  },
  'escalier-suspendu': {
    type: 'blog',
    lignes: [
      { images: ['p:axonometrie'], texte: 'projet' },
      { images: ['p:vue-de-face'], texte: 'chiffres' },
      { images: ['p:vue-en-plan'] },
      { images: ['p:planche-limon-marches'] },
      { images: ['p:planche-garde-corps'] },
    ],
  },
};
