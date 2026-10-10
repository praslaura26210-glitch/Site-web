import { xpCalme, xpDialogue, xpEl, xpFleche, xpSaisie, type XPContexte } from './outils';

/** Une image de la page, telle que la visionneuse plein écran la montre. */
export type XPEntree = { id?: string; legende: string; preview?: string; svg?: string; full?: string; ratio: number; credit?: string; thumb: string };

/** Toutes les images agrandissables de la page, dans l'ordre de lecture : planches et visionneuses. */
export function xpEntrees(root: ParentNode) {
  const out: { e: XPEntree; el: Element; k: number }[] = [];
  root.querySelectorAll('[data-zoom], [data-items]').forEach((el) => {
    const h = el as HTMLElement;
    if (h.dataset.zoom) out.push({ e: JSON.parse(h.dataset.zoom), el, k: 0 });
    else if (h.dataset.items) {
      const credit = h.dataset.credit || undefined;
      (JSON.parse(h.dataset.items) as { id?: string; src: string; svg?: string; full?: string; w: number; h: number; legende: string; vect?: boolean }[])
        .forEach((m, k) => out.push({ e: { id: m.id, legende: m.legende, preview: m.vect ? undefined : m.src, svg: m.svg, full: m.full, ratio: m.w / m.h, credit, thumb: m.src }, el, k }));
    }
  });
  return out;
}

/** Lecteur : zoom molette / pincement / boutons / double-clic / clavier, déplacement au glisser. */
function xpLecteur(scene: HTMLElement, onScale: (s: number) => void) {
  const canvas = xpEl('div', { class: 'xp-lb-canvas' });
  scene.append(canvas);
  const tf = { s: 1, x: 0, y: 0 };
  let p: XPEntree | null = null;
  let img: HTMLImageElement | null = null;
  let svgCharge = false, hd = false;

  const chargeSvg = () => {
    if (!p?.svg || svgCharge) return;
    svgCharge = true;
    const cible = p;
    fetch(p.svg).then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => {
      if (cible !== p) return;
      canvas.replaceChildren(xpEl('div', { html: t }));
      img = null;
    }).catch(() => { if (!img && cible === p) { img = xpEl('img', { src: cible.svg!, alt: '', draggable: 'false' }); canvas.append(img); } });
  };
  const apply = () => {
    canvas.style.transform = `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})`;
    if (tf.s > 1.6 && p) {
      if (p.svg && p.preview) chargeSvg();
      if (p.full && !hd && img) { hd = true; img.src = p.full; }
    }
    onScale(tf.s);
  };
  const fit = () => {
    if (!p) return;
    const v = scene.getBoundingClientRect();
    const w = Math.min(v.width, v.height * p.ratio);
    canvas.style.width = `${w}px`;
    Object.assign(tf, { s: 1, x: (v.width - w) / 2, y: (v.height - w / p.ratio) / 2 });
    apply();
  };
  const zoomAt = (f: number, cx: number, cy: number) => {
    const s = Math.min(24, Math.max(0.6, tf.s * f));
    const k = s / tf.s;
    tf.x = cx - (cx - tf.x) * k; tf.y = cy - (cy - tf.y) * k; tf.s = s;
    apply();
  };
  const centre = () => { const r = scene.getBoundingClientRect(); return [r.width / 2, r.height / 2] as const; };

  scene.addEventListener('wheel', (e) => { e.preventDefault(); const r = scene.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  scene.addEventListener('dblclick', (e) => {
    const r = scene.getBoundingClientRect();
    if (tf.s > 1.2) fit(); else zoomAt(2.5, e.clientX - r.left, e.clientY - r.top);
  });
  const pts = new Map<number, { x: number; y: number }>();
  scene.addEventListener('pointerdown', (e) => { if ((e.target as Element).closest('button')) return; scene.setPointerCapture?.(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
  scene.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    if (pts.size === 1 && tf.s > 1.05) { tf.x += e.clientX - prev.x; tf.y += e.clientY - prev.y; apply(); }
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const autre = a === prev ? b : a;
      const d0 = Math.hypot(prev.x - autre.x, prev.y - autre.y);
      const d1 = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
      const r = scene.getBoundingClientRect();
      if (d0 > 0) zoomAt(d1 / d0, (e.clientX + autre.x) / 2 - r.left, (e.clientY + autre.y) / 2 - r.top);
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const up = (e: PointerEvent) => pts.delete(e.pointerId);
  scene.addEventListener('pointerup', up);
  scene.addEventListener('pointercancel', up);

  return {
    charger(e: XPEntree) {
      p = e; svgCharge = false; hd = false; img = null;
      canvas.replaceChildren();
      if (e.preview) { img = xpEl('img', { src: e.preview, alt: '', draggable: 'false' }); canvas.append(img); } else chargeSvg();
      fit();
    },
    fit,
    zoom: (f: number) => { const [x, y] = centre(); zoomAt(f, x, y); },
    deplace: (dx: number, dy: number) => { tf.x += dx; tf.y += dy; apply(); },
    echelle: () => tf.s,
  };
}

/** Ouvre la visionneuse plein écran sur l'image i de la page ; ← → pour parcourir toutes les images. */
export function xpOuvrirLightbox(ctx: XPContexte, root: ParentNode, i: number) {
  const T = ctx.D.t;
  const liste = xpEntrees(root).map((x) => x.e);
  if (!liste.length) return;
  const n = liste.length;
  let cur = Math.max(0, Math.min(n - 1, i));

  const compte = xpEl('span', { class: 'xp-lb-compte' });
  const legende = xpEl('p', { class: 'xp-lb-legende' });
  const bPlanche = xpEl('button', { type: 'button', class: 'xp-lb-bouton', 'aria-pressed': 'false', title: `${T.planche} (G)`, html: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1.5" y="1.5" width="5" height="5"/><rect x="9.5" y="1.5" width="5" height="5"/><rect x="1.5" y="9.5" width="5" height="5"/><rect x="9.5" y="9.5" width="5" height="5"/></svg><span>' + T.planche + '</span>' });
  const bFermer = xpEl('button', { type: 'button', class: 'xp-lb-fermer', 'aria-label': T.fermer, text: '✕' });
  const scene = xpEl('div', { class: 'xp-lb-scene', tabindex: '0', role: 'img' });
  const prec = xpEl('button', { type: 'button', class: 'xp-lb-nav xp-lb-prec', 'aria-label': T.precedent, html: xpFleche(-1) });
  const suiv = xpEl('button', { type: 'button', class: 'xp-lb-nav xp-lb-suiv', 'aria-label': T.suivant, html: xpFleche(1) });
  const credit = xpEl('p', { class: 'xp-lb-credit' });
  const echelle = xpEl('span', { class: 'xp-lb-echelle', text: '×1.0' });
  const zIn = xpEl('button', { type: 'button', 'aria-label': T.zoomIn, text: '+' });
  const zOut = xpEl('button', { type: 'button', 'aria-label': T.zoomOut, text: '−' });
  const zFit = xpEl('button', { type: 'button', 'aria-label': T.zoomReset, text: '⤢' });
  const grille = xpEl('div', { class: 'xp-lb-grille', hidden: true });
  const fil = xpEl('div', { class: 'xp-lb-fil', 'aria-hidden': 'true' });
  const d = xpEl('dialog', { class: 'xp-lb', 'aria-label': T.planche }, [
    xpEl('div', { class: 'xp-lb-haut' }, [compte, legende, xpEl('div', { class: 'xp-lb-actions' }, [n > 1 ? bPlanche : null, bFermer])]),
    scene, n > 1 ? prec : null, n > 1 ? suiv : null,
    xpEl('div', { class: 'xp-lb-bas' }, [credit, xpEl('div', { class: 'xp-lb-zoom' }, [echelle, zOut, zIn, zFit])]),
    n > 1 ? fil : null, grille,
  ]);
  const lecteur = xpLecteur(scene, (s) => { echelle.textContent = '×' + s.toFixed(1); d.toggleAttribute('data-zoome', s > 1.05); });

  // fil : un trait par image, l'image courante en terre cuite
  for (let k = 0; k < n; k++) fil.append(xpEl('i'));
  // planche : toutes les images de la page en vignettes
  liste.forEach((e, k) => {
    const b = xpEl('button', { type: 'button', 'aria-label': e.legende }, [xpEl('img', { src: e.thumb, alt: '', loading: 'lazy' }), xpEl('span', { text: String(k + 1).padStart(2, '0') })]);
    b.addEventListener('click', () => { montre(k); planche(false); });
    grille.append(b);
  });

  let sens = 0;
  const montre = (k: number) => {
    sens = k > cur ? 1 : k < cur ? -1 : 0;
    cur = (k + n) % n;
    const e = liste[cur];
    compte.innerHTML = `${String(cur + 1).padStart(2, '0')}<span> / ${String(n).padStart(2, '0')}</span>`;
    legende.textContent = e.legende;
    scene.setAttribute('aria-label', e.legende);
    credit.textContent = e.credit || '';
    [...fil.children].forEach((t, j) => t.toggleAttribute('data-on', j === cur));
    [...grille.children].forEach((t, j) => (j === cur ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    if (!xpCalme() && sens) { scene.dataset.sens = String(sens); scene.classList.remove('xp-lb-entre'); void scene.offsetWidth; scene.classList.add('xp-lb-entre'); }
    lecteur.charger(e);
    [liste[(cur + 1) % n], liste[(cur - 1 + n) % n]].forEach((x) => { if (x.preview) new Image().src = x.preview; });
  };
  const va = (k: number) => montre(cur + k);
  const planche = (o?: boolean) => {
    const ouvert = o ?? grille.hidden;
    grille.hidden = !ouvert;
    bPlanche.setAttribute('aria-pressed', String(ouvert));
    d.toggleAttribute('data-planche', ouvert);
    if (ouvert) (grille.children[cur] as HTMLElement)?.focus(); else scene.focus();
  };

  prec.addEventListener('click', () => va(-1));
  suiv.addEventListener('click', () => va(1));
  bPlanche.addEventListener('click', () => planche());
  bFermer.addEventListener('click', () => d.close());
  zIn.addEventListener('click', () => lecteur.zoom(1.4));
  zOut.addEventListener('click', () => lecteur.zoom(1 / 1.4));
  zFit.addEventListener('click', () => lecteur.fit());

  // glisser pour passer à l'image suivante, seulement quand l'image n'est pas agrandie
  let x0: number | null = null;
  scene.addEventListener('pointerdown', (e) => { x0 = lecteur.echelle() <= 1.05 ? e.clientX : null; });
  scene.addEventListener('pointerup', (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (n > 1 && Math.abs(dx) > 60) va(dx < 0 ? 1 : -1);
  });

  const touche = (e: KeyboardEvent) => {
    if (xpSaisie(e)) return;
    if (e.key === 'ArrowRight' && lecteur.echelle() <= 1.05) va(1);
    else if (e.key === 'ArrowLeft' && lecteur.echelle() <= 1.05) va(-1);
    else if (e.key.startsWith('Arrow')) lecteur.deplace(e.key === 'ArrowLeft' ? 60 : e.key === 'ArrowRight' ? -60 : 0, e.key === 'ArrowUp' ? 60 : e.key === 'ArrowDown' ? -60 : 0);
    else if (e.key === '+' || e.key === '=') lecteur.zoom(1.25);
    else if (e.key === '-') lecteur.zoom(0.8);
    else if (e.key === '0') lecteur.fit();
    else if ((e.key === 'g' || e.key === 'G') && n > 1) planche();
    else return;
    e.preventDefault();
  };
  d.addEventListener('keydown', touche);
  const redim = () => lecteur.fit();
  addEventListener('resize', redim);
  xpDialogue(d, () => removeEventListener('resize', redim));
  scene.focus();
  requestAnimationFrame(() => montre(cur));
}

/** Clic sur une image de la page : visionneuse plein écran. Retourne la fonction de nettoyage. */
export function xpLightboxPage(ctx: XPContexte, root: HTMLElement) {
  const clic = (ev: MouseEvent) => {
    const b = (ev.target as Element).closest('[data-zoom]');
    if (!b || !root.contains(b)) return;
    ev.preventDefault();
    const i = xpEntrees(root).findIndex((x) => x.el === b);
    xpOuvrirLightbox(ctx, root, i);
  };
  // une visionneuse (composant React ou script de l'aperçu) demande l'agrandissement de son image k
  const zoom = (ev: Event) => {
    const { el, k } = (ev as CustomEvent<{ el: Element; k: number }>).detail;
    const i = xpEntrees(root).findIndex((x) => x.el === el && x.k === k);
    if (i >= 0) xpOuvrirLightbox(ctx, root, i);
  };
  // arrivée sur un dessin précis (#d-…), depuis l'explorateur ou un lien
  let t = 0;
  const parAncre = () => {
    const h = ctx.ancre();
    if (!h.startsWith('d-')) return;
    const i = xpEntrees(root).findIndex((x) => x.e.id === h);
    if (i < 0) return;
    clearTimeout(t);
    t = window.setTimeout(() => {
      (xpEntrees(root)[i].el as HTMLElement).scrollIntoView({ block: 'center' });
      if (!document.querySelector('dialog.xp-lb')) xpOuvrirLightbox(ctx, root, i);
    }, 350);
  };
  root.addEventListener('click', clic);
  addEventListener('lp:zoom', zoom);
  addEventListener('lp:ancre', parAncre);
  parAncre();
  return () => { clearTimeout(t); root.removeEventListener('click', clic); removeEventListener('lp:zoom', zoom); removeEventListener('lp:ancre', parAncre); };
}
