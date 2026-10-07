/** Structure des données, partagée entre le site et la fonction Netlify. */

export type TypeFiche = 'livre' | 'article' | 'projet' | 'site' | 'video';
export type Statut = 'a-lire' | 'en-cours' | 'lu';

/** Une image enregistrée : servie à l'adresse /api/images/<id>. */
export interface Image {
  id: string;
  w: number;
  h: number;
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

export interface Fiche {
  id: string;
  type: TypeFiche;
  titre: string;
  auteurs: string[];
  annee?: string;
  /** Éditeur (livre), revue (article), lieu (projet), site (site web), chaîne (vidéo). */
  editeur?: string;
  source?: string;
  images: Image[];
  credit?: string;
  motsCles: string[];
  retenu?: string;
  lienTravail?: string;
  citations: Citation[];
  voirAussi: Lien[];
  statut: Statut;
  /** Où la trouver : chez moi, BU, PDF, dossier des favoris… */
  emplacement?: string;
  isbn?: string;
  numero?: string;
  pages?: string;
  /** Date de consultation (site web, vidéo). */
  consulte?: string;
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
  familles: Famille[];
  /** Chaque ligne : des termes équivalents pour la recherche. */
  synonymes: string[][];
}

export const TYPES: TypeFiche[] = ['livre', 'article', 'projet', 'site', 'video'];
export const STATUTS: Statut[] = ['a-lire', 'en-cours', 'lu'];
