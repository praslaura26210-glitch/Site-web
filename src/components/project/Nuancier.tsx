import type { Lang } from '@/i18n';
import { ECHANTILLONS, imageEchantillon, nomMateriau } from './Materiautheque';
import styles from './project.module.css';

/**
 * Pilates Room : les matériaux, posés à plat, avec de l'air autour. Pour chacun : l'échantillon, son nom,
 * et où on le trouve dans le projet. Rien ne bouge (un léger relief au survol).
 */
export default function Nuancier({ lang, credit }: { lang: Lang; credit?: string }) {
  return (
    <section className={styles.nuancier}>
      <ul>
        {ECHANTILLONS.map((e, i) => (
          <li key={e.f} className={`${styles.nuance} rv`} data-photo={e.photo ? '' : undefined} style={{ ['--i' as string]: i }}>
            <span className={styles.nuanceEch} aria-hidden="true">
              {e.mot ? <b style={{ backgroundImage: `url(${imageEchantillon(e)})` }}>{e.mot}</b> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageEchantillon(e)} alt="" loading="lazy" />
              )}
            </span>
            <span className={styles.nuanceN}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className={styles.nuanceT}>{nomMateriau(e.nom, lang)}</h3>
            <p className={styles.nuanceOu}>{e.ou[lang]}</p>
          </li>
        ))}
      </ul>
      {credit && <p className={styles.matCredit}>{credit}</p>}
    </section>
  );
}
