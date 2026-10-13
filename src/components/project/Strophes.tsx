import type { Media } from '@/lib/media';
import Planche, { type Labels } from './Planche';
import styles from './project.module.css';

const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Le poème, strophe par strophe : chaque strophe à côté d'un dessin, d'un côté puis de l'autre ; les dessins
 * allongés prennent plus de place, les dessins en hauteur moins ; une strophe sans dessin se lit seule, au centre, plus grande (la dernière, souvent).
 */
export default function Strophes({ poeme, medias, labels, credit }: { poeme: string; medias: (Media | null)[]; labels: Labels; credit?: string }) {
  const strophes = poeme.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  return (
    <div className={styles.strophes}>
      {strophes.map((st, i) => {
        const m = medias[i];
        const vers = st.split('\n').map((l, k) => <span key={k}>{l}</span>);
        if (!m) return (
          <blockquote key={i} className={`${styles.stropheSeule} rv`}>
            <span className={styles.stropheN}>{ROMAINS[i]}</span>
            <p>{vers}</p>
          </blockquote>
        );
        return (
          <div key={i} className={styles.strophe} data-cote={i % 2 ? 'd' : 'g'} data-forme={m.w / m.h > 1.6 ? 'large' : m.w / m.h < 0.9 ? 'portrait' : 'moyen'}>
            <div className={styles.stropheImg}><Planche m={m} sizes="(max-width: 900px) 100vw, 60vw" labels={labels} credit={credit} /></div>
            <div className={`${styles.stropheTexte} rv`}>
              <span className={styles.stropheN}>{ROMAINS[i]}</span>
              <p>{vers}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
