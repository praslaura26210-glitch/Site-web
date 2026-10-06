// Mise en page « magazine » de chaque projet : une suite de blocs qu'on découvre en descendant.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

type L3 = { fr: string; en: string; it: string };

export type Bloc =
  /** chapeau, texte du projet et fiche */
  | { t: 'texte' }
  /** chiffres clés (cotes, surfaces) */
  | { t: 'chiffres'; items: { label: L3; valeur: L3 }[] }
  /** intertitre de chapitre */
  | { t: 'chapitre'; titre: L3 }
  /** image en pleine largeur d'écran (paysage) */
  | { t: 'pleine'; r: string }
  /** image dans la largeur de la page ; « etroit » pour les formats carrés ou verticaux */
  | { t: 'large'; r: string; etroit?: boolean }
  /** image décalée d'un côté ; de l'autre, un texte (récit, poème, expérimentation) ou la seule légende */
  | { t: 'decale'; r: string; cote: 'g' | 'd'; texte?: 'recit' | 'poeme' | 'experimentation' }
  /** deux images ; « egal » : même largeur, sinon 7/5 */
  | { t: 'duo'; a: string; b: string; egal?: boolean }
  /** dessins larges empilés (existant puis projet) */
  | { t: 'pile'; r: string[]; etiquettes?: 'existant-projet' }
  | { t: 'trio'; r: string[] }
  | { t: 'grille'; r: string[] }
  /** croquis qui se trace, avec une image ou un texte à côté */
  | { t: 'croquis'; r: string; json: string; avec?: string; texte?: 'poeme' }
  /** palette de matériaux et planche */
  | { t: 'palette'; r: string };

const CH = {
  existant: { fr: 'Existant et projet', en: 'Existing and project', it: 'Esistente e progetto' },
  dessins: { fr: 'Dessins', en: 'Drawings', it: 'Disegni' },
  pierre: { fr: 'La pierre, à la main', en: 'Stone, by hand', it: 'La pietra, a mano' },
  maquette: { fr: 'Maquette', en: 'Model', it: 'Plastico' },
  details: { fr: 'Assemblages', en: 'Joints', it: 'Giunzioni' },
  fabrication: { fr: 'Plans de fabrication', en: 'Fabrication drawings', it: 'Disegni costruttivi' },
  ambiances: { fr: 'Ambiances', en: 'Atmospheres', it: 'Atmosfere' },
};

export const SEQUENCES: Record<string, Bloc[]> = {
  'entre-deux-regards': [
    { t: 'texte' },
    { t: 'decale', r: 'maquette', cote: 'd', texte: 'recit' },
    { t: 'pleine', r: 'perspective-cour' },
    { t: 'chapitre', titre: CH.existant },
    { t: 'pile', r: ['c:plan-rdc-existant', 'c:plan-rdc-projet'], etiquettes: 'existant-projet' },
    { t: 'pile', r: ['c:facade-sud-existant', 'c:facade-sud-projet'], etiquettes: 'existant-projet' },
    { t: 'decale', r: 'perspective-escalier', cote: 'g' },
    { t: 'pile', r: ['c:plan-etage-existant', 'c:plan-etage-projet'], etiquettes: 'existant-projet' },
    { t: 'large', r: 'c:coupe-aa-projet' },
    { t: 'large', r: 'x:plan-masse-projet' },
  ],
  'le-passage-des-artistes': [
    { t: 'texte' },
    { t: 'croquis', r: 'croquis-cour', json: 'croquis-cour-traits.json', avec: 'maquette-2' },
    { t: 'pleine', r: 'coupe-perspective' },
    { t: 'chapitre', titre: CH.dessins },
    { t: 'duo', a: 'plan-rdc', b: 'plan-etages', egal: true },
    { t: 'large', r: 'facade-sud' },
    { t: 'duo', a: 'coupe', b: 'facade-nord' },
    { t: 'chapitre', titre: CH.pierre },
    { t: 'decale', r: 'experimentation-2', cote: 'g', texte: 'experimentation' },
    { t: 'duo', a: 'experimentation-1', b: 'experimentation-3' },
    { t: 'decale', r: 'detail-axonometrie', cote: 'd' },
    { t: 'large', r: 'plan-masse', etroit: true },
  ],
  'pilates-room': [
    { t: 'texte' },
    {
      t: 'chiffres',
      items: [
        { label: { fr: 'Salle de cours', en: 'Studio', it: 'Sala corsi' }, valeur: { fr: '60 m²', en: '60 m²', it: '60 m²' } },
        { label: { fr: 'Accueil', en: 'Reception', it: 'Accoglienza' }, valeur: { fr: '20 m²', en: '20 m²', it: '20 m²' } },
        { label: { fr: 'Hauteur sous plafond', en: 'Ceiling height', it: 'Altezza interna' }, valeur: { fr: '2,70 m', en: '2.70 m', it: '2,70 m' } },
      ],
    },
    { t: 'large', r: 'p:plan-amenagement' },
    { t: 'chapitre', titre: CH.ambiances },
    { t: 'trio', r: ['rendu-salle', 'rendu-vestiaire', 'rendu-coiffeuse'] },
    { t: 'palette', r: 'planche-materiaux' },
    { t: 'chapitre', titre: CH.dessins },
    { t: 'large', r: 'p:coupe-cc' },
    { t: 'duo', a: 'p:coupe-aa', b: 'p:coupe-bb' },
    { t: 'large', r: 'p:plan-electricite' },
  ],
  'escalier-suspendu': [
    { t: 'texte' },
    {
      t: 'chiffres',
      items: [
        { label: { fr: 'Hauteur à franchir', en: 'Height to climb', it: 'Altezza da superare' }, valeur: { fr: '2 930 mm', en: '2,930 mm', it: '2.930 mm' } },
        { label: { fr: 'Longueur du limon', en: 'Stringer length', it: 'Lunghezza del cosciale' }, valeur: { fr: '4 704 mm', en: '4,704 mm', it: '4.704 mm' } },
        { label: { fr: 'Pente', en: 'Pitch', it: 'Pendenza' }, valeur: { fr: '38,5°', en: '38.5°', it: '38,5°' } },
      ],
    },
    { t: 'decale', r: 'p:vue-de-face', cote: 'g' },
    { t: 'decale', r: 'p:axonometrie', cote: 'd' },
    { t: 'large', r: 'p:vue-en-plan' },
    { t: 'chapitre', titre: CH.fabrication },
    { t: 'duo', a: 'p:planche-limon-marches', b: 'p:planche-garde-corps', egal: true },
  ],
  'la-ruche': [
    { t: 'texte' },
    { t: 'decale', r: 'maquette-3', cote: 'g', texte: 'poeme' },
    { t: 'pleine', r: 'maquette-2' },
    { t: 'decale', r: 'axonometrie-eclatee', cote: 'd' },
    { t: 'chapitre', titre: CH.dessins },
    { t: 'duo', a: 'plan-rdc', b: 'plan-r-1', egal: true },
    { t: 'large', r: 'coupe-aa' },
    { t: 'pile', r: ['plan-structure', 'facade-ouest'] },
    { t: 'chapitre', titre: CH.maquette },
    { t: 'duo', a: 'maquette-5', b: 'maquette-4' },
    { t: 'large', r: 'plan-masse', etroit: true },
  ],
  'illusion-d-envol': [
    { t: 'texte' },
    { t: 'croquis', r: 'croquis-perspective', json: 'croquis-perspective-traits.json', texte: 'poeme' },
    { t: 'large', r: 'axonometrie-eclatee', etroit: true },
    { t: 'chapitre', titre: CH.dessins },
    { t: 'large', r: 'coupe-aa' },
    { t: 'duo', a: 'plan-rdc', b: 'facade-sud' },
    { t: 'chapitre', titre: CH.details },
    { t: 'grille', r: ['detail-assemblage-1', 'detail-assemblage-2', 'detail-assemblage-3', 'detail-assemblage-4'] },
  ],
};
