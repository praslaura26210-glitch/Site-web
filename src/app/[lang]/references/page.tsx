import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { getReferences } from '@/lib/references';
import styles from '@/components/pages/pages.module.css';

const L = (lang: Lang) => tr(lang, {
  fr: {
    intro: 'Des projets étudiés dans mon rapport d’études sur l’expérience sensible (2025-2026).',
    carte: 'Carte postale', retourner: 'retourner la carte', aide: 'Un clic retourne la carte.',
  },
  en: {
    intro: 'Projects studied in my report on sensory experience (2025-2026).',
    carte: 'Postcard', retourner: 'turn the card over', aide: 'Click a card to turn it over.',
  },
  it: {
    intro: 'Progetti studiati nel mio rapporto sull’esperienza sensibile (2025-2026).',
    carte: 'Cartolina', retourner: 'girare la cartolina', aide: 'Un clic gira la cartolina.',
  },
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, L(lang).intro);
}

/** Une ou deux informations : les deux premières phrases de ce que Laura en dit. */
const debut = (t: string) => (t.match(/^(.*?[.!?»](\s|$)){1,2}/)?.[0] || t).trim();
/** Le désordre organisé du tableau : un petit décalage et une inclinaison pour chaque carte, à tour de rôle. */
const POSES = [[-2.5, 0, 10], [1.8, 18, -6], [-1.2, 4, 14], [2.6, -10, 0], [-1.8, 12, -8], [1.2, -6, 6]];

/**
 * Références : des cartes postales punaisées sur un tableau, en désordre organisé. L'image en grand, le titre
 * dessous ; un clic retourne la carte : au dos, le lieu, ce que Laura en retient, l'architecte et le crédit.
 */
export default async function References({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const l = L(lang);
  const refs = getReferences(lang);
  return (
    <article className={`wrap ${styles.page} ${styles.refsPage}`}>
      <header className={styles.refsTete}>
        <h1 className={styles.h1}>{t.meta.referencesTitle}</h1>
        <p className={styles.refsIntro}>{l.intro}</p>
      </header>
      <ul className={styles.tableau}>
        {refs.map((x, i) => {
          const [r, dy, dx] = POSES[i % POSES.length];
          const portrait = x.h > x.w;
          return (
            <li key={x.id} className={`${styles.carteLieu} rv`} data-portrait={portrait || undefined} style={{ ['--r' as string]: `${r}deg`, ['--dy' as string]: `${dy}px`, ['--dx' as string]: `${dx}px`, ['--i' as string]: i }}>
              <button type="button" className={styles.carte} data-retourne="" aria-pressed="false" title={l.retourner}>
                <span className={styles.aimant} aria-hidden="true" />
                <span className={styles.carteIn}>
                  {/* le recto : l'image, le titre */}
                  <span className={styles.recto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/site/inspirations/${x.id}.webp`} alt="" width={x.w} height={x.h} loading="lazy" />
                    <span className={styles.rectoT}>{x.titre}</span>
                    <span className={styles.rectoA}>{x.auteur || x.lieu}</span>
                  </span>
                  {/* le verso : à gauche ce que j'en retiens, à droite le timbre et « l'adresse » */}
                  <span className={styles.verso}>
                    <span className={styles.versoTete}>{l.carte}</span>
                    <span className={styles.versoMot}>
                      {(x.lieu || x.annee) && <span className={styles.versoLieu}>{[x.lieu, x.annee].filter(Boolean).join(' · ')}</span>}
                      {x.texte && <span className={styles.versoTxt}>{debut(x.texte)}</span>}
                    </span>
                    <span className={styles.versoAdr}>
                      <span className={styles.timbre}><i style={{ backgroundImage: `url(/media/site/inspirations/${x.id}.webp)` }} /></span>
                      <span className={styles.ligne}>{x.titre}</span>
                      {x.auteur && <span className={styles.ligne}>{x.auteur}</span>}
                      {x.credit && <span className={`${styles.ligne} ${styles.ligneCredit}`}>{x.credit}</span>}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.refsAide}>{l.aide}</p>
    </article>
  );
}
