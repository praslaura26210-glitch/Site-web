import fs from 'node:fs';
import path from 'node:path';
import styles from './project.module.css';

/**
 * Un dessin vectoriel qui se construit quand il arrive à l'écran : ses formes apparaissent de bas en haut,
 * comme si on montait l'escalier pièce par pièce (experience/anim.ts pose data-vu). Un clic le rejoue.
 * Le SVG est écrit dans la page ; chaque forme reçoit son rang (--k) d'après sa hauteur dans le dessin.
 */
export default function Construction({ slug, nom, legende, rejouer }: { slug: string; nom: string; legende: string; rejouer: string }) {
  const brut = fs.readFileSync(path.join(process.cwd(), 'content/projets', slug, 'plans', `${nom}.svg`), 'utf8');
  const H = Number(brut.match(/viewBox="[\d.\-]+ [\d.\-]+ [\d.]+ ([\d.]+)"/)?.[1]) || 1;
  const PAS = 36;
  // le rang de chaque forme : sa hauteur (le y de son premier point), du bas vers le haut
  const svg = brut
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<path([^>]*?) d="M\s*([\d.\-]+)[\s,]+([\d.\-]+)/g, (_, a, x, y) => `<path${a} style="--k:${Math.round((1 - Number(y) / H) * PAS)}" d="M${x} ${y}`)
    .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ');
  return (
    <figure className={styles.cons}>
      <button type="button" className={styles.consDessin} data-construire="" aria-label={`${legende} — ${rejouer}`} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>{legende}</figcaption>
    </figure>
  );
}
