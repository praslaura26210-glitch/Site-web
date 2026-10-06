'use client';
import { useEffect, useState } from 'react';

export type Quality = { ready: boolean; reduced: boolean; lite: boolean };

/**
 * reduced : l'utilisateur a demandé « réduire les animations » -> aucune animation, tout lisible.
 * lite : mobile, machine modeste, économie de données ou pas de WebGL2 -> pas de 3D, des images.
 * Test : ajouter ?lite ou ?full à l'adresse.
 */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return { ready: false, reduced: false, lite: true };
  const q = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl2 = false;
  try {
    gl2 = !!document.createElement('canvas').getContext('webgl2');
  } catch {}
  const nav = navigator as any;
  const weak =
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    (nav.connection && nav.connection.saveData);
  const smallTouch = matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 700;
  let lite = reduced || !gl2 || !!weak || smallTouch;
  if (q.has('lite')) lite = true;
  if (q.has('full')) lite = false;
  return { ready: true, reduced, lite };
}

export function useQuality(): Quality {
  const [q, setQ] = useState<Quality>({ ready: false, reduced: false, lite: true });
  useEffect(() => setQ(detectQuality()), []);
  return q;
}
