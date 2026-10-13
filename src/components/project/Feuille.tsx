import type { Media } from '@/lib/media';
import Planche, { type Labels } from './Planche';
import styles from './project.module.css';

/**
 * Une planche de dessins, comme une feuille de rendu : les dessins posés sur la feuille, chacun avec son
 * numéro, et en bas à droite le cartouche (le projet, la planche, la liste des dessins, l'année).
 * Les dessins très allongés prennent toute la largeur. Un clic agrandit un dessin.
 */
export default function Feuille({ titre, projet, annee, medias, labels, credit, ids }: { titre: string; projet: string; annee?: string; medias: Media[]; labels: Labels; credit?: string; ids: string[] }) {
  return (
    <section className={`${styles.feuille} rv`} aria-label={titre}>
      <div className={styles.feuilleDessins}>
        {medias.map((m, i) => (
          <div key={i} className={styles.feuilleItem} data-large={m.w / m.h > 1.9 || undefined} data-carre={m.w / m.h < 1.15 || undefined}>
            <span className={styles.feuilleN}>{String(i + 1).padStart(2, '0')}</span>
            <Planche m={m} sizes="(max-width: 900px) 100vw, 50vw" labels={labels} credit={credit} ancre={ids[i]} />
          </div>
        ))}
      </div>
      <aside className={styles.cartouche}>
        <p><b>{projet}</b>{annee && <span>{annee}</span>}</p>
        <p className={styles.cartoucheT}>{titre}</p>
        <ol>{medias.map((m, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{m.legende}</li>)}</ol>
      </aside>
    </section>
  );
}
