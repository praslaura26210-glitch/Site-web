import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { donneesExperience, resume } from '@/lib/experience';
import styles from './home.module.css';

/**
 * Pièces montrées pour chaque projet, la couverture en premier : de quoi voir d'un coup d'œil
 * ce que contient le projet (maquette, croquis, plans, rendus). Noms des images dans content/projets.
 */
const PIECES: Record<string, string[]> = {
  'illusion-d-envol': ['maquette', 'croquis-perspective', 'axonometrie-eclatee', 'plan-rdc'],
  'la-ruche': ['maquette-1', 'maquette-3', 'axonometrie-eclatee', 'plan-rdc'],
  'le-passage-des-artistes': ['maquette-2', 'croquis-cour', 'coupe-perspective', 'experimentation-1'],
  'entre-deux-regards': ['maquette', 'perspective-cour', 'plan-masse-projet-apercu'],
  'pilates-room': ['rendu-accueil', 'rendu-salle', 'planche-materiaux', 'plan-amenagement'],
  'escalier-suspendu': ['rendu', 'axonometrie', 'vue-de-face', 'planche-garde-corps'],
};

const fichier = (u: string) => u.split('/').pop()!.split('?')[0];

/**
 * Page Projets : chaque projet en planche. Ses images côte à côte, à la même hauteur
 * (chacune prend une largeur proportionnelle à son format), puis quelques lignes.
 * Un clic sur une image ouvre le projet à cette image.
 */
export default function ProjetsPlanches({ projets, lang, lire }: { projets: Projet[]; lang: Lang; lire: string }) {
  const { dessins } = donneesExperience(lang);
  return (
    <div className={styles.planches}>
      {projets.map((p, i) => {
        const href = `/${lang}/projets/${p.slug}/`;
        const pieces = (PIECES[p.slug] || []).map((nom, k) => {
          const d = dessins.find((x) => x.slug === p.slug && (fichier(x.thumb).startsWith(`${nom}-`) || fichier(x.thumb) === `${nom}.svg`));
          // la première pièce (la couverture) mène au haut du projet ; les autres, à leur place dans le projet
          return d && { ...d, lien: k === 0 ? href : d.href };
        }).filter((x): x is NonNullable<typeof x> => !!x);
        const meta = [p.lieu, p.annee].filter(Boolean).join(' · ');
        return (
          <article key={p.slug} className={`${styles.planche} rv`} aria-labelledby={`t-${p.slug}`}>
            <header className={styles.plTete}>
              <h2 id={`t-${p.slug}`} className={styles.plTitre}><Link href={href}>{p.titre}</Link></h2>
              <p className={styles.plMeta}>{meta}</p>
            </header>
            <div className={styles.plImgs}>
              {pieces.map((d) => (
                <Link key={d.id} href={d.lien} className={styles.plImg} style={{ flexGrow: d.w / d.h }} data-dessin={d.dessin || undefined} aria-label={`${p.titre} : ${d.legende}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.thumb} alt="" width={Math.round(d.w)} height={Math.round(d.h)} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
                  <span className={styles.plLeg} aria-hidden="true">{d.legende}</span>
                </Link>
              ))}
            </div>
            <div className={styles.plBas}>
              <p className={styles.plResume}>{resume(p)}</p>
              <Link href={href} className="lien">{lire} →</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
