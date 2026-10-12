import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Logo from '@/components/chrome/Logo';
import LivrePages, { pagesDuLivre } from './LivrePages';
import styles from './home.module.css';

/** Le dos de chaque livre : papier crème cousu de terre cuite, kraft à étiquette, ou terre cuite. */
const DOS = ['creme', 'kraft', 'creme', 'terre', 'creme', 'kraft'];
/** Petites différences de hauteur entre les livres, comme dans un vrai étui. */
const HAUTEURS = [0, 14, 6, 22, 0, 10];

/**
 * Page Projets : un étui en carton, vu de trois quarts, avec le logo et le nom de Laura sur le côté ;
 * les projets y sont rangés comme des livres, debout, le dos visible. Au survol un livre sort un peu ;
 * au clic il sort de l'étui et s'ouvre en livre animé (experience/livres.ts). Sans JavaScript,
 * le dos du livre mène à la page du projet.
 */
export default function Etui({ projets, lang, t, titre, aide }: { projets: Projet[]; lang: Lang; t: Dict; titre: string; aide: string }) {
  const livres = projets.map((p, i) => {
    const pages = pagesDuLivre(p, lang, t).length;
    return { p, i, ep: Math.round(Math.min(56, Math.max(36, 26 + pages * 2))), h: HAUTEURS[i % HAUTEURS.length], dos: DOS[i % DOS.length] };
  });
  const pad = 9, jeu = 2;
  const W = livres.reduce((s, l) => s + l.ep + jeu, 0) - jeu + pad * 2;
  let x = pad;
  return (
    <div className={styles.etuiScene} data-etui="">
      <div className={styles.etui} style={{ ['--W' as string]: `${W}px` }}>
        <span className={`${styles.etuiFace} ${styles.etuiSol}`} aria-hidden="true" />
        <span className={`${styles.etuiFace} ${styles.etuiFond}`} aria-hidden="true" />
        <span className={`${styles.etuiFace} ${styles.etuiBas}`} aria-hidden="true" />
        <span className={`${styles.etuiFace} ${styles.etuiGauche}`} aria-hidden="true" />
        <ul className={styles.livres}>
          {livres.map(({ p, i, ep, h, dos }) => {
            const left = x;
            x += ep + jeu;
            return (
              <li key={p.slug} className={styles.livre} data-dos={dos} data-livre-li={p.slug} style={{ ['--x' as string]: `${left}px`, ['--t' as string]: `${ep}px`, ['--dh' as string]: `${h}px` }}>
                <span className={`${styles.livreFace} ${styles.livreHaut}`} aria-hidden="true" />
                <span className={`${styles.livreFace} ${styles.livreCoteG}`} aria-hidden="true" />
                <span className={`${styles.livreFace} ${styles.livreCoteD}`} aria-hidden="true" />
                <a className={styles.livreDos} href={`/${lang}/projets/${p.slug}/`} data-livre={p.slug}>
                  <span className={styles.livreN}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.livreT}>{p.titre}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <span className={`${styles.etuiFace} ${styles.etuiHaut}`} aria-hidden="true" />
        <span className={`${styles.etuiFace} ${styles.etuiDroite}`} aria-hidden="true">
          <Logo className={styles.etuiLogo} poids={1.1} label="" />
          <span className={styles.etuiNom}>Laura Pras</span>
          <span className={styles.etuiSous}>{titre}</span>
        </span>
        <span className={styles.etuiBord} aria-hidden="true" />
      </div>
      <p className={styles.etuiAide}>{aide}</p>
      <LivrePages projets={projets} lang={lang} t={t} />
    </div>
  );
}
