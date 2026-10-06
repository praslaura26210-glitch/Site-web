// Numéro de version des médias : l'empreinte du fichier est ajoutée à son adresse.
// Ainsi, quand une image change, le navigateur ne ressert pas l'ancienne copie qu'il garde en cache.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const memo = new Map<string, string>();

export function v(url: string): string {
  if (!url.startsWith('/media/')) return url;
  if (!memo.has(url)) {
    const f = path.join(process.cwd(), 'public', url);
    const h = fs.existsSync(f) ? crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8) : '0';
    memo.set(url, `${url}?v=${h}`);
  }
  return memo.get(url)!;
}
