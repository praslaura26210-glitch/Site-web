// Les axonométries éclatées découpées en calques (content/projets/<slug>/eclatee/*.webp, fond transparent).
// Tout est en % de la largeur du dessin (cqw) : x, y, w placent le calque sur le dessin éclaté (tel que Laura
// l'a dessiné) ; dx, dy le décalent à son point de départ (la structure rassemblée) ; o : l'ordre dans lequel
// les pièces partent (0 d'abord). cache : invisible au départ (la pièce est déjà dessinée dans le pavillon
// assemblé, elle en sort). Les traits (pointillés de rappel) n'apparaissent qu'une fois le dessin éclaté.
// cam : au départ, on ne voit que la structure rassemblée, en grand (s : grossissement, tx/ty : décalage,
// h : hauteur du cadre) ; au clic, le cadre s'agrandit jusqu'au dessin entier (hauteur he).
import type { L3 } from './sequences';

export type Calque = { nom: string; x: number; y: number; w: number; dx: number; dy: number; o: number; cache?: boolean; fixe?: boolean };
export type Eclatee = { w: number; h: number; legende: L3; cam: { s: number; tx: number; ty: number; h: number }; calques: Calque[] };

const LEGENDE: L3 = { fr: 'Axonométrie éclatée de la structure', en: 'Exploded axonometric view of the structure', it: 'Assonometria esplosa della struttura' };

export const ECLATEES: Record<string, Eclatee> = {
  // le pavillon assemblé, à gauche ; au clic, ses pièces en sortent et vont se ranger à droite, de bas en haut
  'illusion-d-envol': {
    w: 2000, h: 1861, legende: LEGENDE,
    cam: { s: 1.5, tx: 6.73, ty: -69.47, h: 50 },
    calques: [
      { nom: 'base', x: 5.15, y: 54.594, w: 47.4, dx: 0, dy: 0, o: 0, fixe: true },
      { nom: 'plancher', x: 49.4, y: 79.097, w: 42.6, dx: -38, dy: -10.5, o: 0, cache: true },
      { nom: 'contreventement', x: 56.2, y: 53.197, w: 35.25, dx: -38, dy: -0.5, o: 1, cache: true },
      { nom: 'claire-voie', x: 61.6, y: 37.184, w: 24.8, dx: -38, dy: 17.5, o: 2, cache: true },
      { nom: 'portiques', x: 52.75, y: 14.455, w: 42.2, dx: -38, dy: 29.5, o: 3, cache: true },
      { nom: 'toiture', x: 53.15, y: 4.245, w: 42, dx: -38, dy: 38.5, o: 4, cache: true },
      { nom: 'traits', x: 22.4, y: 14.992, w: 69.6, dx: 0, dy: 0, o: 5, cache: true },
    ],
  },
  // les quatre couches collées : le bâtiment tel qu'il est ; au clic, elles se séparent, de haut en bas
  'la-ruche': {
    w: 1301, h: 2000, legende: LEGENDE,
    cam: { s: 1, tx: 0, ty: -86.2, h: 74 },
    calques: [
      { nom: 'bas', x: 26.595, y: 69.5, w: 67.102, dx: 0, dy: 0, o: 0, fixe: true },
      { nom: 'milieu', x: 1.537, y: 42.2, w: 97.079, dx: 0, dy: 29.98, o: 2 },
      { nom: 'chevrons', x: 1.537, y: 22.15, w: 97.079, dx: 0, dy: 56.11, o: 1 },
      { nom: 'bardage', x: 1.076, y: 0.75, w: 97.694, dx: 0, dy: 88.01, o: 0 },
      { nom: 'traits', x: 1.46, y: 6.45, w: 97.079, dx: 0, dy: 0, o: 3, cache: true },
    ],
  },
};
