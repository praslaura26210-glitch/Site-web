// Pages projet : une suite de chapitres. À droite, le texte reste en place ; à gauche, les images défilent.
// Les dessins sont réunis dans une visionneuse (on passe de l'un à l'autre), où l'existant
// et le projet se comparent en faisant glisser un trait.
// Les références d'images et de plans sont décrites dans src/lib/media.ts.

export type L3 = { fr: string; en: string; it: string };

/** Ce qu'on voit dans la colonne d'images */
export type Visuel =
  | { r: string }
  /** deux images côte à côte */
  | { duo: [string, string] };

/** Un dessin de la visionneuse ; avec `projet`, r est l'existant et l'on compare les deux. */
export type Dessin = { r: string; projet?: string; titre?: L3 };

export type Chapitre = {
  titre?: L3;
  /** texte de la colonne de droite */
  texte?: 'projet' | 'recit' | 'poeme' | 'experimentation' | L3;
  /** chiffres clés et palette sous le texte */
  chiffres?: { label: L3; valeur: L3 }[];
  palette?: boolean;
  visuels?: Visuel[];
  /** chapitre « dessins » : visionneuse en pleine largeur */
  dessins?: Dessin[];
};

const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });
const CH = {
  dessins: D('Dessins', 'Drawings', 'Disegni'),
  regard: D('Existant et projet', 'Existing and project', 'Esistente e progetto'),
  experimentation: D('Expérimentation constructive', 'Building experiment', 'Sperimentazione costruttiva'),
  ambiances: D('Ambiances', 'Atmospheres', 'Atmosfere'),
  matieres: D('Matières', 'Materials', 'Materiali'),
  maquette: D('Maquette', 'Model', 'Plastico'),
};

export const SEQUENCES: Record<string, Chapitre[]> = {
  'illusion-d-envol': [
    { texte: 'projet', visuels: [{ r: 'croquis-perspective' }] },
    { texte: 'poeme', visuels: [{ r: 'axonometrie-eclatee' }] },
    {
      titre: CH.dessins,
      dessins: [{ r: 'coupe-aa' }, { r: 'plan-rdc' }, { r: 'facade-sud' }, { r: 'detail-assemblage-1' }, { r: 'detail-assemblage-2' }, { r: 'detail-assemblage-3' }, { r: 'detail-assemblage-4' }],
    },
  ],
  'la-ruche': [
    { texte: 'projet', visuels: [{ r: 'maquette-2' }, { r: 'maquette-3' }] },
    { texte: 'poeme', visuels: [{ r: 'maquette-5' }, { r: 'maquette-4' }] },
    {
      titre: CH.dessins,
      dessins: [{ r: 'axonometrie-eclatee' }, { r: 'plan-masse' }, { r: 'plan-rdc' }, { r: 'plan-r-1' }, { r: 'coupe-aa' }, { r: 'plan-structure' }, { r: 'facade-ouest' }],
    },
  ],
  'le-passage-des-artistes': [
    { texte: 'projet', visuels: [{ r: 'croquis-cour' }, { r: 'maquette-2' }] },
    {
      titre: CH.dessins,
      dessins: [{ r: 'coupe-perspective' }, { r: 'plan-masse' }, { r: 'plan-rdc' }, { r: 'plan-etages' }, { r: 'facade-sud' }, { r: 'facade-nord' }, { r: 'coupe' }, { r: 'detail-axonometrie' }],
    },
    { titre: CH.experimentation, texte: 'experimentation', visuels: [{ r: 'experimentation-2' }, { duo: ['experimentation-1', 'experimentation-3'] }] },
  ],
  'entre-deux-regards': [
    { texte: 'projet', visuels: [{ r: 'perspective-exterieure' }, { r: 'perspective-cour' }] },
    { texte: 'recit', visuels: [{ r: 'perspective-escalier' }] },
    {
      titre: CH.regard,
      texte: D(
        "Faites glisser le trait sur chaque dessin : à gauche l'existant et ses démolitions, à droite le projet.",
        'Drag the line across each drawing: the existing building and its demolitions on the left, the project on the right.',
        'Trascinate la linea su ogni disegno: a sinistra lo stato di fatto con le demolizioni, a destra il progetto.',
      ),
      dessins: [
        { r: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet', titre: D('Plan RDC', 'Ground floor', 'Piano terra') },
        { r: 'c:plan-etage-existant', projet: 'c:plan-etage-projet', titre: D('Plan étage', 'Upper floor', 'Piano primo') },
        { r: 'c:facade-sud-existant', projet: 'c:facade-sud-projet', titre: D('Façade sud', 'South elevation', 'Prospetto sud') },
        { r: 'c:facade-nord-existant', projet: 'c:facade-nord-projet', titre: D('Façade nord', 'North elevation', 'Prospetto nord') },
        { r: 'c:facade-est-existant', projet: 'c:facade-est-projet', titre: D('Façade est', 'East elevation', 'Prospetto est') },
        { r: 'c:facade-ouest-existant', projet: 'c:facade-ouest-projet', titre: D('Façade ouest', 'West elevation', 'Prospetto ovest') },
        { r: 'c:coupe-aa-existant', projet: 'c:coupe-aa-projet', titre: D('Coupe AA', 'Section AA', 'Sezione AA') },
        { r: 'x:plan-masse-projet', titre: D('Plan masse', 'Site plan', 'Planimetria') },
      ],
    },
  ],
  'pilates-room': [
    {
      texte: 'projet',
      chiffres: [
        { label: D('Salle de cours', 'Studio', 'Sala corsi'), valeur: D('60 m²', '60 m²', '60 m²') },
        { label: D('Accueil', 'Reception', 'Accoglienza'), valeur: D('20 m²', '20 m²', '20 m²') },
        { label: D('Hauteur sous plafond', 'Ceiling height', 'Altezza interna'), valeur: D('2,70 m', '2.70 m', '2,70 m') },
      ],
      visuels: [{ r: 'rendu-salle' }, { duo: ['rendu-vestiaire', 'rendu-coiffeuse'] }],
    },
    { titre: CH.matieres, palette: true, visuels: [{ r: 'planche-materiaux' }] },
    { titre: CH.dessins, dessins: [{ r: 'p:plan-amenagement' }, { r: 'p:plan-electricite' }, { r: 'p:coupe-aa' }, { r: 'p:coupe-bb' }, { r: 'p:coupe-cc' }] },
  ],
  'escalier-suspendu': [
    {
      texte: 'projet',
      chiffres: [
        { label: D('Hauteur à franchir', 'Height to climb', 'Altezza da superare'), valeur: D('2 930 mm', '2,930 mm', '2.930 mm') },
        { label: D('Longueur du limon', 'Stringer length', 'Lunghezza del cosciale'), valeur: D('4 704 mm', '4,704 mm', '4.704 mm') },
        { label: D('Pente', 'Pitch', 'Pendenza'), valeur: D('38,5°', '38.5°', '38,5°') },
      ],
      visuels: [{ r: 'p:axonometrie' }],
    },
    { titre: CH.dessins, dessins: [{ r: 'p:vue-de-face' }, { r: 'p:vue-en-plan' }, { r: 'p:planche-limon-marches' }, { r: 'p:planche-garde-corps' }] },
  ],
};
