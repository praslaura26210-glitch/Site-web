// Pages projet : une suite de chapitres. À droite, le texte reste en place ; à gauche, les images défilent.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };

/** Ce qu'on voit dans la colonne d'images */
export type Visuel =
  | { r: string }
  /** deux images côte à côte */
  | { duo: [string, string] }
  /** quatre petites images */
  | { grille: string[] }
  /** dessin original qui apparaît au crayon */
  | { esquisse: string; fuite?: [number, number] }
  /** existant / projet : on fait glisser pour passer de l'un à l'autre */
  | { comparer: { titre: L3; existant: string; projet: string }[] };

export type Chapitre = {
  titre?: L3;
  /** texte de la colonne de droite */
  texte?: 'projet' | 'recit' | 'poeme' | 'experimentation' | L3;
  /** chiffres clés et palette sous le texte */
  chiffres?: { label: L3; valeur: L3 }[];
  palette?: boolean;
  visuels: Visuel[];
};

const CH = {
  regard: { fr: 'Existant et projet', en: 'Existing and project', it: 'Esistente e progetto' },
  dessins: { fr: 'Dessins', en: 'Drawings', it: 'Disegni' },
  pierre: { fr: 'La pierre, à la main', en: 'Stone, by hand', it: 'La pietra, a mano' },
  maquette: { fr: 'Maquette', en: 'Model', it: 'Plastico' },
  details: { fr: 'Assemblages', en: 'Joints', it: 'Giunzioni' },
  fabrication: { fr: 'Plans de fabrication', en: 'Fabrication drawings', it: 'Disegni costruttivi' },
  ambiances: { fr: 'Ambiances', en: 'Atmospheres', it: 'Atmosfere' },
  matieres: { fr: 'Matières', en: 'Materials', it: 'Materiali' },
  site: { fr: 'Le site', en: 'The site', it: 'Il sito' },
  conception: { fr: 'Conception', en: 'Design', it: 'Progettazione' },
};
const GLISSER: L3 = {
  fr: "Faites glisser le trait : à gauche l'existant et ses démolitions, à droite le projet.",
  en: 'Drag the line: the existing building and its demolitions on the left, the project on the right.',
  it: 'Trascinate la linea: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.',
};
const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });

export const SEQUENCES: Record<string, Chapitre[]> = {
  'entre-deux-regards': [
    { texte: 'projet', visuels: [{ r: 'perspective-cour' }, { r: 'maquette' }] },
    { texte: 'recit', visuels: [{ r: 'perspective-escalier' }] },
    {
      titre: CH.regard,
      texte: GLISSER,
      visuels: [{
        comparer: [
          { titre: D('Plan RDC', 'Ground floor', 'Piano terra'), existant: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet' },
          { titre: D('Plan étage', 'Upper floor', 'Piano primo'), existant: 'c:plan-etage-existant', projet: 'c:plan-etage-projet' },
          { titre: D('Façade sud', 'South elevation', 'Prospetto sud'), existant: 'c:facade-sud-existant', projet: 'c:facade-sud-projet' },
          { titre: D('Façade nord', 'North elevation', 'Prospetto nord'), existant: 'c:facade-nord-existant', projet: 'c:facade-nord-projet' },
          { titre: D('Façade est', 'East elevation', 'Prospetto est'), existant: 'c:facade-est-existant', projet: 'c:facade-est-projet' },
          { titre: D('Façade ouest', 'West elevation', 'Prospetto ovest'), existant: 'c:facade-ouest-existant', projet: 'c:facade-ouest-projet' },
          { titre: D('Coupe AA', 'Section AA', 'Sezione AA'), existant: 'c:coupe-aa-existant', projet: 'c:coupe-aa-projet' },
        ],
      }],
    },
    { titre: CH.site, visuels: [{ r: 'x:plan-masse-projet' }] },
  ],
  'le-passage-des-artistes': [
    { texte: 'projet', visuels: [{ esquisse: 'croquis-cour', fuite: [0.2, 0.62] }, { r: 'maquette-2' }] },
    { titre: CH.dessins, visuels: [{ r: 'coupe-perspective' }, { duo: ['plan-rdc', 'plan-etages'] }, { r: 'facade-sud' }, { duo: ['coupe', 'facade-nord'] }] },
    { titre: CH.pierre, texte: 'experimentation', visuels: [{ r: 'experimentation-2' }, { duo: ['experimentation-1', 'experimentation-3'] }, { r: 'detail-axonometrie' }] },
    { titre: CH.site, visuels: [{ r: 'plan-masse' }] },
  ],
  'pilates-room': [
    {
      texte: 'projet',
      chiffres: [
        { label: D('Salle de cours', 'Studio', 'Sala corsi'), valeur: D('60 m²', '60 m²', '60 m²') },
        { label: D('Accueil', 'Reception', 'Accoglienza'), valeur: D('20 m²', '20 m²', '20 m²') },
        { label: D('Hauteur sous plafond', 'Ceiling height', 'Altezza interna'), valeur: D('2,70 m', '2.70 m', '2,70 m') },
      ],
      visuels: [{ r: 'p:plan-amenagement' }],
    },
    { titre: CH.ambiances, visuels: [{ r: 'rendu-salle' }, { duo: ['rendu-vestiaire', 'rendu-coiffeuse'] }] },
    { titre: CH.matieres, palette: true, visuels: [{ r: 'planche-materiaux' }] },
    { titre: CH.dessins, visuels: [{ r: 'p:coupe-cc' }, { duo: ['p:coupe-aa', 'p:coupe-bb'] }, { r: 'p:plan-electricite' }] },
  ],
  'escalier-suspendu': [
    {
      texte: 'projet',
      chiffres: [
        { label: D('Hauteur à franchir', 'Height to climb', 'Altezza da superare'), valeur: D('2 930 mm', '2,930 mm', '2.930 mm') },
        { label: D('Longueur du limon', 'Stringer length', 'Lunghezza del cosciale'), valeur: D('4 704 mm', '4,704 mm', '4.704 mm') },
        { label: D('Pente', 'Pitch', 'Pendenza'), valeur: D('38,5°', '38.5°', '38,5°') },
      ],
      visuels: [{ r: 'p:vue-de-face' }],
    },
    { titre: CH.conception, visuels: [{ r: 'p:axonometrie' }, { r: 'p:vue-en-plan' }] },
    { titre: CH.fabrication, visuels: [{ duo: ['p:planche-limon-marches', 'p:planche-garde-corps'] }] },
  ],
  'la-ruche': [
    { texte: 'projet', visuels: [{ r: 'maquette-2' }, { r: 'axonometrie-eclatee' }] },
    { texte: 'poeme', visuels: [{ r: 'maquette-3' }] },
    { titre: CH.dessins, visuels: [{ duo: ['plan-rdc', 'plan-r-1'] }, { r: 'coupe-aa' }, { r: 'plan-structure' }, { r: 'facade-ouest' }] },
    { titre: CH.maquette, visuels: [{ r: 'maquette-5' }, { r: 'maquette-4' }] },
    { titre: CH.site, visuels: [{ r: 'plan-masse' }] },
  ],
  'illusion-d-envol': [
    { texte: 'projet', visuels: [{ esquisse: 'croquis-perspective', fuite: [0.5, 0.7] }] },
    { texte: 'poeme', visuels: [{ r: 'axonometrie-eclatee' }] },
    { titre: CH.dessins, visuels: [{ r: 'coupe-aa' }, { duo: ['plan-rdc', 'facade-sud'] }] },
    { titre: CH.details, visuels: [{ grille: ['detail-assemblage-1', 'detail-assemblage-2', 'detail-assemblage-3', 'detail-assemblage-4'] }] },
  ],
};
