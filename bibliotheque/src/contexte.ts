import { createContext, useContext } from 'react';
import type { Bibliotheque, Fiche } from './types';
import type { Filtres } from './lib/recherche';

export interface Contexte {
  biblio: Bibliotheque;
  remplacer: (b: Bibliotheque) => void;
  majFiche: (f: Fiche, rev?: number) => void;
  retirerFiche: (id: string, rev?: number) => void;
  filtres: Filtres;
  setFiltres: (f: Filtres | ((f: Filtres) => Filtres)) => void;
  naviguer: (route: string) => void;
  notifier: (message: string) => void;
  /** Tous les mots-clés de la liste, avec leur famille. */
  motsCles: { mot: string; famille: string; groupe: string }[];
}

export const Ctx = createContext<Contexte | null>(null);

export function useBiblio(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error('Contexte absent');
  return c;
}

export const parId = (b: Bibliotheque) => new Map(b.fiches.map((f) => [f.id, f]));

/** Liens « voir aussi » dans les deux sens. */
export function liensDe(b: Bibliotheque, id: string): { fiche: Fiche; note?: string; entrant: boolean }[] {
  const index = parId(b);
  const moi = index.get(id);
  const out: { fiche: Fiche; note?: string; entrant: boolean }[] = [];
  const vus = new Set<string>();
  for (const l of moi?.voirAussi ?? []) {
    const f = index.get(l.id);
    if (f && !vus.has(f.id)) {
      vus.add(f.id);
      out.push({ fiche: f, note: l.note, entrant: false });
    }
  }
  for (const f of b.fiches) {
    const l = f.voirAussi.find((x) => x.id === id);
    if (l && !vus.has(f.id)) {
      vus.add(f.id);
      out.push({ fiche: f, note: l.note, entrant: true });
    }
  }
  return out;
}
