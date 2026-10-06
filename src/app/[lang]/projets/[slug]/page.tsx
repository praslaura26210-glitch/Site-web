import { notFound } from 'next/navigation';
import { LANGS, dict, type Lang } from '@/i18n';
import { ORDRE, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import EntreDeuxRegards from '@/components/project/EntreDeuxRegards';
import GenericProject from '@/components/project/GenericProject';
import PassageArtistes from '@/components/project/PassageArtistes';
import PilatesRoom from '@/components/project/PilatesRoom';
import EscalierSuspendu from '@/components/project/EscalierSuspendu';
import LaRuche from '@/components/project/LaRuche';
import IllusionEnvol from '@/components/project/IllusionEnvol';

const PAGES = {
  'entre-deux-regards': EntreDeuxRegards,
  'le-passage-des-artistes': PassageArtistes,
  'pilates-room': PilatesRoom,
  'escalier-suspendu': EscalierSuspendu,
  'la-ruche': LaRuche,
  'illusion-d-envol': IllusionEnvol,
} as const;

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => ORDRE.map((slug) => ({ lang, slug })));
}

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = getProjet(slug, lang);
  const desc = `${p.programme}${p.lieu ? `, ${p.lieu}` : ''}${p.annee ? `, ${p.annee}` : ''}. ${p.texte.slice(0, 120).replace(/\s+\S*$/, '')}…`;
  return meta(lang, `/projets/${slug}/`, `${p.titre} · Laura Pras`, desc, p.images[0]?.src);
}

export default async function ProjetPage({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  if (!(ORDRE as readonly string[]).includes(slug)) notFound();
  const t = dict(lang);
  const p = getProjet(slug, lang);
  const next = getProjet(ORDRE[(ORDRE.indexOf(slug as any) + 1) % ORDRE.length], lang);
  const Page = PAGES[slug as keyof typeof PAGES] || GenericProject;
  return <Page p={p} t={t} lang={lang} next={next} />;
}
