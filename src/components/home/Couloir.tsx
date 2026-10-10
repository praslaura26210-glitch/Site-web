import styles from './home.module.css';

/** Le dessin du couloir, tel quel. Un clic l'ouvre dans la visionneuse plein écran, avec la mention de l'auteure. */
export default function Couloir({ legende, ouvrir }: { legende: string; ouvrir: string; fermer?: string }) {
  const zoom = { legende: legende.replace(/\s*·\s*©.*$/, ''), preview: '/media/site/dessin-couverture-2000.webp', ratio: 1398 / 1328, credit: '© Laura Pras', thumb: '/media/site/dessin-couverture-1000.webp' };
  return (
    <button type="button" className={styles.couloir} aria-label={`${ouvrir} : ${legende}`} data-zoom={JSON.stringify(zoom)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/site/dessin-couverture-2000.webp"
        srcSet="/media/site/dessin-couverture-1000.webp 1000w, /media/site/dessin-couverture-2000.webp 2000w"
        sizes="(max-width: 900px) 100vw, 58vw"
        alt={legende}
        width={1398}
        height={1328}
        fetchPriority="high"
      />
    </button>
  );
}
