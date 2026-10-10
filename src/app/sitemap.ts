import type { MetadataRoute } from 'next';
import { LANGS } from '@/i18n';
import { ORDRE } from '@/lib/content';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/projets/', '/accrochage/', ...ORDRE.map((s) => `/projets/${s}/`), '/references/', '/a-propos/', '/contact/'];
  return paths.flatMap((p) =>
    LANGS.map((l) => ({
      url: `${SITE_URL}/${l}${p}`,
      alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${SITE_URL}/${x}${p}`])) },
    })),
  );
}
