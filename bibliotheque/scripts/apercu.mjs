/**
 * Construit l'aperçu de démonstration : une page autonome (dist-apercu/bibliotheque.html)
 * + les images et le contenu de départ à publier à côté.
 * Usage : npm run apercu
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('dist-apercu');
fs.rmSync(OUT, { recursive: true, force: true });
execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, VITE_DEMO: '1' } });

let html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const lireAsset = (rel) => fs.readFileSync(path.join(OUT, rel.replace(/^\.\//, '')), 'utf8');

const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => lireAsset(m[1])).join('\n');
const js = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((m) => lireAsset(m[1])).join('\n');

// la page est enveloppée à la publication : on ne garde que le titre, le style, la racine et le script
const page = [
  '<title>Bibliothèque</title>',
  `<style>${css}</style>`,
  '<div id="racine"></div>',
  `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`,
].join('\n');
fs.writeFileSync(path.join(OUT, 'bibliotheque.html'), page);

const depart = JSON.parse(fs.readFileSync('depart/depart.json', 'utf8'));
fs.mkdirSync(path.join(OUT, 'demo-images'), { recursive: true });
for (const [id, b64] of Object.entries(depart.images)) {
  fs.writeFileSync(path.join(OUT, 'demo-images', `${id}.webp`), Buffer.from(b64, 'base64'));
}
const fiches = depart.fiches;
fs.writeFileSync(path.join(OUT, 'demo-depart.json'), JSON.stringify({ version: depart.version, fiches, categories: depart.categories }));

console.log(`Aperçu : ${(page.length / 1024 / 1024).toFixed(2)} Mo, ${Object.keys(depart.images).length} images`);
