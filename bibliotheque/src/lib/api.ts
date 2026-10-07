import type { Bibliotheque, Categorie, Famille, Fiche, Image } from '../types';
import { DEMO, demoSrc } from './demo';

export class ErreurApi extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function appel<T>(chemin: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/${chemin}`, { credentials: 'same-origin', ...init });
  } catch {
    throw new ErreurApi('Pas de connexion internet.', 0);
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErreurApi(data.erreur ?? `Erreur ${r.status}`, r.status);
  return data as T;
}

const corps = (methode: string, data: unknown): RequestInit => ({
  method: methode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(data),
});

export const api = {
  etat: () => appel<{ configure: boolean; connecte: boolean }>('etat'),
  connexion: (motDePasse: string) => appel<{ ok: true }>('connexion', corps('POST', { motDePasse })),
  deconnexion: () => appel<{ ok: true }>('deconnexion', { method: 'POST' }),
  bibliotheque: () => appel<Bibliotheque>('bibliotheque'),
  enregistrer: (f: Fiche) => appel<{ fiche: Fiche; rev: number }>(`fiches/${encodeURIComponent(f.id)}`, corps('PUT', f)),
  importer: (fiches: Partial<Fiche>[]) => appel<{ fiches: Fiche[]; rev: number }>('fiches', corps('POST', fiches)),
  supprimer: (id: string) => appel<{ rev: number }>(`fiches/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  vocabulaire: (v: { familles?: Famille[]; synonymes?: string[][]; categories?: Categorie[]; renommer?: { de: string; vers: string | null } }) =>
    appel<Bibliotheque>('vocabulaire', corps('PUT', v)),
  envoyerImage: (blob: Blob) => appel<Image>('images', { method: 'POST', headers: { 'content-type': blob.type }, body: blob }),
  isbn: (isbn: string) =>
    appel<{ titre?: string; auteurs?: string[]; annee?: string; editeur?: string; pages?: string; lien?: string; image: Image | null }>(`isbn/${encodeURIComponent(isbn)}`),
  imageDistante: (url: string) => appel<Image>('image-distante', corps('POST', { url })),
  apercu: (url: string) => appel<{ titre?: string; site?: string; annee?: string; image: Image | null }>(`apercu?url=${encodeURIComponent(url)}`),
};

export const srcImage = (id: string) => (DEMO ? demoSrc(id) : `/api/images/${encodeURIComponent(id)}`);
