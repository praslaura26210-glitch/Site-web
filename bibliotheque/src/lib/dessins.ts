/**
 * Reconnaît les plans, coupes et façades parmi les images d'un projet :
 * un dessin est surtout blanc, presque sans couleur (traits noirs ou gris).
 * Le résultat est gardé en mémoire et sur l'appareil ; une indication donnée à la main l'emporte.
 */
import type { Image } from '../types';
import { estDessin } from '../types';

const CLE = 'dessins-detectes-v1';
const memoire: Record<string, boolean> = (() => {
  try { return JSON.parse(localStorage.getItem(CLE) ?? '{}'); } catch { return {}; }
})();
const garder = () => { try { localStorage.setItem(CLE, JSON.stringify(memoire)); } catch { /* sans stockage */ } };

export function analyser(src: string): Promise<boolean> {
  return new Promise((ok) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const n = 64;
        const c = document.createElement('canvas');
        c.width = n; c.height = n;
        const g = c.getContext('2d', { willReadFrequently: true })!;
        g.drawImage(img, 0, 0, n, n);
        const px = g.getImageData(0, 0, n, n).data;
        let clairs = 0, colores = 0, saturation = 0;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], v = px[i + 1], b = px[i + 2];
          const max = Math.max(r, v, b), min = Math.min(r, v, b);
          const s = max ? (max - min) / max : 0;
          saturation += s;
          if (max > 225 && s < 0.08) clairs++;
          if (s > 0.25 && max > 60) colores++;
        }
        const total = px.length / 4;
        ok(clairs / total > 0.45 && saturation / total < 0.09 && colores / total < 0.06);
      } catch {
        ok(false);
      }
    };
    img.onerror = () => ok(false);
    img.src = src;
  });
}

/** Dessin selon la fiche (indication ou légende), sinon selon l'analyse de l'image déjà faite. */
export const dessinConnu = (i: Image): boolean | undefined => (i.dessin !== undefined || estDessin(i) ? estDessin(i) : memoire[i.id]);

/** Analyse les images pas encore classées ; renvoie vrai si quelque chose a changé. */
export async function detecter(images: Image[], src: (id: string) => string): Promise<boolean> {
  let change = false;
  for (const i of images) {
    if (i.dessin !== undefined || estDessin(i) || i.id in memoire) continue;
    memoire[i.id] = await analyser(src(i.id));
    if (memoire[i.id]) change = true;
  }
  garder();
  return change;
}
