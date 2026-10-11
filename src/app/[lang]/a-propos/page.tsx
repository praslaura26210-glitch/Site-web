import fs from 'node:fs';
import path from 'node:path';
import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { CV_HREF } from '@/components/chrome/liens';
import Anime from '@/components/pages/Anime';
import styles from '@/components/pages/pages.module.css';
import { PARCOURS } from '@/lib/parcours';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155), '/media/site/portrait-2000.webp');
}

/** Niveaux des logiciels (sur 5, notés par Laura dans son CV), du plus haut au plus bas. */
const NIVEAUX = [5, 4, 3, 2] as const;
/** Années de la frise du parcours. */
const ANS = [...new Set(PARCOURS.map((e) => Math.floor(e.cle)))].sort((a, b) => a - b);

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
      statut: "Étudiante en master AECC à l'École nationale supérieure d'architecture de Grenoble.",
      avant: "Avant l'école d'architecture, j'ai été dessinatrice en bâtiment. Je dessine sur Archicad comme à la main, je monte des dossiers de permis de construire, je dessine des escaliers et du mobilier. J'ai travaillé en agence d'architecture, en architecture intérieure et sur un chantier.",
      master: 'Master AECC', parcours: 'Parcours', s1: 'Stage', f1: 'Formation',
      anime: "Ce qui m'anime", animeIntro: 'Quelques projets qui m’ont marquée. Cliquez sur une image pour l’ouvrir.',
      mots: [['Le territoire', "une architecture liée au lieu qui l'accueille"], ['La matière', 'la pierre, le bois, la terre, ce qu’ils permettent'], ['Les sens', "le toucher, l'odeur, la lumière"], ["L'existant", "le dialogue avec ce qui est là, jusqu'aux ruines"]],
      stages: 'Stages', formations: 'Formations',
      outils: 'Outils', niveaux: { 5: 'Maîtrise', 4: 'Utilisation régulière', 3: 'Bonnes bases', 2: 'Notions' } as Record<number, string>, main: 'À la main',
      savoirs: ['Dessin à la main', 'Dossiers de permis de construire', "Plans d'escalier", 'Dessin de mobilier'],
      audela: 'Au-delà des projets', cv: 'Télécharger mon CV',
      fiche: { fermer: 'Fermer', ouvrir: 'Voir la fiche', auteur: 'Conception', lieu: 'Lieu', annee: 'Année', visite: "Vu lors des visites de l'ENSA Grenoble" },
      texteAudela: audela.texte,
    },
    en: {
      statut: "Master's student (AECC) at the École nationale supérieure d'architecture de Grenoble.",
      avant: 'Before architecture school, I worked as a building draughtswoman. I draw in Archicad as well as by hand, I put together building permit applications, and I design staircases and furniture. I have worked in an architecture practice, in interior architecture and on a building site.',
      master: 'AECC master’s', parcours: 'Background', s1: 'Internship', f1: 'Education',
      anime: 'What drives me', animeIntro: 'A few projects that left their mark on me. Click an image to open it.',
      mots: [['Territory', 'architecture tied to the place that receives it'], ['Material', 'stone, timber, earth, and what they make possible'], ['The senses', 'touch, smell, light'], ['What exists', 'a dialogue with what is already there, down to ruins']],
      stages: 'Internships', formations: 'Education',
      outils: 'Tools', niveaux: { 5: 'Expert', 4: 'Regular use', 3: 'Good grounding', 2: 'Basics' } as Record<number, string>, main: 'By hand',
      savoirs: ['Hand drawing', 'Building permit applications', 'Staircase drawings', 'Furniture design'],
      audela: 'Beyond the projects', cv: 'Download my CV',
      fiche: { fermer: 'Close', ouvrir: 'Open', auteur: 'Design', lieu: 'Place', annee: 'Year', visite: 'Seen on ENSA Grenoble study visits' },
      texteAudela: 'I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.',
    },
    it: {
      statut: "Studentessa del master AECC all'École nationale supérieure d'architecture de Grenoble.",
      avant: "Prima della scuola di architettura sono stata disegnatrice edile. Disegno con Archicad e a mano, preparo pratiche per il permesso di costruire, progetto scale e arredi. Ho lavorato in uno studio di architettura, nell'architettura d'interni e in cantiere.",
      master: 'Master AECC', parcours: 'Percorso', s1: 'Tirocinio', f1: 'Formazione',
      anime: 'Ciò che mi anima', animeIntro: 'Alcuni progetti che mi hanno segnata. Clicca su un’immagine per aprirla.',
      mots: [['Il territorio', "un'architettura legata al luogo che la accoglie"], ['La materia', 'la pietra, il legno, la terra, e ciò che permettono'], ['I sensi', "il tatto, l'odore, la luce"], ["L'esistente", 'il dialogo con ciò che c’è già, fino alle rovine']],
      stages: 'Tirocini', formations: 'Formazione',
      outils: 'Strumenti', niveaux: { 5: 'Padronanza', 4: 'Uso regolare', 3: 'Buone basi', 2: 'Nozioni' } as Record<number, string>, main: 'A mano',
      savoirs: ['Disegno a mano', 'Pratiche per il permesso di costruire', 'Disegni di scale', 'Disegno di arredi'],
      audela: 'Oltre i progetti', cv: 'Scarica il mio CV',
      fiche: { fermer: 'Chiudi', ouvrir: 'Apri la scheda', auteur: 'Progetto', lieu: 'Luogo', annee: 'Anno', visite: "Visto durante le visite dell'ENSA di Grenoble" },
      texteAudela: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo.",
    },
  });

  // références (choisies par Laura dans content/site/inspirations.json)
  const R = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/inspirations.json'), 'utf8'));
  const refs = (R.visibles as string[]).map((id) => R.items.find((x: { id: string }) => x.id === id)).filter(Boolean).map((x: Record<string, string> & { w: number; h: number }) => ({
    id: x.id, titre: x.titre, auteur: x.auteur, lieu: x.lieu, annee: x.annee, credit: x.credit, w: x.w, h: x.h,
    info: !x.auteur ? L.fiche.visite : undefined, texte: x[lang] || x.fr,
  }));
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
          <p className={styles.aStatut}>{L.statut}</p>
          <p className={styles.aAvant}>{L.avant}</p>
        </div>
      </header>

      <section className={styles.aMaster} aria-labelledby="master">
        <div>
          <p className="eyebrow">{L.master}</p>
          <h2 id="master" className={styles.aMasterT}>Architecture, Environnement et Cultures Constructives</h2>
        </div>
        <p className={`${styles.aMasterX} rv`}>{cv.master_aecc_texte[lang]}</p>
      </section>

      <section className={styles.aParcours} aria-labelledby="parcours">
        <h2 id="parcours" className={styles.aH2}>{L.parcours}</h2>
        {/* une frise par année : les stages sur une ligne, les formations sur l'autre */}
        <div className={styles.frise}>
          <p className={styles.friseLigne} data-type="s" aria-hidden="true">{L.stages}</p>
          <p className={styles.friseLigne} data-type="f" aria-hidden="true">{L.formations}</p>
          <ol className={styles.friseAns}>
            {ANS.map((an) => (
              <li key={an} className={`${styles.friseAn} rv`}>
                <span className={styles.friseAnN}>{an}</span>
                {(['s', 'f'] as const).map((type) => (
                  <ul key={type} className={styles.friseCase} data-type={type}>
                    {PARCOURS.filter((e) => e.type === type && Math.floor(e.cle) === an).sort((x, y) => x.cle - y.cle).map((e) => (
                      <li key={e.cle}>
                        <span className={styles.friseType}>{type === 's' ? L.s1 : L.f1}</span>
                        <span className={styles.pTitre}>{e.titre[lang]}</span>
                        <span className={styles.pLieu}>{e.lieu}</span>
                        <span className={styles.pDate}>{e.date[lang]}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.aOutils} aria-labelledby="outils">
        <h2 id="outils" className={styles.aH2}>{L.outils}</h2>
        <dl className={styles.aNiveaux}>
          {NIVEAUX.map((n) => {
            const noms = logiciels.filter(([, v]) => v === n).map(([k]) => k);
            return noms.length ? (
              <div key={n} className="rv">
                <dt>{L.niveaux[n]}</dt>
                <dd>{noms.map((k) => <span key={k}>{k}</span>)}</dd>
              </div>
            ) : null;
          })}
          <div className="rv">
            <dt>{L.main}</dt>
            <dd>{L.savoirs.map((k) => <span key={k}>{k}</span>)}</dd>
          </div>
        </dl>
      </section>

      <section id="references" className={styles.aAnime} aria-labelledby="anime">
        <div className={styles.aAnimeTete}>
          <h2 id="anime" className={styles.aH2}>{L.anime}</h2>
          <ul className={styles.aMots}>
            {L.mots.map(([m, x]) => <li key={m} className="rv"><b>{m}</b><span>{x}</span></li>)}
          </ul>
        </div>
        <p className={styles.aAnimeIntro}>{L.animeIntro}</p>
        <Anime items={refs} labels={L.fiche} />
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

      <p className={styles.aFin}>
        <a href={CV_HREF} download className="lien lienPdf">
          {L.cv} <span className="lienPdfInfo">· {t.footer.cvSize}</span>
          <svg viewBox="0 0 12 14" width="10" height="12" aria-hidden="true"><path d="M6 1v9M2 6.5 6 10.5l4-4M1 13h10" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
        </a>
      </p>
    </article>
  );
}
