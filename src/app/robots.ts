import type { MetadataRoute } from 'next';
import { PUBLIE, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // version d'aperçu : aucun moteur de recherche n'est invité à indexer le site
  if (!PUBLIE) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` };
}
