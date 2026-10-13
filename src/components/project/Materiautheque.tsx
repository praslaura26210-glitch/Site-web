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
  'Miroir de la coiffeuse': { en: 'Dressing-table mirror', it: 'Specchio della toeletta' },
  'Suspension de l’accueil': { en: 'Reception pendant light', it: 'Lampada dell’accoglienza' },
  'Lettres en bois de l’accueil': { en: 'Wooden letters, reception', it: 'Lettere in legno dell’accoglienza' },
};
export const nomMateriau = (n: string, lang: Lang) => (lang === 'fr' ? n : PALETTE[n]?.[lang] || n);

export type Echantillon = {
  f: string; nom: string; w: number; ratio: number; x: number; y: number; r: number;
  livre: number[]; ep: number; bord?: string; brille: number; photo?: string; mot?: string;
  /** où on le trouve dans le projet ; vue : le rendu où on le voit, cadré dessus (position, grossissement) */
  ou: L3; vue: { r: string; pos: string; zoom: number };
};
type L3 = { fr: string; en: string; it: string };
const D = (fr: string, en: string, it: string): L3 => ({ fr, en, it });

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
  { f: 'peinture-beige-pinceau', nom: 'Peinture beige', w: 50, ratio: 360 / 520, x: -3, y: -4, r: 0, livre: [-6, 6, 70], ep: 2, brille: 0.12, ou: D('Les murs et les plafonds de tout le studio.', 'The walls and ceilings throughout the studio.', 'Le pareti e i soffitti di tutto lo studio.'), vue: { r: 'rendu-salle', pos: '50% 30%', zoom: 1.2 } },
  { f: 'bois', nom: 'Bois clair', w: 14, ratio: 520 / 190, x: 86, y: -4, r: 2, livre: [80, 0, 24], ep: 6, brille: 0.15, ou: D('Les étagères et les tabourets de l’accueil, les casiers des vestiaires, le meuble de la coiffeuse.', 'The shelves and stools at the reception, the changing-room lockers, the dressing-table unit.', 'Le mensole e gli sgabelli dell’accoglienza, gli armadietti degli spogliatoi, il mobile della toeletta.'), vue: { r: 'rendu-accueil', pos: '75% 50%', zoom: 1.9 } },
  { f: 'beton', nom: 'Béton ciré', w: 44, ratio: 210 / 300, x: 56, y: 47, r: -1, livre: [36, 58, 70], ep: 10, brille: 0.3, ou: D('Le sol de l’accueil et de la salle de cours.', 'The floor of the reception and the studio.', 'Il pavimento dell’accoglienza e della sala corsi.'), vue: { r: 'rendu-salle', pos: '50% 95%', zoom: 1.5 } },
  { f: 'moumoute', nom: 'Tissu bouclette, blanc cassé', w: 38, ratio: 400 / 460, x: -3, y: 48, r: -3, livre: [-6, 56, 54], ep: 6, brille: 0, ou: D('L’assise des tabourets de la coiffeuse.', 'The seats of the dressing-table stools.', 'La seduta degli sgabelli della toeletta.'), vue: { r: 'rendu-coiffeuse', pos: '30% 96%', zoom: 2.4 } },
  { f: 'terrazzo-carreau', nom: 'Terrazzo rose', w: 20, ratio: 376 / 292, x: 40, y: 2, r: -4, livre: [40, 6, 32], ep: 12, brille: 0.45, ou: D('La banque d’accueil et le sol des vestiaires.', 'The reception desk and the changing-room floor.', 'Il bancone dell’accoglienza e il pavimento degli spogliatoi.'), vue: { r: 'rendu-accueil', pos: '30% 82%', zoom: 2 } },
  { f: 'miroir', nom: 'Miroir de la coiffeuse', w: 20, ratio: 1.62, x: 62, y: 2, r: 4, livre: [62, 18, 32], ep: 2, bord: '#FFFFFF', brille: 0.35, photo: '/media/site/materiaux/miroir.webp', ou: D('Les miroirs en arche de la coiffeuse.', 'The arched mirrors of the dressing table.', 'Gli specchi ad arco della toeletta.'), vue: { r: 'rendu-coiffeuse', pos: '75% 45%', zoom: 1.7 } },
  { f: 'lustre', nom: 'Suspension de l’accueil', w: 15, ratio: 2.35, x: 36, y: 46, r: -5, livre: [18, 60, 28], ep: 2, bord: '#FFFFFF', brille: 0.2, photo: '/media/site/materiaux/lustre.webp', ou: D('Les suspensions en verre au-dessus de la banque d’accueil.', 'The glass pendant lights above the reception desk.', 'Le lampade a sospensione in vetro sopra il bancone dell’accoglienza.'), vue: { r: 'rendu-accueil', pos: '55% 30%', zoom: 1.8 } },
  { f: 'pilates', nom: 'Lettres en bois de l’accueil', w: 36, ratio: 0.24, x: 22, y: 38, r: -6, livre: [8, 40, 56], ep: 9, brille: 0.15, mot: 'PILATES', ou: D('Le nom du studio, en lettres de bois, au mur de l’accueil.', 'The studio’s name, in wooden letters, on the reception wall.', 'Il nome dello studio, in lettere di legno, sulla parete dell’accoglienza.'), vue: { r: 'rendu-accueil', pos: '45% 38%', zoom: 2.6 } },
  { f: 'peinture-goutte', nom: 'Peinture rose', w: 13, ratio: 421 / 318, x: 52, y: 30, r: 0, livre: [52, 38, 22], ep: 3, brille: 0.55, ou: D('Le volume arrondi des vestiaires.', 'The rounded volume of the changing rooms.', 'Il volume arrotondato degli spogliatoi.'), vue: { r: 'rendu-vestiaire', pos: '50% 50%', zoom: 1.3 } },
  { f: 'aluminium', nom: 'Menuiseries aluminium', w: 12, ratio: 370 / 310, x: 52, y: 74, r: 12, livre: [56, 78, 20], ep: 14, brille: 0.6, ou: D('Les châssis vitrés de la salle de cours et le hublot des vestiaires.', 'The glazed frames of the studio and the porthole window in the changing rooms.', 'I serramenti vetrati della sala corsi e l’oblò degli spogliatoi.'), vue: { r: 'rendu-salle', pos: '78% 45%', zoom: 1.8 } },
];
/** L'image de la face d'un échantillon (pour une photo : le tirage lui-même). */
export const imageEchantillon = (e: Echantillon) => e.photo || `/media/site/materiaux/${e.mot ? 'bois' : e.f}.webp`;

/** Le nom de la pièce du projet où l'on voit chaque rendu. */
const PIECES: Record<string, L3> = {
  'rendu-accueil': D('Accueil', 'Reception', 'Accoglienza'),
  'rendu-salle': D('Salle de cours', 'Studio', 'Sala corsi'),
  'rendu-vestiaire': D('Vestiaires', 'Changing rooms', 'Spogliatoi'),
  'rendu-coiffeuse': D('Coiffeuse', 'Dressing table', 'Toeletta'),
};

/**
 * Pilates Room : la planche des matériaux, en volume, et sa fiche. On clique un échantillon (sur la planche ou
 * dans la liste) : la caméra s'en approche, la fiche dit ce que c'est, où il est dans le projet, et montre le
 * rendu cadré dessus. On tourne autour de la planche en glissant, la molette rapproche (experience/materiaux.ts).
 */
export default function Materiautheque({ lang, credit }: { lang: Lang; credit?: string }) {
  const L = tr(lang, {
    fr: { titre: 'Les matériaux', aide: 'Cliquez un échantillon, sur la planche ou dans la liste.', ou: 'Où', dans: 'Dans le projet', retour: 'Tous les matériaux' },
    en: { titre: 'The materials', aide: 'Click a sample, on the board or in the list.', ou: 'Where', dans: 'In the project', retour: 'All materials' },
    it: { titre: 'I materiali', aide: 'Cliccate un campione, sulla tavola o nell’elenco.', ou: 'Dove', dans: 'Nel progetto', retour: 'Tutti i materiali' },
  });
  return (
    <section className={`${styles.mat} rv`} aria-label={L.titre} data-materiaux-bloc>
      <div className={styles.matScene} data-materiaux-scene>
        <div className={styles.matTable} data-materiaux>
          {/* le carton de la planche, sous les échantillons */}
          <span className={styles.matPlanche} aria-hidden="true" />
          {ECHANTILLONS.map((e) => {
            const src = imageEchantillon(e);
            const style = { ['--x' as string]: e.x, ['--y' as string]: e.y, ['--r' as string]: e.r, ['--w' as string]: e.w, ['--ep' as string]: `${e.ep}px`, ['--brille' as string]: e.brille, ['--img' as string]: e.photo || e.mot ? 'linear-gradient(#fff, #fff)' : `url(${src})`, ['--bois' as string]: `url(${src})`, aspectRatio: `1 / ${e.ratio}` };
            // les lettres en bois : le mot, empilé en épaisseur, la face en bois
            if (e.mot) return (
              <button key={e.f} type="button" className={styles.matEch} data-echantillon={e.f} data-mot="" aria-label={nomMateriau(e.nom, lang)} data-ep={e.ep} style={style}>
                <span className={styles.matMotOmbre} aria-hidden="true">{e.mot}</span>
                {Array.from({ length: e.ep }, (_, k) => <span key={k} className={styles.matMotCouche} style={{ ['--k' as string]: k }} aria-hidden="true">{e.mot}</span>)}
                <span className={styles.matMotFace} aria-hidden="true">{e.mot}</span>
              </button>
            );
            return (
              <button key={e.f} type="button" className={styles.matEch} data-echantillon={e.f} data-photo={e.photo ? '' : undefined} aria-label={nomMateriau(e.nom, lang)} data-ep={e.ep} style={style}>
                <span className={styles.matOmbre} aria-hidden="true" />
                {/* la tranche : des feuilles empilées, au pixel près */}
                {Array.from({ length: e.ep }, (_, k) => (
                  <span key={k} className={styles.matCouche} data-bord={e.bord ? '' : undefined} style={{ ['--k' as string]: k, ...(e.bord ? { background: e.bord } : {}) }} aria-hidden="true" />
                ))}
                <span className={styles.matFace} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" draggable={false} loading="lazy" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* la fiche : d'abord la liste des matériaux ; un clic ouvre la fiche de l'un d'eux */}
      <aside className={styles.matFiches} data-materiaux-fiches aria-live="polite">
        <div className={styles.matListe} data-fiche-liste>
          <h3 className={styles.matListeT}>{L.titre}</h3>
          <p className={styles.matAide}>{L.aide}</p>
          <ul>
            {ECHANTILLONS.map((e) => (
              <li key={e.f}>
                <button type="button" data-choisir={e.f}>
                  <i style={{ backgroundImage: `url(${imageEchantillon(e)})` }} aria-hidden="true" />
                  {nomMateriau(e.nom, lang)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {ECHANTILLONS.map((e) => (
          <article key={e.f} className={styles.matFiche} data-fiche={e.f} hidden>
            <button type="button" className={styles.matRetour} data-choisir="">← {L.retour}</button>
            <h3 className={styles.matFicheT}>{nomMateriau(e.nom, lang)}</h3>
            <p className={styles.matOu}><b>{L.ou}</b>{e.ou[lang]}</p>
            <figure className={styles.matVue}>
              <span style={{ backgroundImage: `url(/media/pilates-room/images/${e.vue.r}-1000.webp)`, backgroundPosition: e.vue.pos, backgroundSize: `${e.vue.zoom * 100}%` }} />
              <figcaption>{L.dans} · {PIECES[e.vue.r]?.[lang]}</figcaption>
            </figure>
          </article>
        ))}
      </aside>
      {credit && <p className={styles.matCredit}>{credit}</p>}
    </section>
  );
}
