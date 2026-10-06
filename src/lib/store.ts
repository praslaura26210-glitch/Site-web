'use client';
// Petit état partagé entre le DOM et la scène 3D, sans dépendance.
// `state` déclenche un rendu React ; `live` est lu à chaque image par la 3D (pas de rendu React).
import { useSyncExternalStore } from 'react';

export type Scene = 'none' | 'intro' | 'terrain' | 'index' | 'building' | 'escalier' | 'envol' | 'ruche';

export type Calques = { structure: boolean; demolition: boolean; usages: boolean; lumiere: boolean };

type State = {
  scene: Scene;
  introDone: boolean;
  stageVisible: boolean;
  calques: Calques;
  coupe: boolean; // plan de coupe actif
};

let state: State = {
  scene: 'none',
  introDone: false,
  stageVisible: false,
  calques: { structure: true, demolition: true, usages: false, lumiere: false },
  coupe: false,
};

const listeners = new Set<() => void>();

export function setState(p: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof p === 'function' ? p(state) : p;
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sel(state),
    () => sel(state),
  );
}

/** Valeurs continues lues par la 3D à chaque image. */
export const live = {
  pointer: { x: 0, y: 0 }, // -1..1
  intro: 0, // 0..1 progression de l'intro
  rise: 0, // 0..1 montée des murs
  etat: 0, // 0 = existant, 1 = projet
  cut: 0.5, // 0..1 position du plan de coupe le long du bâtiment
  orbit: 0, // 0..1 rotation de caméra pilotée par le scroll
  shot: 'axo' as 'axo' | 'plan' | 'coupe' | 'lumiere',
  hover: '' as string, // projet survolé dans l'index
  focus: '' as string, // projet vers lequel la caméra s'envole
  labels: {} as Record<string, HTMLElement | null>, // étiquettes DOM positionnées par la 3D
  invalidate: () => {},
};
