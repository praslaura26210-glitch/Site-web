import { getStore } from '@netlify/blobs';
import type { Bibliotheque } from '../src/types';

/** Données dans Netlify Blobs : un document pour toutes les fiches, une entrée par image. */
const donnees = () => getStore({ name: 'bibliotheque', consistency: 'strong' });
const images = () => getStore({ name: 'images', consistency: 'strong' });

const CLE = 'donnees';

export async function lireBibliotheque(): Promise<Bibliotheque | null> {
  return (await donnees().get(CLE, { type: 'json' })) ?? null;
}

export async function ecrireBibliotheque(b: Bibliotheque): Promise<void> {
  await donnees().setJSON(CLE, b);
}

export async function lireImage(id: string): Promise<{ data: ArrayBuffer; type: string } | null> {
  const r = await images().getWithMetadata(id, { type: 'arrayBuffer' });
  if (!r) return null;
  return { data: r.data, type: String(r.metadata?.type ?? 'image/webp') };
}

export async function ecrireImage(id: string, data: ArrayBuffer, type: string): Promise<void> {
  await images().set(id, data, { metadata: { type } });
}

export async function supprimerImage(id: string): Promise<void> {
  await images().delete(id);
}
