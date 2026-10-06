// Génère public/cv-laura-pras.pdf (A4) à partir de content/site/cv.json.
// Usage : node tools/cv_pdf.mjs  (nécessite le paquet « playwright » et un Chromium)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(process.env.PLAYWRIGHT_FROM || import.meta.url);
const { chromium } = require('playwright');
const cv = JSON.parse(fs.readFileSync(path.join(root, 'content/site/cv.json'), 'utf8'));
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64')}`;
const img = (f) => `data:image/webp;base64,${fs.readFileSync(path.join(root, f)).toString('base64')}`;
const logo = fs.readFileSync(path.join(root, 'content/logo/cabane/symbole.svg'), 'utf8');
const dots = (n) => Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(${font('ebg-400.woff2')})}@font-face{font-family:M;font-weight:300;src:url(${font('mont-300.woff2')})}@font-face{font-family:M;font-weight:500;src:url(${font('mont-500.woff2')})}
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font:300 9pt/1.45 M,sans-serif;overflow:hidden;color:#2B211C;background:#FEFEFC;width:210mm;height:297mm;padding:16mm 16mm 14mm;display:grid;grid-template-columns:62mm 1fr;gap:10mm}
h1{font:400 34pt/1 G,serif;margin:0}h2{font:500 7.4pt M;letter-spacing:.16em;text-transform:uppercase;color:#6B5A4E;margin:0 0 3mm;border-top:.6pt solid #2B211C;padding-top:2mm}
.side img{width:46mm;filter:grayscale(1) sepia(.15);margin:5mm 0}.logo svg{width:18mm;height:auto;display:block}section{margin-bottom:5mm}
.item{display:grid;grid-template-columns:22mm 1fr;gap:3mm;margin-bottom:2.4mm}.y{color:#8E4A30;font-size:8pt}.item b{font-weight:500;display:block}.item small{color:#6B5A4E;font-size:8.4pt}
.sk{display:flex;justify-content:space-between;border-bottom:.4pt solid #D8CCBB;padding:1.1mm 0}.d{display:inline-flex;gap:1.2mm;align-items:center}.d i{width:2.2mm;height:2.2mm;border-radius:50%;border:.6pt solid #A46B57}.d i.on{background:#A46B57}
.lead{font:400 13pt/1.35 G,serif;margin:4mm 0 5mm}.c{font-size:8.6pt;line-height:1.7}ul{margin:0;padding-left:4mm}
</style><body>
<aside class="side"><div class="logo">${logo}</div><img src="${img('content/site/images/portrait-1000.webp')}">
<section><h2>Contact</h2><div class="c">${cv.email}<br>${cv.telephone}<br>${cv.ville}</div></section>
<section><h2>Logiciels</h2>${Object.entries(cv.logiciels_sur_5).map(([k, v]) => `<div class="sk"><span>${k}</span><span class="d">${dots(v)}</span></div>`).join('')}</section>
<section><h2>Savoir-faire</h2><ul>${cv.savoir_faire.map((s) => `<li>${s}</li>`).join('')}</ul></section>
</aside>
<main><h1>Laura Pras</h1><p class="lead">Étudiante en master Architecture, Environnement et Cultures Constructives, ENSA Grenoble. Ancienne dessinatrice en bâtiment.</p>
<section><h2>Profil</h2><p>${cv.presentation.fr}</p></section>
<section><h2>Formation</h2>${[...cv.formations].reverse().map((f) => `<div class="item"><span class="y">${f.annee}</span><span><b>${f.intitule}</b><small>${f.lieu}</small></span></div>`).join('')}</section>
<section><h2>Stages</h2>${cv.stages.map((s) => `<div class="item"><span class="y">${s.date}</span><span><b>${s.structure}, ${s.lieu}</b><small>${s.intitule}</small></span></div>`).join('')}</section>
<section><h2>Recherche</h2><p>${cv.recherche_texte.fr}</p></section>
</main></body></html>`;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.pdf({ path: path.join(root, 'public/cv-laura-pras.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
console.log('CV écrit : public/cv-laura-pras.pdf');
