import type { Lang } from '@/i18n';
import { tr } from '@/lib/tr';
import styles from './project.module.css';

/** Noms des matériaux (palette de Pilates Room), traduits. */
export const PALETTE: Record<string, { en: string; it: string }> = {
  'Peinture beige': { en: 'Beige paint', it: 'Pittura beige' },
  'Peinture rose': { en: 'Pink paint', it: 'Pittura rosa' },
  'Bois clair': { en: 'Light wood', it: 'Legno chiaro' },
  'Béton ciré': { en: 'Polished concrete', it: 'Cemento spatolato' },
  'Terrazzo rose': { en: 'Pink terrazzo', it: 'Terrazzo rosa' },
  'Menuiseries aluminium': { en: 'Aluminium frames', it: 'Serramenti in alluminio' },
};

/**
 * Les échantillons, découpés dans la planche de matériaux de Laura (content/site/materiaux) :
 * position de départ sur la table (x, y en % ; largeur w en % de la table ; rotation r en degrés) ;
 * m : la même chose sur téléphone, où la table est en hauteur.
 */
const ECHANTILLONS = [
  { f: 'terrazzo', nom: 'Terrazzo rose', w: 17, ratio: 520 / 300, x: 8, y: 18, r: -4, m: [6, 6, -4] },
  { f: 'peinture-rose', nom: 'Peinture rose', w: 11, ratio: 500 / 200, x: 28, y: 12, r: 3, m: [38, 5, 3] },
  { f: 'bois', nom: 'Bois clair', w: 10, ratio: 520 / 190, x: 42, y: 22, r: -3, m: [63, 8, -3] },
  { f: 'peinture-beige', nom: 'Peinture beige', w: 17, ratio: 1, x: 55, y: 30, r: 5, m: [8, 52, 5] },
  { f: 'beton', nom: 'Béton ciré', w: 18, ratio: 210 / 300, x: 73, y: 58, r: -6, m: [30, 76, -6] },
  { f: 'aluminium', nom: 'Menuiseries aluminium', w: 14, ratio: 370 / 310, x: 77, y: 10, r: 8, m: [64, 50, 8] },
];

/**
 * Pilates Room : la table des matériaux. Les échantillons sont posés comme sur une table d'agence ;
 * on les attrape, on les déplace, on les fait pivoter (experience/materiaux.ts).
 */
export default function Materiautheque({ lang, credit }: { lang: Lang; credit?: string }) {
  const L = tr(lang, {
    fr: { titre: 'Les matériaux, à manipuler', aide: 'Attrapez un échantillon pour le déplacer · double-clic pour le tourner', ranger: 'Remettre en place' },
    en: { titre: 'The materials, to handle', aide: 'Grab a sample to move it · double-click to turn it', ranger: 'Put them back' },
    it: { titre: 'I materiali, da toccare', aide: 'Afferra un campione per spostarlo · doppio clic per ruotarlo', ranger: 'Rimetti a posto' },
  });
  const nom = (n: string) => (lang === 'fr' ? n : PALETTE[n]?.[lang] || n);
  return (
    <section className={`${styles.mat} rv`} aria-labelledby="titre-materiaux">
      <div className={styles.matTete}>
        <h2 id="titre-materiaux" className={styles.texteT}>{L.titre}</h2>
        <p className={styles.matAide}>{L.aide}</p>
      </div>
      <div className={styles.matTable} data-materiaux>
        {ECHANTILLONS.map((e) => (
          <button key={e.f} type="button" className={styles.matEch} data-echantillon aria-label={nom(e.nom)} data-depart={JSON.stringify([e.x, e.y, e.r])} data-depart-m={JSON.stringify(e.m)} style={{ ['--x' as string]: e.x, ['--y' as string]: e.y, ['--r' as string]: e.r, ['--w' as string]: e.w, aspectRatio: `1 / ${e.ratio}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/site/materiaux/${e.f}.webp`} alt="" draggable={false} />
            <span className={styles.matEtiquette}>{nom(e.nom)}</span>
          </button>
        ))}
      </div>
      <div className={styles.matBas}>
        <button type="button" className="lien" data-materiaux-ranger="">{L.ranger}</button>
        {credit && <span className={styles.matCredit}>{credit}</span>}
      </div>
    </section>
  );
}
