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
const TISSU = { fr: 'Tissu bouclette, blanc cassé', en: 'Off-white bouclé fabric', it: 'Tessuto bouclé, bianco sporco' };
export const nomMateriau = (n: string, lang: Lang) => (!n ? TISSU[lang] : lang === 'fr' ? n : PALETTE[n]?.[lang] || n);

/**
 * Les échantillons (content/site/materiaux), découpés dans la planche de Laura, plus un tissu bouclette.
 * Ils se chevauchent comme sur une planche de tendance : les grands dessous, les petits par-dessus
 * (l'ordre de la liste est l'ordre d'empilement).
 * x, y : position de départ sur la table (en %) ; w : largeur en % de la table ; r : rotation en degrés ;
 * m : la même chose sur téléphone (table en hauteur) ; livre : [x, y, w] sur la page du livre ;
 * ep : épaisseur en px ; bord : couleur de la tranche (sinon la matière elle-même, assombrie) ;
 * brille : reflet de la lumière sur la face (0 mat, 1 très brillant).
 */
export const ECHANTILLONS: { f: string; nom: string; w: number; ratio: number; x: number; y: number; r: number; m: number[]; livre: number[]; ep: number; bord?: string; brille: number }[] = [
  { f: 'peinture-beige', nom: 'Peinture beige', w: 30, ratio: 1, x: 12, y: 6, r: -3, m: [4, 4, -3], livre: [6, 16, 40], ep: 2, bord: '#F7F2EA', brille: 0.08 },
  { f: 'beton', nom: 'Béton ciré', w: 26, ratio: 210 / 300, x: 54, y: 42, r: 4, m: [50, 50, 4], livre: [46, 54, 44], ep: 10, brille: 0.3 },
  { f: 'moumoute', nom: '', w: 24, ratio: 380 / 440, x: 30, y: 50, r: -8, m: [6, 62, -8], livre: [8, 58, 40], ep: 6, brille: 0 },
  { f: 'terrazzo', nom: 'Terrazzo rose', w: 13, ratio: 520 / 300, x: 35, y: 8, r: 6, m: [50, 8, 6], livre: [44, 12, 20], ep: 9, brille: 0.45 },
  { f: 'peinture-rose', nom: 'Peinture rose', w: 8, ratio: 500 / 200, x: 68, y: 10, r: -10, m: [78, 14, -10], livre: [70, 14, 14], ep: 2, bord: '#F4EEE6', brille: 0.08 },
  { f: 'bois', nom: 'Bois clair', w: 8, ratio: 520 / 190, x: 24, y: 30, r: 14, m: [36, 36, 14], livre: [34, 36, 13], ep: 6, brille: 0.15 },
  { f: 'aluminium', nom: 'Menuiseries aluminium', w: 10, ratio: 370 / 310, x: 62, y: 56, r: 18, m: [62, 72, 18], livre: [62, 66, 18], ep: 14, brille: 0.6 },
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
  const nom = (n: string) => nomMateriau(n, lang);
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
