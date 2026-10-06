import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getCV, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { CV_HREF } from '@/components/chrome/liens';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, cv.presentation[lang].slice(0, 155), '/media/site/portrait-2000.webp');
}

type Etape = { cle: number; date: { fr: string; en: string; it: string }; titre: { fr: string; en: string; it: string }; lieu: string; type: 'f' | 's' };

/** Parcours dans l'ordre chronologique inverse : formations et stages mêlés. */
const PARCOURS: Etape[] = [
  { cle: 2026.9, type: 'f', date: { fr: 'En cours', en: 'Ongoing', it: 'In corso' }, titre: { fr: 'Master Architecture, Environnement et Cultures Constructives', en: "Master's in Architecture, Environment and Building Cultures", it: 'Master in Architettura, Ambiente e Culture Costruttive' }, lieu: 'ENSA Grenoble' },
  { cle: 2026.5, type: 'f', date: { fr: '2026', en: '2026', it: '2026' }, titre: { fr: 'Licence 3', en: 'Bachelor, 3rd year', it: 'Laurea triennale, 3° anno' }, lieu: 'ENSA Grenoble' },
  { cle: 2025.5, type: 's', date: { fr: 'Juillet 2025', en: 'July 2025', it: 'Luglio 2025' }, titre: { fr: "Stage en architecture d'intérieur", en: 'Interior architecture internship', it: "Tirocinio in architettura d'interni" }, lieu: 'MTG Intérieur, Caluire-et-Cuire' },
  { cle: 2024.1, type: 's', date: { fr: 'Janvier 2024', en: 'January 2024', it: 'Gennaio 2024' }, titre: { fr: 'Stage ouvrier sur chantier', en: 'Site internship, as a builder', it: 'Tirocinio operaio in cantiere' }, lieu: 'Chenavier Caraz, Beaurepaire' },
  { cle: 2023.6, type: 's', date: { fr: 'Juin – août 2023', en: 'June – August 2023', it: 'Giugno – agosto 2023' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'ATCD Architecture, Beaurepaire' },
  { cle: 2023.5, type: 'f', date: { fr: '2023', en: '2023', it: '2023' }, titre: { fr: 'Titre RNCP (bac+2), dessinatrice en bâtiment et architecture', en: 'National vocational diploma (2 years), building and architectural draughtswoman', it: 'Diploma professionale (2 anni), disegnatrice edile e di architettura' }, lieu: 'EDAIC, Villeurbanne' },
  { cle: 2022.5, type: 'f', date: { fr: '2022', en: '2022', it: '2022' }, titre: { fr: 'Bac STMG', en: 'Baccalauréat (STMG)', it: 'Maturità (STMG)' }, lieu: 'Lycée du Sacré-Cœur, Tournon-sur-Rhône' },
  { cle: 2022.1, type: 's', date: { fr: 'Février 2022', en: 'February 2022', it: 'Febbraio 2022' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'EAD, Salaise-sur-Sanne' },
  { cle: 2021.9, type: 's', date: { fr: 'Décembre 2021', en: 'December 2021', it: 'Dicembre 2021' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'Cheeze, Valence' },
];

/** Position sur la frise (fin 2021 à début 2027), en pourcentage. */
const DEBUT = 2021.6, FIN = 2027.5;
const pos = (a: number) => ((a - DEBUT) / (FIN - DEBUT)) * 100;
const T3 = (fr: string, en: string, it: string) => ({ fr, en, it });
/** Formations : les dates de début sont celles des rentrées (la formation de dessinatrice a duré un an). */
const FORMATION = [
  { cle: 'bac', de: DEBUT, a: 2022.5, titre: T3('Bac STMG', 'Baccalauréat (STMG)', 'Maturità (STMG)'), lieu: 'Lycée du Sacré-Cœur, Tournon-sur-Rhône', date: T3('2022', '2022', '2022') },
  { cle: 'rncp', de: 2022.7, a: 2023.5, titre: T3('Dessinatrice en bâtiment et architecture', 'Building and architectural draughtswoman', 'Disegnatrice edile e di architettura'), lieu: 'EDAIC, Villeurbanne', date: T3('Titre RNCP, 2023', 'National diploma, 2023', 'Diploma, 2023') },
  { cle: 'licence', de: 2023.7, a: 2026.5, titre: T3('Licence', "Bachelor's degree", 'Laurea triennale'), lieu: 'ENSA Grenoble', date: T3('2023 – 2026', '2023 – 2026', '2023 – 2026') },
  { cle: 'master', de: 2026.7, a: FIN, ouvert: true, titre: T3('Master AECC', "Master's AECC", 'Master AECC'), lieu: 'ENSA Grenoble', date: T3('en cours', 'ongoing', 'in corso') },
];
const STAGES = [
  { cle: 'cheeze', de: 2021.95, rang: 0, structure: 'Cheeze', ville: 'Valence', titre: T3('agence d’architecture', 'architecture practice', 'studio di architettura'), date: T3('Déc. 2021', 'Dec. 2021', 'Dic. 2021') },
  { cle: 'ead', de: 2022.12, rang: 1, structure: 'EAD', ville: 'Salaise-sur-Sanne', titre: T3('agence d’architecture', 'architecture practice', 'studio di architettura'), date: T3('Févr. 2022', 'Feb. 2022', 'Feb. 2022') },
  { cle: 'atcd', de: 2023.45, rang: 0, structure: 'ATCD Architecture', ville: 'Beaurepaire', titre: T3('agence d’architecture', 'architecture practice', 'studio di architettura'), date: T3('Juin – août 2023', 'June – Aug. 2023', 'Giu. – ago. 2023') },
  { cle: 'chenavier', de: 2024.05, rang: 1, structure: 'Chenavier Caraz', ville: 'Beaurepaire', titre: T3('stage ouvrier sur chantier', 'site internship', 'tirocinio in cantiere'), date: T3('Janv. 2024', 'Jan. 2024', 'Gen. 2024') },
  { cle: 'mtg', de: 2025.55, rang: 0, structure: 'MTG Intérieur', ville: 'Caluire-et-Cuire', titre: T3('architecture intérieure', 'interior architecture', "architettura d'interni"), date: T3('Juil. 2025', 'July 2025', 'Lug. 2025') },
];

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
      interets: 'Ce qui me retient',
      mots: [['Le territoire', "une architecture liée au lieu qui l'accueille"], ['La matière', 'la pierre, le bois, la terre, ce qu’ils permettent'], ['Les sens', "le toucher, l'odeur, la lumière"], ["L'existant", "le dialogue avec ce qui est là, jusqu'aux ruines"]],
      master: 'Le master AECC', recherche: 'Mon rapport d’études',
      parcours: 'Parcours', f: 'Formation', s: 'Stages',
      outils: 'Outils', main: 'À la main', sur5: 'sur 5',
      savoirs: ['Dessin à la main', 'Dossiers de permis de construire', "Plans d'escalier", 'Dessin de mobilier'],
      audela: 'Au-delà des projets', cv: 'Mon CV en PDF', ecrire: 'M’écrire',
      texteAudela: audela.texte,
    },
    en: {
      statut: "Master's student (AECC) at the École nationale supérieure d'architecture de Grenoble.",
      avant: 'Before architecture school, I worked as a building draughtswoman. I draw in Archicad as well as by hand, I put together building permit applications, and I design staircases and furniture. I have worked in an architecture practice, in interior architecture and on a building site.',
      interets: 'What holds my attention',
      mots: [['Territory', 'architecture tied to the place that receives it'], ['Material', 'stone, timber, earth, and what they make possible'], ['The senses', 'touch, smell, light'], ['What exists', 'a dialogue with what is already there, down to ruins']],
      master: 'The AECC master’s', recherche: 'My study report',
      parcours: 'Background', f: 'Education', s: 'Internships',
      outils: 'Tools', main: 'By hand', sur5: 'out of 5',
      savoirs: ['Hand drawing', 'Building permit applications', 'Staircase drawings', 'Furniture design'],
      audela: 'Beyond the projects', cv: 'My CV as a PDF', ecrire: 'Write to me',
      texteAudela: 'I like to spend my free time exploring different creative practices, such as drawing, painting and crafts like mosaic, scrapbooking and knitting. I particularly enjoy working with my hands, restoring old furniture or making new pieces. I am not a great photographer, but I like taking the time to photograph the places around me. It helps me look more closely at the architecture, the light and the details that make up a place.',
    },
    it: {
      statut: "Studentessa del master AECC all'École nationale supérieure d'architecture de Grenoble.",
      avant: "Prima della scuola di architettura sono stata disegnatrice edile. Disegno con Archicad e a mano, preparo pratiche per il permesso di costruire, progetto scale e arredi. Ho lavorato in uno studio di architettura, nell'architettura d'interni e in cantiere.",
      interets: 'Ciò che mi trattiene',
      mots: [['Il territorio', "un'architettura legata al luogo che la accoglie"], ['La materia', 'la pietra, il legno, la terra, e ciò che permettono'], ['I sensi', "il tatto, l'odore, la luce"], ["L'esistente", 'il dialogo con ciò che c’è già, fino alle rovine']],
      master: 'Il master AECC', recherche: 'La mia tesina',
      parcours: 'Percorso', f: 'Formazione', s: 'Tirocini',
      outils: 'Strumenti', main: 'A mano', sur5: 'su 5',
      savoirs: ['Disegno a mano', 'Pratiche per il permesso di costruire', 'Disegni di scale', 'Disegno di arredi'],
      audela: 'Oltre i progetti', cv: 'Il mio CV in PDF', ecrire: 'Scrivimi',
      texteAudela: "Mi piace dedicare il tempo libero a diverse pratiche creative, come il disegno, la pittura o attività manuali come il mosaico, lo scrapbooking e la maglia. Amo soprattutto lavorare con le mani, restaurare vecchi mobili o creare nuovi pezzi. Non sono una grande fotografa, ma mi piace prendermi il tempo di fotografare i luoghi che mi circondano: mi aiuta a osservare meglio l'architettura, la luce e i dettagli che compongono un luogo.",
    },
  });

  return (
    <article className={styles.apropos}>
      <header className={styles.aHead}>
        <div className={styles.aHeadTxt}>
          <h1 className="eyebrow">{t.meta.aproposTitle}</h1>
          <p className={styles.aNom}>Laura Pras</p>
          <p className={styles.avant}>{L.avant}</p>
          <a href={CV_HREF} download className="lien lienPdf">{L.cv}<svg viewBox="0 0 12 14" width="10" height="12" aria-hidden="true"><path d="M6 1v9M2 6.5 6 10.5l4-4M1 13h10" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg></a>
        </div>
        <figure className={styles.portrait}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/portrait-2000.webp" srcSet="/media/site/portrait-1000.webp 1000w, /media/site/portrait-2000.webp 1042w" sizes="(max-width: 900px) 100vw, 50vw" alt="Laura Pras" width={1042} height={1469} fetchPriority="high" />
        </figure>
      </header>

      <section className={`wrap ${styles.master}`}>
        <h2 className="eyebrow">{L.master}</h2>
        <p className="rv">{cv.master_aecc_texte[lang]}</p>
      </section>

      <section className={`wrap ${styles.parcours}`} aria-labelledby="parcours">
        <h2 id="parcours" className={styles.h2Grand}>{L.parcours}</h2>
        {/* frise en deux voies : formation (barres) et stages (repères), de fin 2021 à aujourd'hui */}
        <div className={styles.voies}>
          <div className={styles.axe} aria-hidden="true">
            {[2022, 2023, 2024, 2025, 2026].map((a) => <span key={a} style={{ left: `${pos(a)}%` }}>{a}</span>)}
          </div>
          <div className={styles.voie}>
            <p className={styles.voieNom}>{L.f}</p>
            <ol className={styles.voieF}>
              {FORMATION.map((e) => (
                <li key={e.cle} style={{ left: `${pos(e.de)}%`, width: `${pos(e.a) - pos(e.de)}%` }} data-ouvert={e.ouvert || undefined}>
                  <span className={styles.barre} aria-hidden="true" />
                  <span className={styles.vTitre}>{e.titre[lang]}</span>
                  <span className={styles.vLieu}>{e.lieu} · {e.date[lang]}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${styles.voie} ${styles.voieS}`}>
            <p className={styles.voieNom}>{L.s}</p>
            <ol className={styles.voieP}>
              {STAGES.map((e) => (
                <li key={e.cle} style={{ left: `${pos(e.de)}%`, ['--rang' as string]: e.rang }}>
                  <span className={styles.point} aria-hidden="true" />
                  <span className={styles.vDate}>{e.date[lang]}</span>
                  <span className={styles.vTitre}>{e.structure}</span>
                  <span className={styles.vLieu}>{e.titre[lang]}, {e.ville}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {/* sur téléphone : deux listes */}
        <div className={styles.listes}>
          {([['f', L.f, PARCOURS.filter((e) => e.type === 'f')], ['s', L.s, PARCOURS.filter((e) => e.type === 's')]] as const).map(([k, nom, items]) => (
            <div key={k} data-type={k}>
              <p className={styles.voieNom}>{nom}</p>
              <ol>
                {items.map((e) => (
                  <li key={e.cle}><span className={styles.vDate}>{e.date[lang]}</span><span className={styles.vTitre}>{e.titre[lang]}</span><span className={styles.vLieu}>{e.lieu}</span></li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={`wrap ${styles.outils}`} aria-labelledby="outils">
        <h2 id="outils" className={styles.h2Grand}>{L.outils}</h2>
        <ul className={styles.logiciels}>
          {Object.entries(cv.logiciels_sur_5 as Record<string, number>).map(([k, v]) => (
            <li key={k}>
              <span>{k}</span>
              <span className={styles.niveau} aria-label={`${v} ${L.sur5}`}><i style={{ width: `${v * 20}%` }} /></span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`wrap ${styles.audela}`} aria-labelledby="audela">
        <figure className={`${styles.audelaPhoto} rv`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.srcSmall} srcSet={`${photo.srcSmall} 1000w, ${photo.src} 2000w`} sizes="(max-width: 900px) 100vw, 35vw" alt={photo.legende} width={photo.w} height={photo.h} loading="lazy" />
        </figure>
        <div className={`${styles.audelaTxt} rv`}>
          <h2 id="audela" className={styles.h2Grand}>{L.audela}</h2>
          <p>{L.texteAudela}</p>
        </div>
        <figure className={`${styles.audelaPlanche} rv`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planche.srcSmall} srcSet={`${planche.srcSmall} 1000w, ${planche.src} 2000w`} sizes="(max-width: 900px) 100vw, 80vw" alt={planche.legende} width={planche.w} height={planche.h} loading="lazy" />
        </figure>
      </section>

      <p className={`wrap ${styles.aFin}`}>
        <Link href={`/${lang}/contact/`} className="lien">{L.ecrire} →</Link>
      </p>
    </article>
  );
}
