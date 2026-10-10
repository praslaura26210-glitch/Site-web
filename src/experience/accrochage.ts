import { xpOuvrirLightbox } from './lightbox';
import { xpCalme, xpEl, xpSaisie, type XPContexte, type XPDessin } from './outils';

/*
 * L'accrochage : tous les projets épinglés sur une même grande table, comme un mur de jury.
 * On se déplace en glissant, on zoome à la molette ou au pincement, on va droit à un projet (1 à 6),
 * on ouvre une planche d'un clic. La mini-carte dit toujours où l'on est.
 */

const PW = 1500;           // largeur d'un panneau (unités du monde = pixels à l'échelle 1)
const RH = 300;            // hauteur visée d'une rangée d'images
const G = 26;              // espace entre images
const CART = 190;          // hauteur du cartouche (numéro, titre, programme)
const GX = 280, GY = 320;  // espaces entre panneaux

type Place = { d: XPDessin; x: number; y: number; w: number; h: number };
type Panneau = { slug: string; x: number; y: number; w: number; h: number; places: Place[] };

/** Rangées justifiées : chaque rangée remplit exactement la largeur du panneau. */
function xpRangees(ds: XPDessin[]): { places: Place[]; h: number } {
  const places: Place[] = [];
  let y = 0, rang: XPDessin[] = [], somme = 0;
  const pose = (r: XPDessin[], hauteur: number) => {
    let x = 0;
    r.forEach((d) => { const w = hauteur * (d.w / d.h); places.push({ d, x, y, w, h: hauteur }); x += w + G; });
    y += hauteur + G;
  };
  ds.forEach((d) => {
    rang.push(d); somme += d.w / d.h;
    const h = (PW - G * (rang.length - 1)) / somme;
    if (h <= RH) { pose(rang, h); rang = []; somme = 0; }
  });
  if (rang.length) pose(rang, Math.min(RH, (PW - G * (rang.length - 1)) / somme));
  return { places, h: Math.max(0, y - G) };
}

export function xpAccrochage(ctx: XPContexte, root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-accrochage]');
  if (!box) return () => {};
  const T = ctx.D.t;
  const vue = box.querySelector<HTMLElement>('[data-ac-vue]')!;
  const info = box.querySelector<HTMLElement>('[data-ac-info]')!;
  const infoDefaut = info.textContent || '';

  // ---------- mise en page du monde ----------
  // trois colonnes sur un grand écran ; une seule sur un téléphone, où l'on arrive sur le premier projet
  const etroit = vue.clientWidth < 760;
  const COLS = etroit ? 1 : 3;
  const panneaux: Panneau[] = [];
  const lignes: number[] = [];
  ctx.D.projets.forEach((p, k) => {
    const { places, h } = xpRangees(ctx.D.dessins.filter((d) => d.slug === p.slug));
    const col = k % COLS, lig = Math.floor(k / COLS);
    panneaux.push({ slug: p.slug, x: col * (PW + GX), y: lig, w: PW, h: CART + h, places });
    lignes[lig] = Math.max(lignes[lig] || 0, CART + h);
  });
  const hautLigne = lignes.map((_, i) => lignes.slice(0, i).reduce((a, b) => a + b + GY, 0));
  panneaux.forEach((pn) => (pn.y = hautLigne[pn.y]));
  const MW = COLS * PW + (COLS - 1) * GX;
  const MH = lignes.reduce((a, b) => a + b, 0) + GY * (lignes.length - 1);

  // ---------- éléments ----------
  const monde = xpEl('div', { class: 'xp-ac-monde' });
  monde.style.width = `${MW}px`; monde.style.height = `${MH}px`;
  const imgs: { el: HTMLImageElement; w: number; petite: string; grande?: string }[] = [];
  panneaux.forEach((pn, k) => {
    const p = ctx.D.projets[k];
    const lien = xpEl('a', { href: ctx.href(p.href), class: 'xp-ac-ouvrir', 'data-xp-libre': '' }, [`${T.voirProjet} →`]);
    lien.addEventListener('click', (e) => { e.preventDefault(); if (!bouge) ctx.naviguer(p.href); });
    const sec = xpEl('section', { class: 'xp-ac-panneau', 'aria-label': p.titre, 'data-slug': p.slug }, [
      xpEl('header', { class: 'xp-ac-cartouche' }, [
        xpEl('span', { class: 'xp-ac-n', text: String(p.n).padStart(2, '0') }),
        xpEl('h2', { class: 'xp-ac-titre', text: p.titre }),
        xpEl('p', { class: 'xp-ac-meta', text: [p.programme, p.annee, p.lieu].filter(Boolean).join(' · ') }),
        lien,
      ]),
    ]);
    Object.assign(sec.style, { left: `${pn.x}px`, top: `${pn.y}px`, width: `${pn.w}px`, height: `${pn.h}px` });
    pn.places.forEach((pl) => {
      const zoom = { id: pl.d.id, legende: pl.d.legende, preview: pl.d.preview, svg: pl.d.svg, full: pl.d.full, ratio: pl.d.w / pl.d.h, credit: pl.d.credit, thumb: pl.d.thumb };
      const img = xpEl('img', { src: pl.d.thumb, alt: pl.d.legende, loading: 'lazy', draggable: 'false' });
      const b = xpEl('button', { type: 'button', class: `xp-ac-img${pl.d.dessin ? ' xp-ac-dessin' : ''}`, 'data-zoom': JSON.stringify(zoom), 'aria-label': pl.d.legende }, [img]);
      Object.assign(b.style, { left: `${pl.x}px`, top: `${CART + pl.y}px`, width: `${pl.w}px`, height: `${pl.h}px` });
      b.addEventListener('pointerenter', () => (info.innerHTML = `<b>${pl.d.legende}</b> · ${p.titre}`));
      b.addEventListener('pointerleave', () => (info.textContent = infoDefaut));
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (bouge) return;
        const liste = [...sec.querySelectorAll('[data-zoom]')];
        xpOuvrirLightbox(ctx, sec, liste.indexOf(b), img);
      });
      sec.append(b);
      imgs.push({ el: img, w: pl.w, petite: pl.d.thumb, grande: pl.d.preview });
    });
    monde.append(sec);
  });
  vue.append(monde);

  // mini-carte
  const carte = box.querySelector<HTMLElement>('[data-ac-carte]')!;
  const CW = 168, CS = CW / MW, CH = MH * CS;
  carte.style.width = `${CW}px`; carte.style.height = `${CH}px`;
  panneaux.forEach((pn) => {
    const r = xpEl('i');
    Object.assign(r.style, { left: `${pn.x * CS}px`, top: `${pn.y * CS}px`, width: `${pn.w * CS}px`, height: `${pn.h * CS}px` });
    carte.append(r);
  });
  const cadre = xpEl('b', { class: 'xp-ac-cadre' });
  carte.append(cadre);

  // boutons des projets
  const puces = box.querySelector<HTMLElement>('[data-ac-projets]')!;
  const boutonsProjets = ctx.D.projets.map((p, k) => {
    const b = xpEl('button', { type: 'button', title: p.titre, 'aria-label': p.titre, text: String(p.n).padStart(2, '0') });
    b.addEventListener('click', () => vers(panneaux[k]));
    puces.append(b);
    return b;
  });

  // ---------- caméra ----------
  const cam = { x: 0, y: 0, s: 1 };
  let smin = 0.05;
  const SMAX = 3;
  const pct = box.querySelector<HTMLElement>('[data-ac-pct]');
  let rafLod = 0;
  const lod = () => {
    rafLod = 0;
    imgs.forEach((i) => {
      if (!i.grande || i.el.dataset.hd) return;
      if (i.w * cam.s > 900) { i.el.dataset.hd = ''; const g = new Image(); g.onload = () => (i.el.src = i.grande!); g.src = i.grande; }
    });
  };
  const applique = () => {
    monde.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
    monde.style.setProperty('--px', String(1 / cam.s)); // un trait d'un pixel à l'écran, quel que soit le zoom
    box.toggleAttribute('data-loin', cam.s < 0.22);
    const v = vue.getBoundingClientRect();
    Object.assign(cadre.style, { left: `${(-cam.x / cam.s) * CS}px`, top: `${(-cam.y / cam.s) * CS}px`, width: `${(v.width / cam.s) * CS}px`, height: `${(v.height / cam.s) * CS}px` });
    if (pct) pct.textContent = `${Math.round(cam.s * 100)} %`;
    // projet au centre de l'écran
    const cx = (v.width / 2 - cam.x) / cam.s, cy = (v.height / 2 - cam.y) / cam.s;
    const ici = panneaux.findIndex((pn) => cx >= pn.x - GX / 2 && cx <= pn.x + pn.w + GX / 2 && cy >= pn.y - GY / 2 && cy <= pn.y + pn.h + GY / 2);
    boutonsProjets.forEach((b, k) => (k === ici && cam.s > smin * 1.6 ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    if (!rafLod) rafLod = requestAnimationFrame(lod);
  };
  // cadrer en laissant libres le titre et la mini-carte (en haut) et les commandes (en bas)
  const cadrage = (x: number, y: number, w: number, h: number) => {
    const v = vue.getBoundingClientRect();
    const haut = Math.min(150, (carte.offsetHeight || 0) + 40), bas = 90, cote = 40;
    const s = Math.min(SMAX, Math.max(smin, Math.min((v.width - cote * 2) / w, (v.height - haut - bas) / h)));
    return { s, x: v.width / 2 - (x + w / 2) * s, y: haut + (v.height - haut - bas) / 2 - (y + h / 2) * s };
  };
  let anim = 0;
  const vole = (but: { x: number; y: number; s: number }) => {
    cancelAnimationFrame(anim);
    if (xpCalme()) { Object.assign(cam, but); applique(); return; }
    const de = { ...cam }, t0 = performance.now(), D = 650;
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / D);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      // le zoom se fait en logarithme : le déplacement paraît régulier
      cam.s = Math.exp(Math.log(de.s) + (Math.log(but.s) - Math.log(de.s)) * e);
      cam.x = de.x + (but.x - de.x) * e; cam.y = de.y + (but.y - de.y) * e;
      applique();
      if (k < 1) anim = requestAnimationFrame(pas);
    };
    anim = requestAnimationFrame(pas);
  };
  const toutVoir = (instant = false) => {
    const c = cadrage(0, 0, MW, MH);
    smin = c.s * 0.7;
    if (instant) { Object.assign(cam, c); applique(); } else vole(c);
  };
  const vers = (pn: Panneau) => vole(cadrage(pn.x, pn.y, pn.w, pn.h));
  const zoomA = (f: number, cx: number, cy: number) => {
    cancelAnimationFrame(anim);
    const s = Math.min(SMAX, Math.max(smin, cam.s * f));
    const k = s / cam.s;
    cam.x = cx - (cx - cam.x) * k; cam.y = cy - (cy - cam.y) * k; cam.s = s;
    applique();
  };
  const centre = () => { const v = vue.getBoundingClientRect(); return [v.width / 2, v.height / 2] as const; };

  // ---------- gestes ----------
  vue.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = vue.getBoundingClientRect();
    zoomA(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
    vu();
  }, { passive: false });
  const pts = new Map<number, { x: number; y: number }>();
  let bouge = false, x0 = 0, y0 = 0;
  vue.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { bouge = false; x0 = e.clientX; y0 = e.clientY; }
    cancelAnimationFrame(anim);
  });
  const deplace = (e: PointerEvent) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    if (pts.size === 1) {
      if (!bouge && Math.hypot(e.clientX - x0, e.clientY - y0) > 5) { bouge = true; box.dataset.tire = ''; vu(); }
      if (bouge) { cam.x += e.clientX - prev.x; cam.y += e.clientY - prev.y; applique(); }
    } else if (pts.size === 2) {
      bouge = true;
      const [a, b] = [...pts.values()];
      const autre = a === prev ? b : a;
      const d0 = Math.hypot(prev.x - autre.x, prev.y - autre.y), d1 = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
      const r = vue.getBoundingClientRect();
      if (d0 > 0) zoomA(d1 / d0, (e.clientX + autre.x) / 2 - r.left, (e.clientY + autre.y) / 2 - r.top);
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const leve = (e: PointerEvent) => {
    pts.delete(e.pointerId);
    if (!pts.size) { delete box.dataset.tire; setTimeout(() => (bouge = false), 0); }
  };
  addEventListener('pointermove', deplace);
  addEventListener('pointerup', leve);
  addEventListener('pointercancel', leve);
  vue.addEventListener('dblclick', (e) => {
    if ((e.target as Element).closest('button, a')) return;
    const r = vue.getBoundingClientRect();
    zoomA(2, e.clientX - r.left, e.clientY - r.top);
  });
  const touche = (e: KeyboardEvent) => {
    if (xpSaisie(e) || document.querySelector('dialog[open]') || e.metaKey || e.ctrlKey || e.altKey) return;
    const [cx, cy] = centre();
    if (e.key === '+' || e.key === '=') zoomA(1.3, cx, cy);
    else if (e.key === '-') zoomA(1 / 1.3, cx, cy);
    else if (e.key === '0') toutVoir();
    else if (/^[1-9]$/.test(e.key) && panneaux[+e.key - 1]) vers(panneaux[+e.key - 1]);
    else if (e.key.startsWith('Arrow') && (e.target === vue || e.target === document.body)) {
      cam.x += e.key === 'ArrowLeft' ? 90 : e.key === 'ArrowRight' ? -90 : 0;
      cam.y += e.key === 'ArrowUp' ? 90 : e.key === 'ArrowDown' ? -90 : 0;
      applique();
    } else return;
    e.preventDefault(); vu();
  };
  addEventListener('keydown', touche, true);

  // mini-carte : cliquer ou glisser pour aller ailleurs
  let surCarte = false;
  const surLaCarte = (e: PointerEvent) => {
    const r = carte.getBoundingClientRect(), v = vue.getBoundingClientRect();
    const mx = (e.clientX - r.left) / CS, my = (e.clientY - r.top) / CS;
    cancelAnimationFrame(anim);
    cam.x = v.width / 2 - mx * cam.s; cam.y = v.height / 2 - my * cam.s;
    applique();
  };
  carte.addEventListener('pointerdown', (e) => { e.stopPropagation(); surCarte = true; carte.setPointerCapture(e.pointerId); surLaCarte(e); vu(); });
  carte.addEventListener('pointermove', (e) => surCarte && surLaCarte(e));
  carte.addEventListener('pointerup', () => (surCarte = false));

  box.querySelector('[data-ac-plus]')?.addEventListener('click', () => { const [x, y] = centre(); zoomA(1.4, x, y); });
  box.querySelector('[data-ac-moins]')?.addEventListener('click', () => { const [x, y] = centre(); zoomA(1 / 1.4, x, y); });
  box.querySelector('[data-ac-tout]')?.addEventListener('click', () => toutVoir());

  // l'aide disparaît dès le premier geste
  const vu = () => box.setAttribute('data-explore', '');
  const redim = () => applique();
  addEventListener('resize', redim);
  requestAnimationFrame(() => {
    toutVoir(true);
    if (etroit) Object.assign(cam, cadrage(panneaux[0].x, panneaux[0].y, panneaux[0].w, Math.min(panneaux[0].h, 1400)));
    applique();
  });

  return () => {
    cancelAnimationFrame(anim); cancelAnimationFrame(rafLod);
    removeEventListener('pointermove', deplace); removeEventListener('pointerup', leve); removeEventListener('pointercancel', leve);
    removeEventListener('keydown', touche, true); removeEventListener('resize', redim);
  };
}
