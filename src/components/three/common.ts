'use client';
import * as THREE from 'three';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

export const COUL = {
  papier: '#F2ECE2',
  mur: '#EEE7DC',
  encre: '#2B211C',
  cuite: '#A46B57',
  ocre: '#C08A3E',
  acier: '#3B3633',
  chene: '#C9A27A',
  bois: '#D9C3A0',
  pierre: '#D8CFC0',
};

/** Sol couleur papier exacte + calque d'ombres portées : la 3D se fond dans la page. */
export function solProps(y = 0) {
  return { y };
}

/** Amortissement indépendant de la fréquence d'images. */
export const damp = (dt: number, speed = 0.0025) => 1 - Math.pow(speed, dt);

export function steel(color = COUL.acier) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.55 });
}
export function matte(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });
}
