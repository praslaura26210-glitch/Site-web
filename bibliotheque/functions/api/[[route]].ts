import { gerer } from '../../serveur/routes';
import { definirEnv } from '../../serveur/env';
import { definirStockage } from '../../serveur/stockage';
import { stockageD1 } from '../../serveur/stockage-d1';

/**
 * Cloudflare Pages : toutes les adresses /api/* passent ici.
 * Réglages du projet : une base D1 liée sous le nom BASE, et la variable MOT_DE_PASSE.
 */
export const onRequest = async (contexte: { request: Request; env: Record<string, any> }) => {
  definirEnv(contexte.env);
  if (!contexte.env.BASE) {
    return new Response(JSON.stringify({ erreur: 'Base D1 non reliée : dans Cloudflare, ajoute une liaison D1 nommée BASE.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
  definirStockage(stockageD1(contexte.env.BASE));
  return gerer(contexte.request);
};
