import styles from './pages.module.css';

export type Inspiration = { id: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; info?: string; texte?: string; w: number; h: number };

/**
 * Ce qui m'anime (À propos) : quelques photos de projets ; un clic ouvre une fiche simple
 * (le projet, ce que Laura en retient, qui l'a fait, où, quand), et l'on passe d'une fiche à l'autre (experience/fiches.ts).
 */
export default function Inspirations({ items, labels }: { items: Inspiration[]; labels: { fermer: string; ouvrir: string; auteur: string; lieu: string; annee: string } }) {
  return (
    <ul className={styles.refGrille} data-refs={JSON.stringify({ fermer: labels.fermer, auteur: labels.auteur, lieu: labels.lieu, annee: labels.annee })}>
      {items.map((x) => (
        <li key={x.id} className="rv">
          <button type="button" className={styles.tuile} aria-label={`${labels.ouvrir} : ${x.titre}`} data-fiche={JSON.stringify({ ...x, img: `/media/site/inspirations/${x.id}.webp` })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/site/inspirations/${x.id}.webp`} alt="" width={x.w} height={x.h} loading="lazy" />
            <span className={styles.tuileT}>{x.titre}</span>
            <span className={styles.tuileA}>{x.auteur || x.lieu}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
