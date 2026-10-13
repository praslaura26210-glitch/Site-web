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
  /** un texte (poème, récit, expérimentation, chiffres, palette) avec, ou non, une image à côté (cote : le côté de l'image) */
  | { t: 'texte'; k: 'poeme' | 'recit' | 'experimentation' | 'chiffres' | 'palette'; titre?: L3; r?: string; cote?: 'g' | 'd'; colonnes?: boolean }
  /** la planche des matériaux : chaque échantillon se clique, sa fiche dit où il est dans le projet (Pilates Room) */
  | { t: 'materiaux' }
  /** l'axonométrie éclatée, en calques : rassemblée, elle se sépare au clic (lib/eclatees.ts) */
  | { t: 'eclatee' }
  /** un dessin vectoriel qui se construit quand il arrive à l'écran, avec les chiffres à côté */
  | { t: 'construction'; r: string; k?: 'chiffres' }
  /** le poème strophe par strophe, chacune à côté d'un dessin (null : la strophe seule, au centre) */
  | { t: 'strophes'; r: (string | null)[] }
  /** une image d'un bord à l'autre de l'écran */
  | { t: 'plein'; r: string; pos?: string }
  /** une planche de dessins, comme une feuille de rendu : les dessins numérotés et un cartouche */
  | { t: 'feuille'; titre: L3; r: string[] }
  /** trois images : une grande, deux l'une sous l'autre */
  | { t: 'triptyque'; r: [string, string, string] }
  /** une bande de grandes photos qu'on fait défiler de côté */
  | { t: 'galerie'; r: string[] }
  /** un croquis qui se dessine trait par trait (content/projets/<slug>/<nom>-traits.json), avec une image à côté */
  | { t: 'trace'; r: string; avec?: string }
  /** les matériaux, posés à plat : un échantillon, son nom, où il est dans le projet (Pilates Room) */
  | { t: 'nuancier' }
  /** deux plans superposés, on glisse le trait de l'un à l'autre ; cadre : la boîte commune et la place de
   * chaque plan dedans (même unité que les viewBox), pour qu'ils soient à la même échelle et se superposent */
  | { t: 'superpose'; a: string; b: string; la: L3; lb: L3; titre: L3; cadre?: Cadre }
  /** des lignes d'images : dans chaque ligne, toutes à la même hauteur, et la ligne remplit la largeur
   * (sans dépasser la hauteur h, en px) */
  | { t: 'lignes'; r: string[][]; h?: number }
  /** les matériaux mélangés sur une palette ; un clic sur l'un l'ouvre en grand (Pilates Room) */
  | { t: 'palette' }
  /** des coupes l'une sous l'autre, chacune avec sa lettre */
  | { t: 'coupes'; r: string[]; lettres: string[] }
  /** l'escalier : le dessin reste à l'écran ; chaque chiffre, en défilant, éclaire la partie qu'il concerne */
  | { t: 'cotes'; r: string }
  /** une visionneuse : un grand dessin à la fois, flèches pour passer au suivant */
  | { t: 'visionneuse'; titre: L3; r: string[]; k?: 'chiffres' }
  /**
   * composition de magazine : rangs de 12 colonnes ; dans chaque rang les images sont côte à côte,
   * de largeurs différentes et décalées en hauteur (mt, en vh), sans se superposer.
   */
  | { t: 'composition'; rangs: { r: string; col: [number, number]; mt?: number }[][] }
  /** existant / projet à comparer en faisant glisser un trait ; deux par ligne si « deux » */
  | { t: 'comparer'; deux?: boolean; items: { existant: string; projet: string; titre: L3 }[] };

export type Cadre = { w: number; h: number; a: [number, number, number, number]; b: [number, number, number, number] };

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
  siteVues: D('Le site et les vues', 'Site and views', 'Il sito e le viste'),
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
  esquisse: D('Esquisse', 'Sketch', 'Schizzo'),
  poeme: D('Le poème et les dessins', 'The poem and the drawings', 'La poesia e i disegni'),
  details: D('Détails d’assemblage', 'Joint details', 'Dettagli di giunzione'),
  cour: D('La cour', 'The courtyard', 'La corte'),
  coupeMaquette: D('Coupe et maquette', 'Section and model', 'Sezione e plastico'),
  recit: D('Le récit', 'The story', 'Il racconto'),
  structure: D('Structure', 'Structure', 'Struttura'),
};

export const MISES: Record<string, Mise> = {
  'illusion-d-envol': {
    ouverture: 'maquette',
    blocs: [
      { t: 'inter', titre: T.poeme },
      { t: 'texte', k: 'poeme' },
      { t: 'lignes', r: [['croquis-perspective', 'coupe-aa'], ['plan-rdc', 'facade-sud']] },
      { t: 'inter', titre: T.structure },
      { t: 'eclatee' },
      { t: 'inter', titre: T.assemblages },
      { t: 'lignes', r: [['detail-assemblage-1', 'detail-assemblage-2'], ['detail-assemblage-3', 'detail-assemblage-4']], h: 220 },
    ],
  },
  'la-ruche': {
    ouverture: 'maquette-1',
    blocs: [
      { t: 'inter', titre: T.pente },
      { t: 'texte', k: 'poeme' },
      { t: 'lignes', r: [['coupe-aa', 'maquette-3'], ['maquette-2', 'maquette-4']] },
      { t: 'inter', titre: T.structure },
      { t: 'eclatee' },
      { t: 'inter', titre: T.dessins },
      { t: 'lignes', r: [['plan-masse', 'plan-rdc'], ['plan-r-1', 'plan-structure'], ['facade-ouest']], h: 230 },
      { t: 'inter', titre: T.maquette },
      { t: 'lignes', r: [['maquette-5']], h: 270 },
    ],
  },
  'le-passage-des-artistes': {
    ouverture: 'maquette-2',
    blocs: [
      { t: 'inter', titre: T.cour },
      { t: 'trace', r: 'croquis-cour', avec: 'plan-masse' },
      { t: 'inter', titre: T.coupeMaquette },
      { t: 'lignes', r: [['coupe-perspective', 'maquette-1', 'detail-axonometrie']] },
      { t: 'inter', titre: T.dessins },
      { t: 'lignes', r: [['plan-rdc', 'plan-etages', 'facade-nord'], ['facade-sud', 'coupe']], h: 250 },
      { t: 'inter', titre: T.experimentation },
      { t: 'texte', k: 'experimentation' },
      { t: 'lignes', r: [['experimentation-1', 'experimentation-2', 'experimentation-3']] },
    ],
  },
  'entre-deux-regards': {
    ouverture: 'maquette',
    pos: '50% 60%',
    blocs: [
      { t: 'inter', titre: T.siteVues },
      { t: 'lignes', r: [['x:plan-masse-projet'], ['perspective-exterieure', 'perspective-cour', 'perspective-escalier']], h: 300 },
      { t: 'inter', titre: T.recit },
      { t: 'texte', k: 'recit' },
      { t: 'inter', titre: T.regard, note: T.glisser },
      {
        t: 'comparer', deux: true, items: [
          { existant: 'c:plan-rdc-existant', projet: 'c:plan-rdc-projet', titre: D('Plan RDC', 'Ground floor', 'Piano terra') },
          { existant: 'c:plan-etage-existant', projet: 'c:plan-etage-projet', titre: D('Plan étage', 'Upper floor', 'Piano primo') },
        ],
      },
      {
        t: 'comparer', deux: true, items: [
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
      { t: 'lignes', r: [['rendu-salle', 'rendu-vestiaire', 'rendu-coiffeuse']] },
      { t: 'inter', titre: T.plans },
      // les deux plans recalés l'un sur l'autre (relevé sur les murs) : même échelle, l'aménagement 7 pt plus à droite, l'électricité 12 pt plus bas
      { t: 'superpose', a: 'p:plan-amenagement', b: 'p:plan-electricite', la: D('Aménagement', 'Layout', 'Arredo'), lb: D('Électricité', 'Electrical', 'Impianto elettrico'), titre: D('Plan d’aménagement et plan d’électricité', 'Layout plan and electrical plan', 'Pianta dell’arredo e pianta elettrica'), cadre: { w: 443.5, h: 307, a: [7, 0, 436.5, 307], b: [0, 12, 443.5, 270.5] } },
      { t: 'inter', titre: T.matieres },
      { t: 'palette' },
      { t: 'inter', titre: T.coupes },
      { t: 'lignes', r: [['p:coupe-aa', 'p:coupe-bb', 'p:coupe-cc']] },
    ],
  },
  'escalier-suspendu': {
    ouverture: 'rendu',
    blocs: [
      { t: 'inter', titre: T.conception },
      { t: 'cotes', r: 'p:axonometrie' },
      { t: 'inter', titre: T.techniques },
      { t: 'lignes', r: [['p:vue-de-face', 'p:vue-en-plan'], ['p:planche-limon-marches', 'p:planche-garde-corps']], h: 260 },
    ],
  },
};
