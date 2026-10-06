import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/components/project/Shell';
import Reveal from '@/components/project/Reveal';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155));
}

export default async function APropos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  const audela = getProjet('au-dela-des-projets', lang);
  const img = (n: string) => audela.images.find((i) => i.nom === n)!;
  const L = tr(lang, {
    fr: { parcours: 'Parcours', formation: 'Formation', stages: 'Stages', logiciels: 'Logiciels', savoir: 'Savoir-faire', master: 'Le master AECC', recherche: 'Recherche', audela: 'Au-delà des projets', cv: 'Télécharger mon CV (PDF)', sur5: 'sur 5', savoirs: ['Dessin à la main', 'Dossiers de permis de construire', "Plans d'escalier", 'Dessin de mobilier'], encours: 'en cours' },
    en: { parcours: 'Background', formation: 'Education', stages: 'Internships', logiciels: 'Software', savoir: 'Skills', master: 'The AECC master’s', recherche: 'Research', audela: 'Beyond the projects', cv: 'Download my CV (PDF)', sur5: 'out of 5', savoirs: ['Hand drawing', 'Building permit applications', 'Staircase drawings', 'Furniture design'], encours: 'in progress' },
    it: { parcours: 'Percorso', formation: 'Formazione', stages: 'Tirocini', logiciels: 'Software', savoir: 'Competenze', master: 'Il master AECC', recherche: 'Ricerca', audela: 'Oltre i progetti', cv: 'Scarica il mio CV (PDF)', sur5: 'su 5', savoirs: ['Disegno a mano', 'Pratiche per il permesso di costruire', 'Disegni di scale', 'Disegno di arredi'], encours: 'in corso' },
  });
  const formations = [...cv.formations].reverse();
  const portrait = { src: '/media/site/portrait-1000.webp' };
  return (
    <article className={`wrap ${styles.page}`}>
      <div className={styles.aboutHead}>
        <div>
          <h1 className={styles.h1}>{t.meta.aproposTitle}</h1>
          <p className="lead" style={{ maxWidth: '30ch' }}>{t.home.role}</p>
          <p className={styles.aboutText}>{cv.presentation[lang]}</p>
          <a className={styles.cvBtn} href="/cv-laura-pras.pdf" download>{L.cv} ↓</a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.portrait} src={portrait.src} alt="Laura Pras" width={709} height={1000} />
      </div>

      <section className={styles.block}>
        <h2>{L.master}</h2>
        <div className="prose"><p>{cv.master_aecc_texte[lang]}</p></div>
      </section>
      <section className={styles.block}>
        <h2>{L.recherche}</h2>
        <div className="prose"><p>{cv.recherche_texte[lang]}</p></div>
      </section>

      <section className={styles.block}>
        <h2>{L.parcours}</h2>
        <div className={styles.cols2}>
          <div>
            <p className="eyebrow">{L.formation}</p>
            <ol className={styles.timeline}>
              {formations.map((f: any) => (
                <li key={f.intitule}><span className={styles.tlY}>{f.annee === 'en cours' ? L.encours : f.annee}</span><span><b>{f.intitule}</b><small>{f.lieu}</small></span></li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow">{L.stages}</p>
            <ol className={styles.timeline}>
              {cv.stages.map((s: any) => (
                <li key={s.structure + s.date}><span className={styles.tlY}>{s.date}</span><span><b>{s.structure}</b><small>{s.intitule}, {s.lieu}</small></span></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <h2>{L.logiciels} · {L.savoir}</h2>
        <div className={styles.cols2}>
          <ul className={styles.skills}>
            {Object.entries(cv.logiciels_sur_5 as Record<string, number>).map(([k, v]) => (
              <li key={k}><span>{k}</span><span className={styles.dots} aria-label={`${v} ${L.sur5}`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} data-on={i <= v || undefined} />)}</span></li>
            ))}
          </ul>
          <ul className={styles.savoirs}>{L.savoirs.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </section>

      <section className={styles.block}>
        <h2>{L.audela}</h2>
        <div className={styles.cols2}>
          <div className="prose"><p>{tr(lang, { fr: audela.texte, en: "I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.", it: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo." })}</p></div>
          <Reveal src={img('photo').src} srcSmall={img('photo').srcSmall} alt={img('photo').legende} w={img('photo').w} h={img('photo').h} />
        </div>
        <div style={{ marginTop: 32 }}>
          <Reveal src={img('planche-dessins-photos-bricolage').src} srcSmall={img('planche-dessins-photos-bricolage').srcSmall} alt={img('planche-dessins-photos-bricolage').legende} w={img('planche-dessins-photos-bricolage').w} h={img('planche-dessins-photos-bricolage').h} />
        </div>
        <p style={{ marginTop: 32 }}><Link className={styles.cvBtn} href={`/${lang}/contact/`}>{t.nav.contact} →</Link></p>
      </section>
    </article>
  );
}
