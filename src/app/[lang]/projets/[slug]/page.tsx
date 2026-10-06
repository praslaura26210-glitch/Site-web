import { notFound } from 'next/navigation';
import { LANGS, dict, type Lang } from '@/i18n';
import { ORDRE, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { MISES } from '@/lib/sequences';
import { couverture } from '@/components/home/ProjetsGrille';
import ProjetPage from '@/components/project/ProjetPage';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => ORDRE.map((slug) => ({ lang, slug })));
}

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = getProjet(slug, lang);
  const desc = `${p.programme}${p.lieu ? `, ${p.lieu}` : ''}${p.annee ? `, ${p.annee}` : ''}. ${p.texte.slice(0, 120).replace(/\s+\S*$/, '')}…`;
  return meta(lang, `/projets/${slug}/`, `${p.titre} · Laura Pras`, desc, couverture(p).img.src);
}

export default async function Page({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  if (!(ORDRE as readonly string[]).includes(slug)) notFound();
  const t = dict(lang);
  const p = getProjet(slug, lang);
  const next = getProjet(ORDRE[(ORDRE.indexOf(slug as (typeof ORDRE)[number]) + 1) % ORDRE.length], lang);
  return <ProjetPage p={p} t={t} lang={lang} mise={MISES[slug]} next={next} total={ORDRE.length} />;
}
