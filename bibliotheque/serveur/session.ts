import { lireEnv } from './env';

/**
 * Connexion par mot de passe unique (variable MOT_DE_PASSE chez l'hébergeur).
 * Le cookie contient une date d'expiration signée ; changer le mot de passe déconnecte tous les appareils.
 * Web Crypto : fonctionne sur Netlify, Cloudflare et en local.
 */
const NOM = 'session';
const DUREE = 365 * 24 * 3600;

const secret = () => {
  const mdp = lireEnv('MOT_DE_PASSE');
  if (!mdp) throw new Error('MOT_DE_PASSE manquant');
  return `${lireEnv('SECRET_SESSION') ?? ''}:${mdp}`;
};

const base64url = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function signer(valeur: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(valeur)));
}

/** Comparaison en durée constante. */
const egal = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export const motDePasseConfigure = () => Boolean(lireEnv('MOT_DE_PASSE'));

export async function verifierMotDePasse(saisi: string): Promise<boolean> {
  // comparaison des empreintes : même longueur, durée constante
  return egal(await signer(saisi), await signer(lireEnv('MOT_DE_PASSE') ?? ''));
}

export async function cookieSession(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + DUREE);
  return `${NOM}=${exp}.${await signer(exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DUREE}`;
}

export const cookieFin = () => `${NOM}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function estConnecte(req: Request): Promise<boolean> {
  if (!motDePasseConfigure()) return false;
  const cookies = req.headers.get('cookie') ?? '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${NOM}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || !egal(sig, await signer(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
