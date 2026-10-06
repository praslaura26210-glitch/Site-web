// Copie les médias de content/ vers public/media/ avant chaque build (le site ne lit que public/).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'content');
const dst = path.join(root, 'public', 'media');

function copyDir(from, to, filter = () => true) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) n += copyDir(a, b, filter);
    else if (filter(e.name)) {
      if (!fs.existsSync(b) || fs.statSync(b).mtimeMs < fs.statSync(a).mtimeMs) {
        // plans : couleurs de repli accordées au site (quand le SVG est affiché en <img>, sans les variables CSS)
        if (a.endsWith('.svg')) fs.writeFileSync(b, fs.readFileSync(a, 'utf8').replaceAll('var(--encre,#000)', 'var(--encre,#2B211C)').replaceAll('var(--papier,#fff)', 'var(--papier,#FEFEFC)'));
        else fs.copyFileSync(a, b);
      }
      n++;
    }
  }
  return n;
}

let n = 0;
for (const slug of fs.readdirSync(path.join(src, 'projets'))) {
  const p = path.join(src, 'projets', slug);
  n += copyDir(path.join(p, 'images'), path.join(dst, slug, 'images'));
  n += copyDir(path.join(p, 'plans'), path.join(dst, slug, 'plans'));
  // données publiques du projet (maquette 3D, croquis vectorisés) ; pas les fiches ni les textes
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith('.json') || f === 'data.json' || f.startsWith('textes.')) continue;
    fs.mkdirSync(path.join(dst, slug), { recursive: true });
    fs.copyFileSync(path.join(p, f), path.join(dst, slug, f));
    n++;
  }
}
n += copyDir(path.join(src, 'site', 'images'), path.join(dst, 'site'));
n += copyDir(path.join(src, 'site', 'inspirations'), path.join(dst, 'site', 'inspirations'));
n += copyDir(path.join(src, 'intro'), path.join(dst, 'intro'));
n += copyDir(path.join(src, 'logo', 'cabane'), path.join(dst, 'logo'));
fs.copyFileSync(path.join(src, 'logo', 'cabane', 'favicon.svg'), path.join(root, 'public', 'favicon.svg'));
console.log(`médias synchronisés : ${n} fichiers`);
