import type { Stockage } from './stockage';

/**
 * Données dans une base D1 de Cloudflare (gratuite, sans carte bancaire).
 * Deux tables, créées toutes seules au premier appel. Une valeur ne peut pas dépasser 2 Mo :
 * les photos sont réduites dans le navigateur avant l'envoi.
 */
interface D1 {
  prepare(sql: string): { bind(...v: unknown[]): { first<T = Record<string, unknown>>(): Promise<T | null>; run(): Promise<unknown> } };
  exec(sql: string): Promise<unknown>;
}

const MAX = 1_950_000;
let pret: Promise<unknown> | null = null;

export function stockageD1(db: D1): Stockage {
  const tables = () => (pret ??= db.exec(
    'CREATE TABLE IF NOT EXISTS donnees (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, type TEXT NOT NULL, data BLOB NOT NULL);',
  ));
  return {
    async lireBibliotheque() {
      await tables();
      const r = await db.prepare('SELECT valeur FROM donnees WHERE cle = ?').bind('bibliotheque').first<{ valeur: string }>();
      return r ? JSON.parse(r.valeur) : null;
    },
    async ecrireBibliotheque(b) {
      await tables();
      const valeur = JSON.stringify(b);
      if (valeur.length > MAX) throw new Error('Bibliothèque trop volumineuse pour une seule entrée.');
      await db.prepare('INSERT INTO donnees (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur').bind('bibliotheque', valeur).run();
    },
    async lireImage(id) {
      await tables();
      const r = await db.prepare('SELECT type, data FROM images WHERE id = ?').bind(id).first<{ type: string; data: ArrayBuffer | number[] }>();
      if (!r) return null;
      const octets = new Uint8Array(r.data as ArrayBuffer);
      return { data: octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer, type: r.type };
    },
    async ecrireImage(id, data, type) {
      await tables();
      if (data.byteLength > MAX) throw new Error('Image trop lourde (2 Mo au plus).');
      await db.prepare('INSERT INTO images (id, type, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET type = excluded.type, data = excluded.data').bind(id, type, new Uint8Array(data)).run();
    },
    async supprimerImage(id) {
      await tables();
      await db.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
    },
  };
}
