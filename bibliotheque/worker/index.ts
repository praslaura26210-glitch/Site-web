/**
 * Cloudflare Workers (formule proposée par défaut par Cloudflare) :
 * - les pages du site sont servies telles quelles (dossier dist) ;
 * - les adresses /api/* passent par le même code serveur que Netlify ;
 * - les données sont dans un « Durable Object » avec sa petite base SQLite,
 *   créé tout seul au déploiement : rien à configurer à la main.
 */
import { DurableObject } from 'cloudflare:workers';
import type { Bibliotheque } from '../src/types';
import { gerer } from '../serveur/routes';
import { definirEnv } from '../serveur/env';
import { definirStockage, type Stockage } from '../serveur/stockage';

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  COFFRE: { idFromName(nom: string): unknown; get(id: unknown): Coffre };
  MOT_DE_PASSE?: string;
}

const MAX = 1_950_000;

/** Le coffre : une seule instance, qui garde la bibliothèque et les images. */
export class Coffre extends DurableObject<Env> {
  constructor(ctx: ConstructorParameters<typeof DurableObject>[0], env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS donnees (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL)');
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, type TEXT NOT NULL, data BLOB NOT NULL)');
  }

  async lireBibliotheque(): Promise<Bibliotheque | null> {
    const r = this.ctx.storage.sql.exec<{ valeur: string }>('SELECT valeur FROM donnees WHERE cle = ?', 'bibliotheque').toArray();
    return r.length ? JSON.parse(r[0].valeur) : null;
  }

  async ecrireBibliotheque(b: Bibliotheque): Promise<void> {
    const valeur = JSON.stringify(b);
    if (valeur.length > MAX) throw new Error('Bibliothèque trop volumineuse pour une seule entrée.');
    this.ctx.storage.sql.exec('INSERT INTO donnees (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur', 'bibliotheque', valeur);
  }

  async lireImage(id: string): Promise<{ data: ArrayBuffer; type: string } | null> {
    const r = this.ctx.storage.sql.exec<{ type: string; data: ArrayBuffer }>('SELECT type, data FROM images WHERE id = ?', id).toArray();
    return r.length ? { data: r[0].data, type: r[0].type } : null;
  }

  async ecrireImage(id: string, data: ArrayBuffer, type: string): Promise<void> {
    if (data.byteLength > MAX) throw new Error('Image trop lourde (2 Mo au plus).');
    this.ctx.storage.sql.exec('INSERT INTO images (id, type, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET type = excluded.type, data = excluded.data', id, type, data);
  }

  async supprimerImage(id: string): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM images WHERE id = ?', id);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    definirEnv(env as unknown as Record<string, unknown>);
    const coffre = env.COFFRE.get(env.COFFRE.idFromName('bibliotheque'));
    const stockage: Stockage = {
      lireBibliotheque: () => coffre.lireBibliotheque(),
      ecrireBibliotheque: (b) => coffre.ecrireBibliotheque(b),
      lireImage: (id) => coffre.lireImage(id),
      ecrireImage: (id, data, type) => coffre.ecrireImage(id, data, type),
      supprimerImage: (id) => coffre.supprimerImage(id),
    };
    definirStockage(stockage);
    const reponse = await gerer(request);
    // photo reprise de claude.ai : publiée avec le site
    const m = url.pathname.match(/^\/api\/images\/([0-9a-f]{32})$/);
    if (reponse.status === 404 && m) return env.ASSETS.fetch(new Request(new URL(`/depart-images/${m[1]}.webp`, url)));
    return reponse;
  },
};
