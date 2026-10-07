import { gerer } from '../../serveur/routes';
import { definirStockage } from '../../serveur/stockage';
import { stockageNetlify } from '../../serveur/stockage-netlify';

definirStockage(stockageNetlify);

/** Toutes les adresses /api/* passent par cette fonction. */
export default gerer;

export const config = { path: '/api/*' };
