import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import styles from '@/components/pages/pages.module.css';
import { PARCOURS } from '@/lib/parcours';
import { LOGICIELS } from '@/lib/logiciels';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155), '/media/site/portrait-2000.webp');
}


/** La bande du photomaton : la même photo, imprimée dix fois (la bande est doublée pour boucler sans fin). */
const CASES = 10;
/** La planche « dessins, photos, bricolage » découpée en morceaux, pour qu'ils bougent chacun un peu. */
const MORCEAUX = [[1, 79.25, 1.55, 19.95], [2, 2.6, 3.39, 43.5], [3, 51.1, 4.03, 28.55], [4, 79.85, 31.66, 13.3], [5, 44.95, 58.23, 16.6], [6, 61.4, 58.94, 19.85], [7, 82.1, 66.86, 15.35]];

export default async function APropos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  const audela = getProjet('au-dela-des-projets', lang);
  const img = (n: string) => audela.images.find((i) => i.nom === n)!;
  const photo = img('photo');
  const planche = img('planche-dessins-photos-bricolage');
  const L = tr(lang, {
    fr: {
      statut: 'Étudiante en master AECC · ENSA Grenoble',
      master: 'Master AECC', parcours: 'Parcours',
      stages: 'Stages', formations: 'Formations',
      outils: 'Outils',
      audela: 'Au-delà des projets',
      texteAudela: audela.texte,
    },
    en: {
      statut: 'AECC master’s student · ENSA Grenoble',
      master: 'AECC master’s', parcours: 'Background',
      stages: 'Internships', formations: 'Education',
      outils: 'Tools',
      audela: 'Beyond the projects',
      texteAudela: 'I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.',
    },
    it: {
      statut: 'Studentessa del master AECC · ENSA Grenoble',
      master: 'Master AECC', parcours: 'Percorso',
      stages: 'Tirocini', formations: 'Formazione',
      outils: 'Strumenti',
      audela: 'Oltre i progetti',
      texteAudela: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo.",
    },
  });

  const logiciels = Object.entries(cv.logiciels_sur_5 as Record<string, number>);

  return (
    <article className={`wrap ${styles.page} ${styles.apropos}`}>
      {/* qui je suis : un photomaton ; la bande de photos sort de la machine, mon texte à côté */}
      <header className={styles.pm}>
        {/* une vieille cabine photo : façade émaillée, enseigne, fenêtre chromée d'où sort la bande, monnayeur, bac */}
        <div className={styles.pmMachine} aria-hidden="true">
          <span className={styles.pmEnseigne}><span>Photos</span></span>
          <span className={styles.pmLampe} />
          <div className={styles.pmFenetre}>
            <span className={styles.pmFente} />
            <div className={styles.pmSortie}>
              {/* la bande défile toute seule et sans fin : deux fois les mêmes cases, pour que la boucle ne se voie pas */}
              <div className={styles.pmBande}>
                {Array.from({ length: CASES * 2 }, (_, i) => (
                  <span key={i} className={styles.pmVue}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/media/site/portrait-1000.webp" alt="" />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className={styles.pmMonnaie}><i /><b>4 poses</b></span>
          <span className={styles.pmBac} />
          {[0, 1, 2, 3].map((k) => <span key={k} className={styles.pmRivet} data-k={k} />)}
        </div>
        <div className={styles.pmTexte}>
          <h1 className={styles.pmNom}>Laura Pras</h1>
          <p className="eyebrow">{L.statut}</p>
          {(cv.presentation[lang] as string).split(/\n+/).map((x, j) => <p key={j} className={styles.pmP}>{x}</p>)}
        </div>
      </header>

      <section className={styles.aMaster} aria-labelledby="master">
        <div>
          <p className="eyebrow">{L.master}</p>
          <h2 id="master" className={styles.aMasterT}>Architecture, Environnement et Cultures Constructives</h2>
        </div>
        <p className={`${styles.aMasterX} rv`}>{cv.master_aecc_texte[lang]}</p>
      </section>

      <section className={styles.parcours} aria-labelledby="parcours">
        <h2 id="parcours" className={styles.aH2}>{L.parcours}</h2>
        <div className={styles.deuxCol}>
          {(['f', 's'] as const).map((type) => (
            <div key={type} className={styles.col} data-type={type}>
              <h3 className={styles.colT}>{type === 'f' ? L.formations : L.stages}</h3>
              <ol>
                {PARCOURS.filter((e) => e.type === type).map((e) => (
                  <li key={e.cle} className="rv">
                    <span className={styles.pDate}>{e.date[lang]}</span>
                    <span className={styles.pTitre}>{e.titre[lang]}</span>
                    <span className={styles.pLieu}>{e.lieu}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* outils : l'icône de chaque logiciel, son nom, le niveau en cinq points */}
      <section className={styles.outils} aria-labelledby="outils">
        <h2 id="outils" className={styles.aH2}>{L.outils}</h2>
        <ul className={styles.tuiles}>
          {logiciels.sort((a, b) => b[1] - a[1]).map(([k, n]) => {
            const lg = LOGICIELS[k];
            return (
              <li key={k} className={`${styles.tuile} rv`} data-n={n}>
                <span className={styles.icone} style={{ background: lg?.fond, color: lg?.couleur }} aria-hidden="true">
                  {lg?.trace ? <svg viewBox="0 0 24 24"><path d={lg.trace} fill="currentColor" /></svg> : <b>{lg?.sigle || k.slice(0, 2)}</b>}
                </span>
                <span className={styles.tuileNom}>{k}</span>
                <span className={styles.tuilePoints} aria-label={`${n} / 5`}>{[1, 2, 3, 4, 5].map((j) => <i key={j} data-plein={j <= n || undefined} />)}</span>
              </li>
            );
          })}
        </ul>
      </section>


      <section className={styles.audela} aria-labelledby="audela">
        <figure className={`${styles.audelaPhoto} rv`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.srcSmall} srcSet={`${photo.srcSmall} 1000w, ${photo.src} 2000w`} sizes="(max-width: 900px) 100vw, 35vw" alt={photo.legende} width={photo.w} height={photo.h} loading="lazy" />
        </figure>
        <div className={`${styles.audelaTxt} rv`}>
          <h2 id="audela" className={styles.aH2}>{L.audela}</h2>
          <p>{L.texteAudela}</p>
        </div>
        {/* la planche : chaque dessin, chaque photo bouge à peine, chacun à son rythme */}
        <figure className={`${styles.audelaPlanche} ${styles.planche} rv`} aria-label={planche.legende}>
          {MORCEAUX.map(([n, x, y, w], i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={`/media/site/planche/morceau-${n}.webp`} alt="" loading="lazy" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, ['--i' as string]: i }} />
          ))}
        </figure>
      </section>

    </article>
  );
}
