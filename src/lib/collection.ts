import { ORDRE, type Projet } from './content';

/**
 * La collection : les projets rangés dans l'ordre des années (à année égale, dans l'ordre du book).
 * Le rang donne au livre son numéro (N° 01, 02…) et sa couleur de toile : tout le site suit cet ordre.
 */
export function rangeCollection(projets: Projet[]) {
  const o = ORDRE as readonly string[];
  return [...projets].sort((a, b) => Number(a.annee || 0) - Number(b.annee || 0) || o.indexOf(a.slug) - o.indexOf(b.slug));
}

export const numeroCollection = (k: number) => String(k + 1).padStart(2, '0');
