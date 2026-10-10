import { xpOuvrirLightbox } from './lightbox';
import { xpEl, type XPContexte, type XPDessin } from './outils';

const ORDRE = ['croquis', 'maquette', 'site', 'plan', 'coupe', 'axo', 'detail', 'materiaux', 'experimentation', 'rendu', 'autre'];

/*
 * Page projet, « Feuilleter le projet » : toutes les pièces du projet sur une seule ligne, rangées par nature
 * (croquis, maquettes, plans, coupes, détails, rendus…). On glisse le long de la ligne et l'image change
 * aussitôt, comme on feuillette un carnet ; un clic l'ouvre en grand. Le décompte dit d'un coup d'œil
 * de quoi le projet est fait.
 */
export function xpFeuilleter(ctx: XPContexte, root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-feuilleter]');
  const slug = root.querySelector<HTMLElement>('[data-projet]')?.dataset.projet;
  if (!box || !slug || box.childElementCount) return () => {};
  const T = ctx.D.t;
  const rang = (d: XPDessin) => ORDRE.indexOf(d.nature || 'autre');
  const ds = ctx.D.dessins.filter((d) => d.slug === slug).map((d, k) => ({ d, k })).sort((a, b) => rang(a.d) - rang(b.d) || a.k - b.k).map((x) => x.d);
  if (ds.length < 3) return () => {};
  const n = ds.length;
  const groupes = ORDRE.map((k) => ({ k, items: ds.filter((d) => (d.nature || 'autre') === k) })).filter((g) => g.items.length);
  const nom = (k: string, c: number) => (T.natures[k] || [k, k])[c > 1 ? 1 : 0];

  // décompte : « 14 pièces : 1 croquis · 3 maquettes · … »
  const compte = xpEl('p', { class: 'xp-fe-compte' }, [
    xpEl('span', { class: 'xp-fe-total', text: T.feuilleterPieces.replace('{n}', String(n)) }),
    ...groupes.map((g) => xpEl('span', { text: `${g.items.length} ${nom(g.k, g.items.length)}` })),
  ]);
  const img = xpEl('img', { alt: '', draggable: 'false' });
  const cadre = xpEl('button', { type: 'button', class: 'xp-fe-cadre' }, [img]);
  const leg = xpEl('p', { class: 'xp-fe-legende' });
  const poignee = xpEl('i', { class: 'xp-fe-poignee' });
  const piste = xpEl('div', { class: 'xp-fe-piste', role: 'slider', tabindex: '0', 'aria-label': T.feuilleter, 'aria-valuemin': '1', 'aria-valuemax': String(n) });
  groupes.forEach((g) => {
    const seg = xpEl('div', { class: 'xp-fe-seg' }, [xpEl('span', { class: 'xp-fe-segNom', text: nom(g.k, g.items.length) })]);
    seg.style.flexGrow = String(g.items.length);
    g.items.forEach(() => seg.append(xpEl('b')));
    piste.append(seg);
  });
  piste.append(poignee);
  box.append(
    xpEl('div', { class: 'xp-fe-tete' }, [xpEl('h2', { class: 'eyebrow', text: T.feuilleter }), compte]),
    cadre, leg, piste,
    xpEl('p', { class: 'xp-fe-aide', text: T.feuilleterAide }),
  );

  // tout précharger au premier passage : le feuilletage doit être instantané
  let precharge = false;
  const charge = () => { if (precharge) return; precharge = true; ds.forEach((d) => { new Image().src = d.thumb; }); };
  let cur = -1;
  const montre = (i: number) => {
    i = Math.max(0, Math.min(n - 1, i));
    if (i === cur) return;
    cur = i;
    const d = ds[i];
    img.src = d.thumb;
    img.alt = d.legende;
    cadre.toggleAttribute('data-dessin', !!d.dessin);
    cadre.setAttribute('aria-label', `${d.legende}`);
    leg.innerHTML = `<b>${d.legende}</b><span>${nom(d.nature || 'autre', 1)}</span><span>${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>`;
    poignee.style.left = `${((i + 0.5) / n) * 100}%`;
    piste.setAttribute('aria-valuenow', String(i + 1));
    piste.setAttribute('aria-valuetext', `${d.legende}, ${nom(d.nature || 'autre', 1)}`);
  };
  const depuis = (x: number) => { const r = piste.getBoundingClientRect(); montre(Math.floor(((x - r.left) / r.width) * n)); };
  let tire = false;
  piste.addEventListener('pointerenter', charge);
  piste.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || tire) depuis(e.clientX); });
  piste.addEventListener('pointerdown', (e) => { charge(); tire = true; piste.setPointerCapture(e.pointerId); depuis(e.clientX); });
  piste.addEventListener('pointerup', () => (tire = false));
  piste.addEventListener('pointercancel', () => (tire = false));
  piste.addEventListener('keydown', (e) => {
    const pas: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
    if (e.key in pas) { e.preventDefault(); charge(); montre(cur + pas[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); montre(0); }
    else if (e.key === 'End') { e.preventDefault(); montre(n - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); ouvre(); }
  });
  // la visionneuse plein écran, sur les pièces dans l'ordre du feuilletage
  const tiroir = xpEl('div');
  ds.forEach((d) => tiroir.append(xpEl('button', { 'data-zoom': JSON.stringify({ id: d.id, legende: d.legende, preview: d.preview, svg: d.svg, full: d.full, ratio: d.w / d.h, credit: d.credit, thumb: d.thumb }) })));
  const ouvre = () => xpOuvrirLightbox(ctx, tiroir, cur, img);
  cadre.addEventListener('click', ouvre);
  montre(0);
  return () => {};
}
