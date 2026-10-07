import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Connexion par mot de passe unique (variable MOT_DE_PASSE dans Netlify).
 * Le cookie contient une date d'expiration signée ; changer le mot de passe déconnecte tous les appareils.
 */
const NOM = 'session';
const DUREE = 365 * 24 * 3600;

const secret = () => {
  const mdp = process.env.MOT_DE_PASSE;
  if (!mdp) throw new Error('MOT_DE_PASSE manquant');
  return `${process.env.SECRET_SESSION ?? ''}:${mdp}`;
};

const signer = (valeur: string) => createHmac('sha256', secret()).update(valeur).digest('base64url');

const egal = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const motDePasseConfigure = () => Boolean(process.env.MOT_DE_PASSE);

export function verifierMotDePasse(saisi: string): boolean {
  const mdp = process.env.MOT_DE_PASSE ?? '';
  // comparaison des empreintes : même longueur, durée constante
  return egal(signer(saisi), signer(mdp));
}

export function cookieSession(): string {
  const exp = String(Math.floor(Date.now() / 1000) + DUREE);
  return `${NOM}=${exp}.${signer(exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DUREE}`;
}

export const cookieFin = () => `${NOM}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function estConnecte(req: Request): boolean {
  if (!motDePasseConfigure()) return false;
  const cookies = req.headers.get('cookie') ?? '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${NOM}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || !egal(sig, signer(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
