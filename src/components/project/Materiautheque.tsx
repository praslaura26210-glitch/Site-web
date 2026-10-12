import type { Lang } from '@/i18n';
import { tr } from '@/lib/tr';
import styles from './project.module.css';

/** Noms des matériaux (palette de Pilates Room) et des photos de la planche, traduits. */
export const PALETTE: Record<string, { en: string; it: string }> = {
  'Peinture beige': { en: 'Beige paint', it: 'Pittura beige' },
  'Peinture rose': { en: 'Pink paint', it: 'Pittura rosa' },
  'Bois clair': { en: 'Light wood', it: 'Legno chiaro' },
  'Béton ciré': { en: 'Polished concrete', it: 'Cemento spatolato' },
  'Terrazzo rose': { en: 'Pink terrazzo', it: 'Terrazzo rosa' },
  'Menuiseries aluminium': { en: 'Aluminium frames', it: 'Serramenti in alluminio' },
  'Tissu bouclette, blanc cassé': { en: 'Off-white bouclé fabric', it: 'Tessuto bouclé, bianco sporco' },
  'Accueil': { en: 'Reception desk', it: 'Bancone d’accoglienza' },
  'Coiffeuse': { en: 'Dressing table', it: 'Toeletta' },
};
export const nomMateriau = (n: string, lang: Lang) => (lang === 'fr' ? n : PALETTE[n]?.[lang] || n);

export type Echantillon = {
  f: string; nom: string; w: number; ratio: number; x: number; y: number; r: number;
  livre: number[]; ep: number; bord?: string; brille: number; photo?: string;
};

/**
 * La planche de tendance de Pilates Room : les échantillons (content/site/materiaux) se chevauchent sur
 * un carton, sans vide entre eux ; les grands dessous, les petits par-dessus (l'ordre de la liste est l'ordre
 * d'empilement). Le tissu bouclette, la goutte de peinture et le carreau de terrazzo ont été fabriqués pour la
 * planche ; les deux photos sont des vues du projet (l'accueil et la coiffeuse, dessinés par Laura).
 * x, y, w : position et largeur en % de la planche (16:10) ; r : rotation en degrés ; ratio : hauteur / largeur ;
 * livre : [x, y, w] sur la page du livre ; ep : épaisseur en px ; bord : couleur de la tranche (sinon la
 * matière elle-même, assombrie) ; brille : reflet (0 mat, 1 très brillant) ; photo : un tirage, avec son cadre.
 */
export const ECHANTILLONS: Echantillon[] = [
  { f: 'peinture-beige', nom: 'Peinture beige', w: 46, ratio: 1, x: -2, y: -3, r: 0, livre: [-4, 8, 64], ep: 2, bord: '#F7F2EA', brille: 0.06 },
  { f: 'rose-feuille', nom: 'Peinture rose', w: 24, ratio: 399 / 188, x: 40, y: -4, r: 1.5, livre: [46, 4, 34], ep: 2, bord: '#F4EEE6', brille: 0.06 },
  { f: 'bois', nom: 'Bois clair', w: 14, ratio: 520 / 190, x: 86, y: -4, r: 2, livre: [80, 0, 24], ep: 6, brille: 0.15 },
  { f: 'beton', nom: 'Béton ciré', w: 44, ratio: 210 / 300, x: 56, y: 47, r: -1, livre: [36, 58, 70], ep: 10, brille: 0.3 },
  { f: 'moumoute', nom: 'Tissu bouclette, blanc cassé', w: 36, ratio: 400 / 460, x: -3, y: 50, r: -3, livre: [-6, 56, 54], ep: 6, brille: 0 },
  { f: 'coiffeuse', nom: 'Coiffeuse', w: 23, ratio: 1.19, x: 63, y: 4, r: 3, livre: [60, 22, 34], ep: 2, bord: '#FFFFFF', brille: 0.2, photo: '/media/pilates-room/images/rendu-coiffeuse-1000.webp' },
  { f: 'accueil', nom: 'Accueil', w: 18, ratio: 1.19, x: 33, y: 62, r: -4, livre: [16, 64, 32], ep: 2, bord: '#FFFFFF', brille: 0.2, photo: '/media/pilates-room/images/rendu-accueil-1000.webp' },
  { f: 'terrazzo-carreau', nom: 'Terrazzo rose', w: 17, ratio: 376 / 292, x: 24, y: 14, r: -6, livre: [12, 22, 30], ep: 12, brille: 0.45 },
  { f: 'peinture-goutte', nom: 'Peinture rose', w: 14, ratio: 421 / 318, x: 49, y: 36, r: 0, livre: [42, 40, 24], ep: 3, brille: 0.55 },
  { f: 'aluminium', nom: 'Menuiseries aluminium', w: 12, ratio: 370 / 310, x: 50, y: 72, r: 12, livre: [54, 76, 20], ep: 14, brille: 0.6 },
];
/** L'image de la face d'un échantillon (pour une photo : le tirage lui-même). */
export const imageEchantillon = (e: Echantillon) => e.photo || `/media/site/materiaux/${e.f}.webp`;

/**
 * Pilates Room : la planche des matériaux, en volume. Rien ne bouge sur la planche : c'est la caméra qui
 * bouge. Elle part de la vue de dessus, s'incline quand la planche arrive à l'écran, et respire un peu, comme
 * filmée à la main. On tourne autour en glissant ; un clic s'approche d'un échantillon (experience/materiaux.ts).
 */
export default function Materiautheque({ lang, credit }: { lang: Lang; credit?: string }) {
  const L = tr(lang, {
    fr: { titre: 'Les matériaux', aide: 'Glissez pour tourner autour de la planche · cliquez un échantillon pour vous approcher', dessus: 'Vue de dessus', volume: 'Vue en volume', plus: 'Se rapprocher', moins: 'Reculer' },
    en: { titre: 'The materials', aide: 'Drag to move around the board · click a sample to get closer', dessus: 'Top view', volume: '3D view', plus: 'Closer', moins: 'Further' },
    it: { titre: 'I materiali', aide: 'Trascina per girare intorno alla tavola · clicca un campione per avvicinarti', dessus: 'Vista dall’alto', volume: 'Vista in volume', plus: 'Avvicinati', moins: 'Allontanati' },
  });
  return (
    <section className={`${styles.mat} rv`} aria-label={L.titre}>
      <p className={styles.matAide}>{L.aide}</p>
      <div className={styles.matScene} data-materiaux-scene>
        <div className={styles.matTable} data-materiaux>
          {/* le carton de la planche, sous les échantillons */}
          <span className={styles.matPlanche} aria-hidden="true" />
          {ECHANTILLONS.map((e) => {
            const src = imageEchantillon(e);
            return (
              <button key={e.f} type="button" className={styles.matEch} data-echantillon data-photo={e.photo ? '' : undefined} aria-label={nomMateriau(e.nom, lang)} data-ep={e.ep}
                style={{ ['--x' as string]: e.x, ['--y' as string]: e.y, ['--r' as string]: e.r, ['--w' as string]: e.w, ['--ep' as string]: `${e.ep}px`, ['--brille' as string]: e.brille, ['--img' as string]: e.photo ? 'linear-gradient(#fff, #fff)' : `url(${src})`, aspectRatio: `1 / ${e.ratio}` }}>
                <span className={styles.matOmbre} aria-hidden="true" />
                {/* la tranche : des feuilles empilées, au pixel près */}
                {Array.from({ length: e.ep }, (_, k) => (
                  <span key={k} className={styles.matCouche} data-bord={e.bord ? '' : undefined} style={{ ['--k' as string]: k, ...(e.bord ? { background: e.bord } : {}) }} aria-hidden="true" />
                ))}
                <span className={styles.matFace} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" draggable={false} loading="lazy" />
                  {e.photo && <em>{nomMateriau(e.nom, lang)}</em>}
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
      {credit && <p className={styles.matCredit}>{credit}</p>}
    </section>
  );
}
