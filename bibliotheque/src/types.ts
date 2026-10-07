/** Structure des données, partagée entre le site et la fonction Netlify. */

export type TypeFiche = 'livre' | 'article' | 'projet' | 'site' | 'video';
export type Statut = 'a-lire' | 'en-cours' | 'lu';

/** Une image enregistrée : servie à l'adresse /api/images/<id>. */
export interface Image {
  id: string;
  w: number;
  h: number;
  /** Photographe, source : affiché quand on agrandit l'image. */
  credit?: string;
  /** Plan, coupe, façade, axonométrie… : rangé après les photos. */
  dessin?: boolean;
}

/** Une image est un dessin si on l'a indiqué, ou si sa légende le dit (« Plan RDC », « Coupe »…). */
export const estDessin = (i: Image) =>
  i.dessin ?? /\b(plans?|coupes?|fa[cç]ades?|axono\w*|[ée]l[ée]vations?|croquis|sch[ée]mas?|dessins?|d[ée]tails?)\b/i.test(i.credit ?? '');

/** Un travail auquel une référence sert : mémoire, rapport d'études, un cours… */
export interface Categorie {
  id: string;
  nom: string;
}

export interface Citation {
  texte: string;
  page?: string;
  note?: string;
}

/** Lien « voir aussi » : enregistré dans un sens, affiché dans les deux. */
export interface Lien {
  id: string;
  note?: string;
}

/** Lien ajouté à une fiche : vidéo, conférence, plans, article… */
export interface LienWeb {
  titre: string;
  url: string;
}

export interface Fiche {
  id: string;
  type: TypeFiche;
  titre: string;
  /** Précision sous le titre, en plus petit (ex. « Centre artisanal de la communauté de Shalalá »). */
  sousTitre?: string;
  auteurs: string[];
  annee?: string;
  /** Éditeur (livre), revue (article), lieu (projet), site (site web), chaîne (vidéo). */
  editeur?: string;
  source?: string;
  images: Image[];
  credit?: string;
  /** Travaux auxquels la fiche sert (identifiants de catégories). */
  categories: string[];
  favori?: boolean;
  /** Projet cité dans un livre ou un article (identifiants des fiches). */
  citeDans?: string[];
  /** Résumé de l'ouvrage ou du projet. */
  resume?: string;
  /** Mots-clés : servent à la recherche, discrets à l'écran. */
  motsCles: string[];
  /** Mes notes : ce que j'en retiens (texte long, « ## » pour un intertitre). */
  retenu?: string;
  /** Ancien champ, n'est plus affiché. */
  lienTravail?: string;
  citations: Citation[];
  /** Liens utiles : vidéo, plans, entretien, documents. */
  liens?: LienWeb[];
  voirAussi: Lien[];
  statut: Statut;
  /** Où la trouver : chez moi, BU, PDF, dossier des favoris… */
  emplacement?: string;
  isbn?: string;
  numero?: string;
  pages?: string;
  /** Date de consultation (site web, vidéo). */
  consulte?: string;
  /** La couverture a déjà été cherchée automatiquement (trouvée ou non). */
  couvertureCherchee?: boolean;
  /** L'image a déjà été cherchée sur la page du lien (projets, articles). */
  imageCherchee?: boolean;
  creeLe: string;
  modifieLe: string;
}

export interface Groupe {
  nom: string;
  mots: string[];
}

export interface Famille {
  id: string;
  nom: string;
  groupes: Groupe[];
}

export interface Bibliotheque {
  version: 1;
  /** Augmente à chaque écriture : évite d'écraser une version plus récente. */
  rev: number;
  fiches: Fiche[];
  categories: Categorie[];
  familles: Famille[];
  /** Chaque ligne : des termes équivalents pour la recherche. */
  synonymes: string[][];
  /** Version du contenu de départ déjà intégrée. */
  departVersion?: number;
}

export const TYPES: TypeFiche[] = ['livre', 'article', 'projet', 'site', 'video'];
export const STATUTS: Statut[] = ['a-lire', 'en-cours', 'lu'];

/** Trois rayons : les livres, les articles (avec sites et vidéos), les projets. */
export type Rayon = 'livres' | 'articles' | 'projets';
export const RAYONS: Rayon[] = ['livres', 'articles', 'projets'];
export const rayonDe = (t: TypeFiche): Rayon => (t === 'livre' ? 'livres' : t === 'projet' ? 'projets' : 'articles');
