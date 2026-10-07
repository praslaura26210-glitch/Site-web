/**
 * Variables d'environnement (MOT_DE_PASSE…) : sur Cloudflare elles arrivent avec chaque requête,
 * sur Netlify et en local elles sont dans process.env.
 */
let variables: Record<string, unknown> = {};

export const definirEnv = (env: Record<string, unknown>) => { variables = env; };

export function lireEnv(cle: string): string | undefined {
  const v = variables[cle];
  if (typeof v === 'string') return v;
  return typeof process !== 'undefined' ? process.env?.[cle] : undefined;
}
