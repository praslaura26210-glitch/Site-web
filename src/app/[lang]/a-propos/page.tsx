import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import styles from '@/components/pages/pages.module.css';
import { PARCOURS } from '@/lib/parcours';
import { getReferences } from '@/lib/references';

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
      lignes: ['Avant l’archi, j’étais dessinatrice en bâtiment :', 'Archicad, permis de construire, escaliers, mobilier.', 'Aujourd’hui, je suis en master AECC à l’ENSA Grenoble.', 'Ce qui me retient : la matière, le territoire,', 'et ce qui est déjà là, jusqu’aux ruines.', 'Je dessine beaucoup à la main.', 'Je cherche un stage en agence.'],
      niveaux: { 2: 'Notions', 3: 'Bonnes bases', 4: 'Utilisation régulière', 5: 'Maîtrise' } as Record<number, string>, references: 'Références',
      master: 'Master AECC', parcours: 'Parcours',
      stages: 'Stages', formations: 'Formations',
      outils: 'Outils',
      audela: 'Au-delà des projets',
      texteAudela: audela.texte,
    },
    en: {
      lignes: ['Before architecture, I was a building draughtswoman:', 'Archicad, permit applications, staircases, furniture.', 'Now I’m doing the AECC master’s at ENSA Grenoble.', 'What holds me: material, territory,', 'and what is already there, down to ruins.', 'I draw a lot by hand.', 'I’m looking for an internship in a practice.'],
      niveaux: { 2: 'Basics', 3: 'Good grounding', 4: 'Regular use', 5: 'Expert' } as Record<number, string>, references: 'References',
      master: 'AECC master’s', parcours: 'Background',
      stages: 'Internships', formations: 'Education',
      outils: 'Tools',
      audela: 'Beyond the projects',
      texteAudela: 'I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.',
    },
    it: {
      lignes: ['Prima dell’architettura ero disegnatrice edile:', 'Archicad, pratiche edilizie, scale, arredi.', 'Oggi frequento il master AECC all’ENSA di Grenoble.', 'Ciò che mi trattiene: la materia, il territorio,', 'e ciò che c’è già, fino alle rovine.', 'Disegno molto a mano.', 'Cerco un tirocinio in uno studio.'],
      niveaux: { 2: 'Nozioni', 3: 'Buone basi', 4: 'Uso regolare', 5: 'Padronanza' } as Record<number, string>, references: 'Riferimenti',
      master: 'Master AECC', parcours: 'Percorso',
      stages: 'Tirocini', formations: 'Formazione',
      outils: 'Strumenti',
      audela: 'Oltre i progetti',
      texteAudela: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo.",
    },
  });

  const refs = getReferences(lang);
  const logiciels = Object.entries(cv.logiciels_sur_5 as Record<string, number>);

  return (
    <article className={`wrap ${styles.page} ${styles.apropos}`}>
      {/* qui je suis : une feuille écrite à la main, avec ma photo collée au milieu ; les lignes s'écrivent l'une après l'autre */}
      <header className={styles.lettre}>
        <h1 className={styles.lettreNom}>Laura Pras</h1>
        <ul className={styles.lettreLignes}>
          {L.lignes.slice(0, 3).map((n, i) => <li key={i} style={{ ['--l' as string]: i }}>{n}</li>)}
        </ul>
        <figure className={styles.lettrePhoto}>
          <span className={styles.scotch} aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/portrait-1000.webp" alt="Laura Pras" width={1042} height={1469} fetchPriority="high" />
        </figure>
        <ul className={styles.lettreLignes}>
          {L.lignes.slice(3).map((n, i) => <li key={i} style={{ ['--l' as string]: i + 3 }}>{n}</li>)}
        </ul>
        <p className={styles.lettreSigne} style={{ ['--l' as string]: L.lignes.length }}>Laura</p>
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

      {/* outils : comme une ligne de cote, des notions à la maîtrise ; au-dessus de chaque cote, les logiciels */}
      <section className={styles.outils} aria-labelledby="outils">
        <h2 id="outils" className={styles.aH2}>{L.outils}</h2>
        <div className={styles.cote}>
          {[2, 3, 4, 5].map((n) => (
            <div key={n} className={styles.coteCol} style={{ ['--n' as string]: n }}>
              <ul className={styles.coteOutils}>
                {logiciels.filter(([, v]) => v === n).map(([k]) => <li key={k} className="rv">{k}</li>)}
              </ul>
              <span className={styles.coteNiv}>{L.niveaux[n]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* références : des projets qui m'ont marquée, en images ; le nom au survol */}
      <section className={styles.refs} aria-labelledby="references-t" id="references">
        <h2 id="references-t" className={styles.aH2}>{L.references}</h2>
        <ul className={styles.refsGrille}>
          {refs.map((x, i) => (
            <li key={x.id} className="rv" style={{ ['--i' as string]: i }}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/site/inspirations/${x.id}.webp`} alt={x.titre} width={x.w} height={x.h} loading="lazy" />
                <figcaption><b>{x.titre}</b>{[x.auteur, x.lieu].filter(Boolean).join(' · ')}</figcaption>
              </figure>
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
