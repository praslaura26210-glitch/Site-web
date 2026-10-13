import type { Lang } from '@/i18n';
import { tr } from '@/lib/tr';
import { ECHANTILLONS, imageEchantillon, nomMateriau } from './Materiautheque';
import styles from './project.module.css';

const PIECES: Record<string, { fr: string; en: string; it: string }> = {
  'rendu-accueil': { fr: 'Accueil', en: 'Reception', it: 'Accoglienza' },
  'rendu-salle': { fr: 'Salle de cours', en: 'Studio', it: 'Sala corsi' },
  'rendu-vestiaire': { fr: 'Vestiaires', en: 'Changing rooms', it: 'Spogliatoi' },
  'rendu-coiffeuse': { fr: 'Coiffeuse', en: 'Dressing table', it: 'Toeletta' },
};

/**
 * Pilates Room : la palette des matériaux. Tous les échantillons mélangés sur une même planche, à plat, qui
 * se chevauchent un peu (positions de Materiautheque.tsx). Un clic sur l'un l'ouvre en grand sur la palette :
 * l'échantillon, son nom, où il est dans le projet, et le rendu cadré dessus (experience/index.ts).
 */
export default function Palette({ lang, credit }: { lang: Lang; credit?: string }) {
  const L = tr(lang, {
    fr: { aide: 'Cliquez un matériau pour le voir en grand.', ou: 'Où', dans: 'Dans le projet', fermer: 'Fermer' },
    en: { aide: 'Click a material to see it in detail.', ou: 'Where', dans: 'In the project', fermer: 'Close' },
    it: { aide: 'Cliccate un materiale per vederlo in grande.', ou: 'Dove', dans: 'Nel progetto', fermer: 'Chiudi' },
  });
  return (
    <section className={styles.pal} data-palette="">
      <div className={styles.palPlanche}>
        {ECHANTILLONS.map((e, i) => (
          <button key={e.f} type="button" className={styles.palEch} data-pal={e.f} data-photo={e.photo ? '' : undefined} data-mot={e.mot ? '' : undefined} aria-label={nomMateriau(e.nom, lang)}
            style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, aspectRatio: `1 / ${e.ratio}`, zIndex: i + 1, ['--r' as string]: `${e.r}deg`, ['--bois' as string]: `url(${imageEchantillon(e)})` }}>
            {e.mot ? <b>{e.mot}</b> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageEchantillon(e)} alt="" draggable={false} loading="lazy" />
            )}
          </button>
        ))}
        {ECHANTILLONS.map((e) => (
          <article key={e.f} className={styles.palFiche} data-pal-fiche={e.f} hidden>
            <span className={styles.palGrand} data-photo={e.photo ? '' : undefined}>
              {e.mot ? <b style={{ ['--bois' as string]: `url(${imageEchantillon(e)})` }}>{e.mot}</b> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageEchantillon(e)} alt="" loading="lazy" />
              )}
            </span>
            <div className={styles.palTexte}>
              <h3>{nomMateriau(e.nom, lang)}</h3>
              <p><b>{L.ou}</b>{e.ou[lang]}</p>
              <figure>
                <span style={{ backgroundImage: `url(/media/pilates-room/images/${e.vue.r}-1000.webp)`, backgroundPosition: e.vue.pos, backgroundSize: `${e.vue.zoom * 100}%` }} />
                <figcaption>{L.dans} · {PIECES[e.vue.r]?.[lang]}</figcaption>
              </figure>
            </div>
            <button type="button" className={styles.palFermer} data-pal-ferme="" aria-label={L.fermer}>×</button>
          </article>
        ))}
      </div>
      <p className={styles.palAide}>{L.aide}{credit && <span> · {credit}</span>}</p>
    </section>
  );
}
