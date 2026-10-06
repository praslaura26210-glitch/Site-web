// Pages projet : une fiche « catalogue », puis des chapitres.
// Dans chaque chapitre, les images défilent sur deux colonnes, à la façon d'un magazine,
// et apparaissent au fur et à mesure ; le texte du chapitre reste en place à droite.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };

/** Une image (r) ou un dessin existant / projet à comparer en faisant glisser un trait. */
export type Bloc = { r: string } | { existant: string; projet: string; titre: L3 };

export type Chapitre = {
  titre: L3;
  /** texte de la colonne de droite */
  texte?: 'recit' | 'poeme' | 'experimentation' | L3;
  chiffres?: { label: L3; valeur: L3 }[];
  palette?: boolean;
  blocs: Bloc[];
};

const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });
const CH = {
  dessins: D('Dessins', 'Drawings', 'Disegni'),
  maquette: D('Maquette', 'Model', 'Plastico'),
  regard: D('Existant et projet', 'Existing and project', 'Esistente e progetto'),
  experimentation: D('Expérimentation constructive', 'Building experiment', 'Sperimentazione costruttiva'),
  ambiances: D('Ambiances', 'Atmospheres', 'Atmosfere'),
  matieres: D('Matières', 'Materials', 'Materiali'),
  details: D('Assemblages', 'Joints', 'Giunzioni'),
  conception: D('Conception', 'Design', 'Progettazione'),
  fabrication: D('Plans de fabrication', 'Fabrication drawings', 'Disegni costruttivi'),
  pavillon: D('Le pavillon', 'The pavilion', 'Il padiglione'),
  lieu: D('Le lieu', 'The place', 'Il luogo'),
  batiment: D('Le bâtiment', 'The building', "L'edificio"),
};
const R = (...r: string[]): Bloc[] => r.map((x) => ({ r: x }));

/** Mention d'auteur des images, par projet (et exceptions par image). */
export const CREDITS: Record<string, { defaut: string; images?: Record<string, string> }> = {
  'illusion-d-envol': { defaut: '© Laura Pras' },
  'la-ruche': { defaut: '© Laura Pras' },
  'le-passage-des-artistes': { defaut: '', images: { 'experimentation-1': '© Damien Vielfaure', 'experimentation-2': '© Damien Vielfaure', 'experimentation-3': '© Damien Vielfaure' } },
  'entre-deux-regards': { defaut: '© Laura Pras' },
  'pilates-room': { defaut: '© Laura Pras pour MTG Intérieur' },
  'escalier-suspendu': { defaut: '© Laura Pras' },
};

export const SEQUENCES: Record<string, Chapitre[]> = {
  'illusion-d-envol': [
    { titre: CH.pavillon, texte: 'poeme', blocs: R('croquis-perspective', 'axonometrie-eclatee') },
    { titre: CH.dessins, blocs: R('coupe-aa', 'plan-rdc', 'facade-sud') },
    { titre: CH.details, blocs: R('detail-assemblage-1', 'detail-assemblage-2', 'detail-assemblage-3', 'detail-assemblage-4') },
  ],
  'la-ruche': [
    { titre: CH.maquette, texte: 'poeme', blocs: R('maquette-2', 'maquette-3', 'maquette-4', 'maquette-5') },
    { titre: CH.dessins, blocs: R('axonometrie-eclatee', 'plan-masse', 'plan-rdc', 'plan-r-1', 'coupe-aa', 'plan-structure', 'facade-ouest') },
  ],
  'le-passage-des-artistes': [
    { titre: CH.lieu, blocs: R('croquis-cour', 'maquette-2') },
    { titre: CH.dessins, blocs: R('coupe-perspective', 'plan-masse', 'plan-rdc', 'plan-etages', 'facade-sud', 'coupe', 'facade-nord', 'detail-axonometrie') },
    { titre: CH.experimentation, texte: 'experimentation', blocs: R('experimentation-2', 'experimentation-1', 'experimentation-3') },
  ],
  'entre-deux-regards': [
    { titre: CH.batiment, texte: 'recit', blocs: R('perspective-exterieure', 'perspective-cour', 'perspective-escalier') },
    {
      titre: CH.regard,
      texte: D(
        "Faites glisser le trait sur chaque dessin : à gauche l'existant et ses démolitions, à droite le projet.",
        'Drag the line across each drawing: the existing building and its demolitions on the left, the project on the right.',
        'Trascinate la linea su ogni disegno: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.',
      ),
      blocs: [
        { existant: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet', titre: D('Plan RDC', 'Ground floor', 'Piano terra') },
        { existant: 'c:plan-etage-existant', projet: 'c:plan-etage-projet', titre: D('Plan étage', 'Upper floor', 'Piano primo') },
        { existant: 'c:facade-sud-existant', projet: 'c:facade-sud-projet', titre: D('Façade sud', 'South elevation', 'Prospetto sud') },
        { existant: 'c:coupe-aa-existant', projet: 'c:coupe-aa-projet', titre: D('Coupe AA', 'Section AA', 'Sezione AA') },
        { r: 'x:plan-masse-projet' },
      ],
    },
  ],
  'pilates-room': [
    {
      titre: CH.ambiances,
      chiffres: [
        { label: D('Salle de cours', 'Studio', 'Sala corsi'), valeur: D('60 m²', '60 m²', '60 m²') },
        { label: D('Accueil', 'Reception', 'Accoglienza'), valeur: D('20 m²', '20 m²', '20 m²') },
        { label: D('Hauteur sous plafond', 'Ceiling height', 'Altezza interna'), valeur: D('2,70 m', '2.70 m', '2,70 m') },
      ],
      blocs: R('rendu-salle', 'rendu-vestiaire', 'rendu-coiffeuse'),
    },
    { titre: CH.matieres, palette: true, blocs: R('planche-materiaux') },
    { titre: CH.dessins, blocs: R('p:plan-amenagement', 'p:plan-electricite', 'p:coupe-cc', 'p:coupe-aa', 'p:coupe-bb') },
  ],
  'escalier-suspendu': [
    {
      titre: CH.conception,
      chiffres: [
        { label: D('Hauteur à franchir', 'Height to climb', 'Altezza da superare'), valeur: D('2 930 mm', '2,930 mm', '2.930 mm') },
        { label: D('Longueur du limon', 'Stringer length', 'Lunghezza del cosciale'), valeur: D('4 704 mm', '4,704 mm', '4.704 mm') },
        { label: D('Pente', 'Pitch', 'Pendenza'), valeur: D('38,5°', '38.5°', '38,5°') },
      ],
      blocs: R('p:axonometrie', 'p:vue-de-face', 'p:vue-en-plan'),
    },
    { titre: CH.fabrication, blocs: R('p:planche-limon-marches', 'p:planche-garde-corps') },
  ],
};
