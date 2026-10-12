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
/** Le tissu n'est pas sur la planche de Laura : ajouté pour la table, son nom est à part. */
const TISSU = { fr: 'Tissu, lin rose', en: 'Fabric, pink linen', it: 'Tessuto, lino rosa' };

/**
 * Les échantillons (content/site/materiaux), découpés dans la planche de Laura, plus un tissu :
 * position de départ sur la table (x, y en % ; largeur w en % de la table ; rotation r en degrés) ;
 * m : la même chose sur téléphone, où la table est en hauteur ;
 * ep : épaisseur en px ; bord : couleur de la tranche (sinon la matière elle-même, assombrie) ;
 * brille : reflet de la lumière sur la face (0 mat, 1 très brillant).
 */
const ECHANTILLONS = [
  { f: 'tissu', nom: '', w: 26, ratio: 320 / 380, x: 13, y: 33, r: -8, m: [5, 55, -6], ep: 1, brille: 0 },
  { f: 'beton', nom: 'Béton ciré', w: 20, ratio: 210 / 300, x: 51, y: 52, r: 6, m: [52, 64, 6], ep: 10, brille: 0.3 },
  { f: 'peinture-beige', nom: 'Peinture beige', w: 17, ratio: 1, x: 45, y: 17, r: 4, m: [42, 30, 4], ep: 2, bord: '#F7F2EA', brille: 0.08 },
  { f: 'terrazzo', nom: 'Terrazzo rose', w: 16, ratio: 520 / 300, x: 30, y: 8, r: -5, m: [10, 16, -5], ep: 9, brille: 0.45 },
  { f: 'peinture-rose', nom: 'Peinture rose', w: 10, ratio: 500 / 200, x: 58, y: 6, r: 9, m: [70, 8, 9], ep: 2, bord: '#F4EEE6', brille: 0.08 },
  { f: 'bois', nom: 'Bois clair', w: 10, ratio: 520 / 190, x: 71, y: 20, r: -12, m: [76, 40, -10], ep: 6, brille: 0.15 },
  { f: 'aluminium', nom: 'Menuiseries aluminium', w: 14, ratio: 370 / 310, x: 76, y: 60, r: 10, m: [30, 74, 10], ep: 14, brille: 0.6 },
];

/**
 * Pilates Room : la table des matériaux, en volume. Les échantillons ont leur épaisseur, leur ombre et leur
 * reflet ; la caméra tourne doucement autour de la table, comme filmée à la main. On tourne autour en glissant
 * sur la table, on déplace un échantillon en le faisant glisser, un clic s'approche de lui
 * (experience/materiaux.ts).
 */
export default function Materiautheque({ lang, credit }: { lang: Lang; credit?: string }) {
  const L = tr(lang, {
    fr: { titre: 'Les matériaux, à manipuler', aide: 'Glissez sur la table pour tourner autour · cliquez un échantillon pour vous approcher · faites-le glisser pour le déplacer', ranger: 'Remettre en place', dessus: 'Vue de dessus', volume: 'Vue en volume', plus: 'Se rapprocher', moins: 'Reculer' },
    en: { titre: 'The materials, to handle', aide: 'Drag the table to move around it · click a sample to get closer · drag it to move it', ranger: 'Put them back', dessus: 'Top view', volume: '3D view', plus: 'Closer', moins: 'Further' },
    it: { titre: 'I materiali, da toccare', aide: 'Trascina il tavolo per girarci intorno · clicca un campione per avvicinarti · trascinalo per spostarlo', ranger: 'Rimetti a posto', dessus: 'Vista dall’alto', volume: 'Vista in volume', plus: 'Avvicinati', moins: 'Allontanati' },
  });
  const nom = (n: string) => (!n ? TISSU[lang] : lang === 'fr' ? n : PALETTE[n]?.[lang] || n);
  return (
    <section className={`${styles.mat} rv`} aria-labelledby="titre-materiaux">
      <div className={styles.matTete}>
        <h2 id="titre-materiaux" className={styles.texteT}>{L.titre}</h2>
        <p className={styles.matAide}>{L.aide}</p>
      </div>
      <div className={styles.matScene} data-materiaux-scene>
        <div className={styles.matTable} data-materiaux>
          <span className={styles.matSol} aria-hidden="true" />
          {ECHANTILLONS.map((e) => {
            const url = `url(/media/site/materiaux/${e.f}.webp)`;
            return (
              <button key={e.f} type="button" className={styles.matEch} data-echantillon aria-label={nom(e.nom)} data-ep={e.ep} data-depart={JSON.stringify([e.x, e.y, e.r])} data-depart-m={JSON.stringify(e.m)}
                style={{ ['--x' as string]: e.x, ['--y' as string]: e.y, ['--r' as string]: e.r, ['--w' as string]: e.w, ['--ep' as string]: `${e.ep}px`, ['--brille' as string]: e.brille, ['--img' as string]: url, aspectRatio: `1 / ${e.ratio}` }}>
                <span className={styles.matOmbre} aria-hidden="true" />
                {/* la tranche : des feuilles empilées, au pixel près */}
                {Array.from({ length: e.ep }, (_, k) => (
                  <span key={k} className={styles.matCouche} data-bord={e.bord ? '' : undefined} style={{ ['--k' as string]: k, ...(e.bord ? { background: e.bord } : {}) }} aria-hidden="true" />
                ))}
                <span className={styles.matFace} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/site/materiaux/${e.f}.webp`} alt="" draggable={false} />
                </span>
              </button>
            );
          })}
        </div>
        <p className={styles.matNom} data-materiaux-nom aria-live="polite" />
        <div className={styles.matCam}>
          <button type="button" data-cam="moins" aria-label={L.moins}>−</button>
          <button type="button" data-cam="plus" aria-label={L.plus}>+</button>
          <button type="button" data-cam="vue" data-dessus={L.dessus} data-volume={L.volume}>{L.dessus}</button>
        </div>
      </div>
      <div className={styles.matBas}>
        <button type="button" className="lien" data-materiaux-ranger="">{L.ranger}</button>
        {credit && <span className={styles.matCredit}>{credit}</span>}
      </div>
    </section>
  );
}
