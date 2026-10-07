/**
 * Serveur pour travailler sur l'ordinateur, sans Netlify : imite Netlify Blobs dans .local/
 * et sert la fonction /api. Avec --dist, sert aussi le site construit (npm run local).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';
import { setEnvironmentContext } from '@netlify/blobs';

const PORT = Number(process.env.PORT ?? 8788);
const DIST = process.argv.includes('--dist') ? path.resolve('dist') : null;
process.env.MOT_DE_PASSE ??= 'test';

const blobs = new BlobsServer({ directory: path.resolve('.local/blobs'), token: 'local', port: 8789 });
await blobs.start();
setEnvironmentContext({ edgeURL: 'http://localhost:8789', uncachedEdgeURL: 'http://localhost:8789', siteID: 'local', token: 'local' });

const { gerer } = await import('../serveur/routes');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    const morceaux: Buffer[] = [];
    for await (const m of req) morceaux.push(m as Buffer);
    const corps = morceaux.length ? Buffer.concat(morceaux) : undefined;
    const r = await gerer(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: corps }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  if (DIST) {
    let fichier = path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!fichier.startsWith(DIST) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) fichier = path.join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(fichier)] ?? 'application/octet-stream' });
    fs.createReadStream(fichier).pipe(res);
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`Bibliothèque locale : http://localhost:${PORT} (mot de passe : ${process.env.MOT_DE_PASSE})`));
