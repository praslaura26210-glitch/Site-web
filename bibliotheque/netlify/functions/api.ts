import { gerer } from '../../serveur/routes';

/** Toutes les adresses /api/* passent par cette fonction. */
export default gerer;

export const config = { path: '/api/*' };
