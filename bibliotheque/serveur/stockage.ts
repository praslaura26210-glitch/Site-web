import type { Bibliotheque } from '../src/types';

/**
 * Où sont rangées les données : un document pour toutes les fiches, une entrée par image.
 * Netlify Blobs (stockage-netlify.ts) ou base D1 de Cloudflare (stockage-d1.ts) ;
 * le point d'entrée de chaque hébergeur choisit le sien.
 */
export interface Stockage {
  lireBibliotheque(): Promise<Bibliotheque | null>;
  ecrireBibliotheque(b: Bibliotheque): Promise<void>;
  lireImage(id: string): Promise<{ data: ArrayBuffer; type: string } | null>;
  ecrireImage(id: string, data: ArrayBuffer, type: string): Promise<void>;
  supprimerImage(id: string): Promise<void>;
}

let actif: Stockage | null = null;
export const definirStockage = (s: Stockage) => { actif = s; };
const s = () => {
  if (!actif) throw new Error('Stockage non configuré');
  return actif;
};

export const lireBibliotheque = () => s().lireBibliotheque();
export const ecrireBibliotheque = (b: Bibliotheque) => s().ecrireBibliotheque(b);
export const lireImage = (id: string) => s().lireImage(id);
export const ecrireImage = (id: string, data: ArrayBuffer, type: string) => s().ecrireImage(id, data, type);
export const supprimerImage = (id: string) => s().supprimerImage(id);
