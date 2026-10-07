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
  /** Revient à la page d'avant dans la bibliothèque (ou à `defaut` s'il n'y en a pas). */
  retour: (defaut?: string) => void;
  notifier: (message: string) => void;
  /** Adresse de la page affichée (après « #/ »). */
  route: string;
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

/** Classe de couleur d'un travail (t0…t4), selon sa place dans la liste. */
export function classeTravail(b: Bibliotheque, id: string): string {
  const i = b.categories.findIndex((c) => c.id === id);
  return `t${(i < 0 ? 0 : i) % 5}`;
}

export const nomTravail = (b: Bibliotheque, id: string) => b.categories.find((c) => c.id === id)?.nom ?? id;
