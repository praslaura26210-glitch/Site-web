import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import styles from '@/components/pages/pages.module.css';
import { PARCOURS } from '@/lib/parcours';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155), '/media/site/portrait-2000.webp');
}


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
      notes: ['Avant l’archi, j’étais dessinatrice en bâtiment.', 'Aujourd’hui : master AECC à l’ENSA Grenoble.', 'J’aime la matière, le territoire, ce qui est déjà là.', 'Archicad… et beaucoup de dessin à la main.'],
      master: 'Master AECC', parcours: 'Parcours',
      stages: 'Stages', formations: 'Formations',
      outils: 'Outils', sur5: 'sur 5',
      audela: 'Au-delà des projets',
      texteAudela: audela.texte,
    },
    en: {
      notes: ['Before architecture, I was a building draughtswoman.', 'Now: AECC master’s at ENSA Grenoble.', 'I love material, territory, what is already there.', 'Archicad… and a lot of hand drawing.'],
      master: 'AECC master’s', parcours: 'Background',
      stages: 'Internships', formations: 'Education',
      outils: 'Tools', sur5: 'out of 5',
      audela: 'Beyond the projects',
      texteAudela: 'I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.',
    },
    it: {
      notes: ['Prima dell’architettura ero disegnatrice edile.', 'Oggi: master AECC all’ENSA di Grenoble.', 'Amo la materia, il territorio, ciò che c’è già.', 'Archicad… e tanto disegno a mano.'],
      master: 'Master AECC', parcours: 'Percorso',
      stages: 'Tirocini', formations: 'Formazione',
      outils: 'Strumenti', sur5: 'su 5',
      audela: 'Oltre i progetti',
      texteAudela: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo.",
    },
  });

  // la pellicule : des dessins et des maquettes des projets, puis les photos d'« au-delà des projets »
  const vue = (slug: string, nom: string) => getProjet(slug, lang).images.find((i) => i.nom === nom)?.srcSmall;
  const pellicule = [
    '/media/site/dessin-couverture-1000.webp', vue('illusion-d-envol', 'maquette'), vue('le-passage-des-artistes', 'croquis-cour'), vue('la-ruche', 'maquette-3'),
    photo.srcSmall, vue('illusion-d-envol', 'croquis-perspective'), vue('entre-deux-regards', 'maquette'), vue('le-passage-des-artistes', 'experimentation-1'),
  ].filter((x): x is string => !!x);
  const logiciels = Object.entries(cv.logiciels_sur_5 as Record<string, number>);

  return (
    <article className={`wrap ${styles.page} ${styles.apropos}`}>
      <header className={styles.aTete}>
        <figure className={styles.aPortrait}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/portrait-2000.webp" alt="Laura Pras" width={1042} height={1469} fetchPriority="high" />
        </figure>
        <div className={styles.aTeteTxt}>
          <h1 className={styles.aNom}>Laura Pras</h1>
          {/* qui je suis, écrit à la main : chaque ligne s'écrit à son tour */}
          <ul className={styles.aMain}>
            {L.notes.map((n, i) => <li key={i} style={{ ['--l' as string]: i }}>{n}</li>)}
          </ul>
          <svg className={styles.aFleche} viewBox="0 0 120 60" aria-hidden="true"><path d="M116 8C88 4 52 14 30 40M30 40l2-14M30 40l14-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </header>

      {/* une pellicule qui défile : mes dessins, mes maquettes, ce que je photographie */}
      <div className={styles.pellicule} aria-hidden="true">
        <div className={styles.pelliculeBande}>
          {[...pellicule, ...pellicule].map((f, i) => (
            <span key={i} className={styles.pelliculeVue}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" loading="lazy" />
            </span>
          ))}
        </div>
      </div>

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

      <section className={styles.outils} aria-labelledby="outils">
        <h2 id="outils" className={styles.aH2}>{L.outils}</h2>
        <ul className={styles.logiciels}>
          {logiciels.map(([k, v]) => (
            <li key={k}>
              <span className={styles.logNom}>{k}</span>
              <span className={styles.niveau} role="img" aria-label={`${v} ${L.sur5}`}>
                {[1, 2, 3, 4, 5].map((n) => <i key={n} data-plein={n <= v || undefined} />)}
              </span>
            </li>
          ))}
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
        <figure className={`${styles.audelaPlanche} rv`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planche.srcSmall} srcSet={`${planche.srcSmall} 1000w, ${planche.src} 2000w`} sizes="(max-width: 900px) 100vw, 80vw" alt={planche.legende} width={planche.w} height={planche.h} loading="lazy" />
        </figure>
      </section>

    </article>
  );
}
