// Aperçu du site en une seule page, pour l'afficher comme artefact sur claude.ai.
// L'hébergeur d'artefacts ne sert que des adresses relatives et n'exécute pas le routeur de Next :
// on reprend donc le HTML exporté (out/) de chaque page, les styles, et un petit script (runtime.js)
// qui refait la navigation et les parties interactives. Les images restent des fichiers à côté (media/).
// Usage : npm run build, servir out/ sur le port 4321, puis
//   PLAYWRIGHT_FROM=<dossier contenant playwright>/package.json node tools/apercu/construire.mjs <sortie.html>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(root, 'out');
const BASE = process.env.APERCU_BASE || 'http://localhost:4321';
const sortie = process.argv[2] || path.join(root, 'apercu.html');
const require = createRequire(process.env.PLAYWRIGHT_FROM || import.meta.url);
const { chromium } = require('playwright');
const requireLocal = createRequire(import.meta.url);

const LANGS = ['fr', 'en', 'it'];
const routes = [];
const parcours = (dir, url) => {
  if (fs.existsSync(path.join(dir, 'index.html'))) routes.push(url);
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) if (d.isDirectory()) parcours(path.join(dir, d.name), `${url}${d.name}/`);
};
LANGS.forEach((l) => parcours(path.join(OUT, l), `/${l}/`));

/* adresses : médias et polices en relatif, sans ?v= ; liens internes vers le routeur (#/fr/...) */
const relatif = (s) => s
  .replace(/\?v=[0-9a-f]+/g, '')
  .replace(/([\s"',;(])\/(media|fonts)\//g, '$1$2/')
  .replace(/([\s"',;(])\/(favicon\.svg|portfolio-laura-pras\.pdf|cv-laura-pras\.pdf)/g, '$1$2')
  .replace(/href="\/(fr|en|it)(\/[^"]*)?"/g, (_, l, r = '/') => `href="#/${l}${r}"`)
  .replace(/<script\b[\s\S]*?<\/script>/g, '');

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ javaScriptEnabled: false })).newPage();
const css = new Set();
const pages = [];
const chrome = {};
for (const r of routes) {
  await page.goto(`${BASE}${r}`, { waitUntil: 'load' });
  const d = await page.evaluate(() => ({
    titre: document.title,
    css: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href')),
    main: document.querySelector('main#contenu').innerHTML,
    header: document.querySelector('body > header').outerHTML,
    footer: document.querySelector('.page > footer').outerHTML,
    ouverture: document.querySelector('[class*="__ouverture"]').outerHTML,
    donnees: document.getElementById('lp-donnees')?.textContent || '{}',
  }));
  d.css.forEach((h) => css.add(h));
  pages.push({ r, titre: d.titre, main: relatif(d.main) });
  const l = r.slice(1, 3);
  if (r === `/${l}/`) chrome[l] = { header: relatif(d.header), footer: relatif(d.footer), ouverture: relatif(d.ouverture), donnees: relatif(d.donnees) };
}
await b.close();

/* styles : polices intégrées, médias en relatif */
const police = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(OUT, 'fonts', f)).toString('base64')})`;
let styles = [...css].map((h) => fs.readFileSync(path.join(OUT, h.replace(/^\//, '')), 'utf8')).join('\n');
styles = styles.replace(/url\(\/fonts\/([^)]+)\)/g, (_, f) => police(f)).replace(/url\(\/media\//g, 'url(media/').replace(/\/\*# sourceMappingURL=[^*]*\*\//g, '');

/* table des classes des modules CSS : « project.lightbox » → « project-module__XXXX__lightbox » */
const classes = {};
for (const m of styles.matchAll(/\.((\w+)-module__[A-Za-z0-9-]+?__([A-Za-z0-9]+))/g)) classes[`${m[2]}.${m[3]}`] = m[1];
const textes = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', `${l}.json`), 'utf8'))]));
/* couche « expérience » : les modules TypeScript de src/experience, transpilés et réunis dans XP */
const ts = requireLocal('typescript');
const MODULES = ['outils', 'transition', 'anim', 'lightbox', 'explorer', 'visite', 'chapitres', 'vues', 'fiches', 'index'];
const xp = MODULES.map((m) => ts.transpileModule(fs.readFileSync(path.join(root, 'src/experience', `${m}.ts`), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText
  .replace(/^import[^;]*;$/gm, '').replace(/^export \{\};?$/gm, '').replace(/^export (?=(async )?function|const|let|class)/gm, '')).join('\n');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const html = `<title>Portfolio Laura Pras</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<script>try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='on'}catch(e){}</script>
<style>${styles}</style>
<a class="skip" href="#contenu">${textes.fr.nav.skip}</a>
<div class="${classes['home.ouverture']}"></div>
<header></header>
<div class="page"><main id="contenu"></main><footer></footer></div>
${LANGS.map((l) => `<script type="application/json" id="lp-donnees-${l}">${chrome[l].donnees.replace(/<\//g, '<\\/')}</script>`).join('\n')}
${LANGS.map((l) => `<template data-h="${l}">${chrome[l].header}</template><template data-f="${l}">${chrome[l].footer}</template><template data-o="${l}">${chrome[l].ouverture}</template>`).join('\n')}
${pages.map((p) => `<template data-r="${p.r}" data-titre="${attr(p.titre)}">${p.main}</template>`).join('\n')}
<script type="application/json" id="apercu-classes">${json(classes)}</script>
<script type="application/json" id="apercu-textes">${json(textes)}</script>
<script>const XP = (() => {\n${xp}\nreturn { xpDemarrer, xpPage, xpTransition };\n})();\n${fs.readFileSync(path.join(root, 'tools/apercu/runtime.js'), 'utf8')}</script>
`;
fs.writeFileSync(sortie, html);

/* fichiers à publier à côté : tout ce que la page référence sous media/ et à la racine */
const refs = new Set([...html.matchAll(/(?:["\s,(;]|&quot;)((?:media\/[^"'\s,)&?$`]+)|favicon\.svg|portfolio-laura-pras\.pdf|cv-laura-pras\.pdf)/g)].map((m) => m[1]));
const manquants = [...refs].filter((f) => !fs.existsSync(path.join(OUT, f)));
fs.writeFileSync(sortie.replace(/\.html$/, '.fichiers.json'), JSON.stringify([...refs].filter((f) => !manquants.includes(f)).sort(), null, 1));
console.log(`${pages.length} pages, ${Object.keys(classes).length} classes, ${(html.length / 1024).toFixed(0)} Ko, ${refs.size} fichiers référencés${manquants.length ? `, manquants : ${manquants.join(', ')}` : ''}`);
