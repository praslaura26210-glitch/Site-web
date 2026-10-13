// Les axonométries éclatées découpées en calques (content/projets/<slug>/eclatee/*.webp, fond transparent).
// x, y, w : position et largeur du calque en % du dessin ; dy : de combien il descend quand la structure est
// rassemblée (en % de la largeur du dessin) ; o : l'ordre dans lequel les pièces se séparent (0 d'abord).
// Les traits (pointillés de rappel) n'apparaissent que quand la structure est éclatée.
import type { L3 } from './sequences';

export type Calque = { nom: string; x: number; y: number; w: number; dy: number; o: number; fixe?: boolean };
export type Eclatee = { w: number; h: number; legende: L3; calques: Calque[] };

export const ECLATEES: Record<string, Eclatee> = {
  'illusion-d-envol': {
    w: 2000, h: 1861,
    legende: { fr: 'Axonométrie éclatée de la structure', en: 'Exploded axonometric view of the structure', it: 'Assonometria esplosa della struttura' },
    calques: [
      { nom: 'base', x: 5.15, y: 54.594, w: 47.4, dy: 0, o: 0, fixe: true },
      { nom: 'plancher', x: 49.4, y: 79.097, w: 42.6, dy: 0, o: 0, fixe: true },
      { nom: 'contreventement', x: 56.2, y: 53.197, w: 35.25, dy: 10, o: 0 },
      { nom: 'claire-voie', x: 61.6, y: 37.184, w: 24.8, dy: 28, o: 1 },
      { nom: 'portiques', x: 52.75, y: 14.455, w: 42.2, dy: 40, o: 2 },
      { nom: 'toiture', x: 53.15, y: 4.245, w: 42.0, dy: 49, o: 3 },
      { nom: 'traits', x: 22.4, y: 14.992, w: 69.6, dy: 0, o: 4 },
    ],
  },
  'la-ruche': {
    w: 1301, h: 2000,
    legende: { fr: 'Axonométrie éclatée de la structure', en: 'Exploded axonometric view of the structure', it: 'Assonometria esplosa della struttura' },
    calques: [
      { nom: 'bas', x: 26.595, y: 69.5, w: 67.102, dy: 0, o: 0, fixe: true },
      { nom: 'milieu', x: 1.537, y: 42.2, w: 97.079, dy: 26, o: 0 },
      { nom: 'toiture', x: 1.076, y: 0.75, w: 97.694, dy: 54, o: 1 },
      { nom: 'traits', x: 1.46, y: 6.45, w: 97.079, dy: 0, o: 2 },
    ],
  },
};
