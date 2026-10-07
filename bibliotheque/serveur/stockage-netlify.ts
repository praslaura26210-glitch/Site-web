import { getStore } from '@netlify/blobs';
import type { Stockage } from './stockage';

/** Données dans Netlify Blobs. */
const donnees = () => getStore({ name: 'bibliotheque', consistency: 'strong' });
const images = () => getStore({ name: 'images', consistency: 'strong' });
const CLE = 'donnees';

export const stockageNetlify: Stockage = {
  async lireBibliotheque() {
    return (await donnees().get(CLE, { type: 'json' })) ?? null;
  },
  async ecrireBibliotheque(b) {
    await donnees().setJSON(CLE, b);
  },
  async lireImage(id) {
    const r = await images().getWithMetadata(id, { type: 'arrayBuffer' });
    if (!r) return null;
    return { data: r.data, type: String(r.metadata?.type ?? 'image/webp') };
  },
  async ecrireImage(id, data, type) {
    await images().set(id, data, { metadata: { type } });
  },
  async supprimerImage(id) {
    await images().delete(id);
  },
};
