import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import ProjetsGrille, { couverture } from '@/components/home/ProjetsGrille';
import ProjetsIndex from '@/components/home/ProjetsIndex';
import Frise from '@/components/home/Frise';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

const ICONES: Record<string, React.ReactNode> = {
  sommaire: <svg viewBox="0 0 16 12" width="15" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><path d="M0 1h16M0 6h16M0 11h16" /></svg>,
  planches: <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x=".5" y=".5" width="6" height="6" /><rect x="9.5" y=".5" width="6" height="6" /><rect x=".5" y="9.5" width="6" height="6" /><rect x="9.5" y="9.5" width="6" height="6" /></svg>,
  frise: <svg viewBox="0 0 18 12" width="16" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><path d="M0 6h18" /><circle cx="3" cy="6" r="2" fill="var(--fond)" /><circle cx="9" cy="6" r="2" fill="var(--fond)" /><circle cx="15" cy="6" r="2" fill="var(--fond)" /></svg>,
};

export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const lignes = projets.map((p) => {
    const { img, pos } = couverture(p);
    return { slug: p.slug, titre: p.titre, programme: p.programme, annee: p.annee, img: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos } };
  });
  const vues = [['sommaire', t.xp.sommaire], ['planches', t.xp.planches], ['frise', t.xp.frise]] as const;
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
        <p className={styles.headLead}>{t.home.approach}</p>
      </header>
      <div className="xp-vues" data-vues data-vue="sommaire">
        <div className="xp-vues-choix" role="group" aria-label={t.xp.vueLabel}>
          {vues.map(([k, label]) => (
            <button key={k} type="button" data-vue-btn={k} aria-pressed={k === 'sommaire'}>{ICONES[k]}{label}</button>
          ))}
          <button type="button" data-xp="visite" style={{ marginLeft: 'auto', color: 'var(--accent-f)' }}>{t.xp.visite} <span aria-hidden="true">→</span></button>
        </div>
        <div data-vue-panneau="sommaire"><ProjetsIndex lignes={lignes} lang={lang} voir={t.home.voir} /></div>
        <div data-vue-panneau="planches"><ProjetsGrille projets={projets} lang={lang} headingLevel={2} /></div>
        <div data-vue-panneau="frise"><Frise projets={projets} lang={lang} labels={{ precedent: t.xp.precedent, suivant: t.xp.suivant }} /></div>
      </div>
    </div>
  );
}
