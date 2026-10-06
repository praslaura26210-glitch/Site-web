// Résolution des médias d'un projet (au build) : images WebP et plans SVG.
import fs from 'node:fs';
import path from 'node:path';
import type { Projet } from './content';
import { v } from './ver';

export type Media = {
  /** image : WebP ; plan : SVG vectoriel, affiché en image et agrandi en vectoriel */
  kind: 'image' | 'plan';
  src: string;
  srcSmall?: string;
  /** version très haute définition chargée seulement à l'agrandissement */
  full?: string;
  /** SVG chargé à l'agrandissement (plans lourds affichés d'abord en aperçu) */
  svg?: string;
  w: number;
  h: number;
  legende: string;
  /** dessin scanné sur fond blanc : fondu dans la page */
  scan?: boolean;
};

const ROOT = path.join(process.cwd(), 'content', 'projets');

function viewBox(file: string): [number, number] {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(600);
  fs.readSync(fd, buf, 0, 600, 0);
  fs.closeSync(fd);
  const m = buf.toString('utf8').match(/viewBox="([\d.\-\s]+)"/);
  if (!m) return [1, 1];
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return [w, h];
}

/**
 * Références utilisées dans les séquences :
 * « nom » = image du projet ; « p:nom » = plan SVG ; « c:nom » = plan SVG cadré pour comparaison (existant / projet) ;
 * « x:nom » = plan très lourd : aperçu WebP, SVG à l'agrandissement.
 */
export function media(p: Projet, ref: string): Media {
  const [pre, nom] = ref.includes(':') ? ref.split(':') : ['', ref];
  if (pre) {
    const plan = p.plans.find((x) => x.nom === nom);
    if (!plan) throw new Error(`plan introuvable : ${p.slug}/${nom}`);
    const sub = pre === 'c' ? 'plans/comparaison' : 'plans';
    const [w, h] = viewBox(path.join(ROOT, p.slug, sub, `${nom}.svg`));
    const svg = v(`/media/${p.slug}/${sub}/${nom}.svg`);
    if (pre === 'x') return { kind: 'plan', src: v(`/media/${p.slug}/images/${nom}-apercu-2400.webp`), svg, w, h, legende: plan.legende, scan: true };
    return { kind: 'plan', src: svg, svg, w, h, legende: plan.legende };
  }
  const img = p.images.find((x) => x.nom === nom);
  if (!img) throw new Error(`image introuvable : ${p.slug}/${nom}`);
  const full = fs.existsSync(path.join(ROOT, p.slug, 'images', `${nom}-full.webp`)) ? v(`/media/${p.slug}/images/${nom}-full.webp`) : undefined;
  return { kind: 'image', src: img.src, srcSmall: img.srcSmall, full, w: img.w, h: img.h, legende: img.legende, scan: img.type === 'plan-scan' || img.type === 'croquis' || img.type === 'planche' };
}
