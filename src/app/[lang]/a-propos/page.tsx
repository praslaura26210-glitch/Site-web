import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import styles from '@/components/pages/pages.module.css';
import { PARCOURS } from '@/lib/parcours';
import { LOGICIELS } from '@/lib/logiciels';
import Appareil from '@/components/pages/Appareil';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155), '/media/site/portrait-2000.webp');
}


/** Les niveaux, du plus haut au plus bas, dits en mots (le CV note chaque logiciel sur 5). */
const NIVEAUX: [number, { fr: string; en: string; it: string }][] = [
  [5, { fr: 'Je maîtrise', en: 'Expert', it: 'Padroneggio' }],
  [4, { fr: 'Très à l’aise', en: 'Very confident', it: 'Molto a mio agio' }],
  [3, { fr: 'À l’aise', en: 'Confident', it: 'A mio agio' }],
  [2, { fr: 'Notions', en: 'Basics', it: 'Nozioni' }],
  [1, { fr: 'Débutante', en: 'Beginner', it: 'Principiante' }],
];
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
        {/* un appareil photo instantané d'autrefois : les tirages de mon portrait en sortent, sans fin */}
        <Appareil photo="/media/site/portrait-1000.webp" />
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

      {/* outils : les logiciels rangés par niveau, dit en mots ; chacun avec son icône */}
      <section className={styles.outils} aria-labelledby="outils">
        <h2 id="outils" className={styles.aH2}>{L.outils}</h2>
        <div className={styles.niveaux}>
          {NIVEAUX.map(([n, nom]) => {
            const ls = logiciels.filter(([, v]) => v === n);
            if (!ls.length) return null;
            return (
              <div key={n} className={`${styles.niveau} rv`}>
                <h3 className={styles.niveauT}><span className={styles.niveauJauge} style={{ ['--n' as string]: n }} aria-hidden="true" />{nom[lang]}</h3>
                <ul>
                  {ls.map(([k]) => {
                    const lg = LOGICIELS[k];
                    return (
                      <li key={k}>
                        <span className={styles.icone} style={{ background: lg?.fond, color: lg?.couleur }} aria-hidden="true">
                          {lg?.trace ? <svg viewBox="0 0 24 24"><path d={lg.trace} fill="currentColor" /></svg> : <b>{lg?.sigle || k.slice(0, 2)}</b>}
                        </span>
                        {k}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
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
