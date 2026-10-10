import { xpCalme, xpEl, type XPContexte } from './outils';

/* Animations de la page : tout ce qui apparaît en entrant à l'écran.
   Règle : le contenu reste lisible sans JavaScript ; on ne cache que ce qui est sous la ligne de flottaison. */

/** Observe une liste d'éléments ; data-vu quand ils entrent à l'écran. */
function xpQuandVisible(els: Element[], marge = '0px 0px -10% 0px') {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    (e.target as HTMLElement).dataset.vu = '';
    io.unobserve(e.target);
  }), { rootMargin: marge });
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}

/** Attend la fin de l'ouverture (porte de la cabane) avant de lancer f. */
function xpApresOuverture(f: () => void) {
  const html = document.documentElement;
  if (!html.dataset.intro) { f(); return () => {}; }
  const mo = new MutationObserver(() => { if (!html.dataset.intro) { mo.disconnect(); f(); } });
  mo.observe(html, { attributes: true, attributeFilter: ['data-intro'] });
  return () => mo.disconnect();
}

/** Titres : chaque mot monte de derrière un cache, l'un après l'autre. */
export function xpTitres(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const titres = [...root.querySelectorAll<HTMLElement>('h1, [class*="__inter"] h2, [class*="__livretT"], [class*="__suivantT"], [class*="__refHead"] h1')]
    .filter((h) => !h.dataset.mots && !h.closest('dialog'));
  titres.forEach((h) => {
    let k = 0;
    const decoupe = (n: Node): Node[] => {
      if (n.nodeType === 3) {
        return (n.textContent || '').split(/(\s+)/).filter(Boolean).map((m) => {
          if (/^\s+$/.test(m)) return document.createTextNode(m);
          const s = xpEl('span', { class: 'xp-mot' }, [xpEl('span', { text: m })]);
          s.style.setProperty('--i', String(k++));
          return s;
        });
      }
      if (n.nodeType === 1 && (n as Element).tagName !== 'BR') {
        const c = n as HTMLElement;
        const enfants = [...c.childNodes];
        c.replaceChildren(...enfants.flatMap(decoupe));
      }
      return [n];
    };
    const enfants = [...h.childNodes];
    h.replaceChildren(...enfants.flatMap(decoupe));
    h.dataset.mots = '';
  });
  const nettoie: (() => void)[] = [];
  nettoie.push(xpApresOuverture(() => nettoie.push(xpQuandVisible(titres, '0px 0px -4% 0px'))));
  return () => nettoie.forEach((f) => f());
}

/** Images : elles se découvrent de bas en haut, comme une feuille qu'on soulève, avec un léger recul. */
export function xpVoiles(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const imgs = [...root.querySelectorAll<HTMLElement>('figure img, [class*="__carteImg"] img, [class*="__tuile"] img, .xp-frise-img img, [class*="__portrait"] img')]
    .filter((i) => !i.closest('[class*="__apercu"], [class*="__visScene"], [class*="__cmpStage"], dialog') && i.getBoundingClientRect().top > innerHeight * 0.85);
  imgs.forEach((i) => { i.dataset.voile = ''; });
  // on observe le cadre de l'image : une image découpée à zéro n'est jamais « visible » pour le navigateur
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const i = imgs.find((x) => x.parentElement === e.target);
    if (i) i.dataset.vu = '';
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -6% 0px' });
  imgs.forEach((i) => i.parentElement && io.observe(i.parentElement));
  return () => io.disconnect();
}

/** Filets : les traits de séparation se tracent de gauche à droite (un cache blanc qui se retire). */
export function xpFilets(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const sel = '[class*="__liste"] > li, [class*="__inter"], [class*="__head"], [class*="__suite"], [class*="__livret"], [class*="__refHead"], [class*="__coordList"] > div, [class*="__parcours"] li, [class*="__colonne"] li';
  const els = [...root.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getBoundingClientRect().top > innerHeight * 0.8);
  const avec: HTMLElement[] = [];
  els.forEach((e) => {
    const cs = getComputedStyle(e);
    const haut = parseFloat(cs.borderTopWidth) > 0, bas = parseFloat(cs.borderBottomWidth) > 0;
    if (!haut && !bas) return;
    if (cs.position === 'static') e.style.position = 'relative';
    if (haut) e.append(xpEl('i', { class: 'xp-cache-filet', 'data-cote': 'haut', 'aria-hidden': 'true', style: `top:-${cs.borderTopWidth}; height:${cs.borderTopWidth}` }));
    if (bas) e.append(xpEl('i', { class: 'xp-cache-filet', 'data-cote': 'bas', 'aria-hidden': 'true', style: `bottom:-${cs.borderBottomWidth}; height:${cs.borderBottomWidth}` }));
    avec.push(e);
  });
  return xpQuandVisible(avec, '0px 0px -8% 0px');
}

/** Poème : les vers arrivent un par un, à la vitesse de la lecture. */
export function xpVers(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const strophes = [...root.querySelectorAll<HTMLElement>('[class*="__poeme"] p')].filter((p) => !p.dataset.vers);
  let k = 0;
  strophes.forEach((p) => {
    const lignes = (p.textContent || '').split('\n').map((l) => l.trim()).filter(Boolean);
    p.replaceChildren(...lignes.map((l) => { const s = xpEl('span', { class: 'xp-vers', text: l }); s.style.setProperty('--i', String(k++ % 6)); return s; }));
    p.dataset.vers = '';
  });
  const vers = strophes.flatMap((p) => [...p.children]);
  return xpQuandVisible(vers, '0px 0px -12% 0px');
}

/** Boutons ronds « aimantés » : ils suivent un peu le pointeur. */
export function xpAimants() {
  if (xpCalme() || !matchMedia('(hover: hover)').matches) return () => {};
  const SEL = '.xp-lb-nav, .xp-vi-nav, .xp-fi-nav, .xp-frise-bas button, [class*="__visNav"], [class*="__envoyer"], [class*="__baseIcones"] a, .xp-explorer';
  let cur: HTMLElement | null = null;
  const bouge = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>(SEL);
    if (cur && cur !== el) { cur.style.translate = ''; cur = null; }
    if (!el || (el as HTMLButtonElement).disabled) return;
    cur = el;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.28, dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
    el.style.translate = `${Math.max(-8, Math.min(8, dx))}px ${Math.max(-8, Math.min(8, dy))}px`;
  };
  const sort = () => { if (cur) { cur.style.translate = ''; cur = null; } };
  addEventListener('pointermove', bouge, { passive: true });
  document.addEventListener('pointerleave', sort);
  return () => { removeEventListener('pointermove', bouge); document.removeEventListener('pointerleave', sort); };
}

/** Références : la photo s'incline très légèrement sous le pointeur. */
export function xpInclinaison(root: HTMLElement) {
  if (xpCalme() || !matchMedia('(hover: hover)').matches) return () => {};
  const tuiles = [...root.querySelectorAll<HTMLElement>('[data-fiche]')];
  const off: (() => void)[] = [];
  tuiles.forEach((t) => {
    const img = t.querySelector<HTMLElement>('img');
    if (!img) return;
    const bouge = (e: PointerEvent) => {
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.02)`;
    };
    const sort = () => { img.style.transform = ''; };
    t.addEventListener('pointermove', bouge);
    t.addEventListener('pointerleave', sort);
    off.push(() => { t.removeEventListener('pointermove', bouge); t.removeEventListener('pointerleave', sort); });
  });
  return () => off.forEach((f) => f());
}

/** En-tête : s'efface quand on descend, revient dès qu'on remonte. Le logo se redessine au survol. */
export function xpEntete() {
  const html = document.documentElement;
  let y0 = scrollY;
  const defile = () => {
    const y = scrollY;
    if (document.querySelector('header[data-open]')) return;
    if (y > 240 && y > y0 + 4) html.dataset.enteteCache = '';
    else if (y < y0 - 4 || y < 120) delete html.dataset.enteteCache;
    y0 = y;
  };
  const survol = (e: PointerEvent) => {
    const a = (e.target as Element).closest('a');
    const svg = a?.querySelector('svg');
    if (!svg || !a!.matches('[class*="__brand"], [class*="__baseBrand"], [class*="__baseNom"], footer a:first-child') || svg.classList.contains('logoDraw')) return;
    svg.classList.add('logoDraw');
    setTimeout(() => svg.classList.remove('logoDraw'), 2600);
  };
  addEventListener('scroll', defile, { passive: true });
  document.addEventListener('pointerover', survol);
  return () => { removeEventListener('scroll', defile); document.removeEventListener('pointerover', survol); };
}

/** Le logo du pied de page se dessine quand il arrive à l'écran. */
export function xpLogoPied() {
  if (xpCalme()) return () => {};
  const svg = document.querySelector<SVGElement>('.page > footer svg');
  if (!svg) return () => {};
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    svg.classList.remove('logoDraw'); void (svg as unknown as HTMLElement).getBoundingClientRect(); svg.classList.add('logoDraw');
  }, { rootMargin: '0px 0px -10% 0px' });
  io.observe(svg);
  return () => io.disconnect();
}

/** Trame (touche T) : la grille de composition du site apparaît, comme un calque posé sur la planche. */
export function xpTrame(force?: boolean) {
  const ex = document.querySelector('.xp-trame');
  if (ex && force !== true) { ex.classList.add('xp-trame-sort'); setTimeout(() => ex.remove(), 500); return; }
  if (ex) return;
  const cols = xpEl('div', { class: 'xp-trame-cols' });
  for (let k = 0; k < 12; k++) cols.append(xpEl('i', {}, [xpEl('span', { text: String(k + 1).padStart(2, '0') })]));
  const largeur = Math.min(innerWidth, 1280);
  document.body.append(xpEl('div', { class: 'xp-trame', 'aria-hidden': 'true' }, [
    xpEl('div', { class: 'xp-trame-in' }, [
      xpEl('div', { class: 'xp-trame-cote' }, [xpEl('span', { text: `${largeur} px · 12 colonnes` })]),
      cols,
    ]),
  ]));
}

/**
 * Carnet de dessins (accueil) : tous les dessins des projets défilent lentement sur une ligne.
 * On peut le saisir et le faire glisser ; un clic ouvre le dessin dans son projet.
 */
export function xpCarnet(ctx: XPContexte, root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-carnet]');
  if (!box) return () => {};
  const piste = box.querySelector<HTMLElement>('[data-carnet-piste]')!;
  const legende = box.querySelector<HTMLElement>('[data-carnet-legende]');
  const dessins = ctx.D.dessins;
  const ajoute = () => dessins.forEach((d) => {
    const a = xpEl('a', { href: ctx.href(d.href), class: 'xp-carnet-item', draggable: 'false', 'aria-label': `${d.legende}, ${d.projet}` }, [
      xpEl('img', { src: d.thumb, alt: '', loading: 'lazy', draggable: 'false', width: Math.round(d.w), height: Math.round(d.h) }),
    ]);
    a.addEventListener('pointerenter', () => { if (legende) legende.innerHTML = `<b>${d.legende}</b> · ${d.projet}`; });
    a.addEventListener('click', (e) => { e.preventDefault(); if (!bouge) ctx.naviguer(d.href); });
    piste.append(a);
  });
  ajoute(); ajoute(); // deux fois : la boucle est continue
  let x = 0, v = xpCalme() ? 0 : -0.45, cible = v, raf = 0, lent = false;
  let tire: number | null = null, x0 = 0, bouge = false, vit = 0, t0 = 0;
  const demi = () => piste.scrollWidth / 2;
  const pas = () => {
    if (tire == null) {
      cible = lent ? 0 : (xpCalme() ? 0 : -0.45);
      v += (cible - v) * 0.05 + vit; vit *= 0.92;
      x += v;
    }
    const w = demi();
    if (w > 0) { if (x <= -w) x += w; if (x > 0) x -= w; }
    piste.style.transform = `translate3d(${x}px,0,0)`;
    raf = requestAnimationFrame(pas);
  };
  raf = requestAnimationFrame(pas);
  box.addEventListener('pointerenter', () => (lent = true));
  box.addEventListener('pointerleave', () => { lent = false; if (legende) legende.textContent = legende.dataset.defaut || ''; });
  box.addEventListener('pointerdown', (e) => { tire = e.clientX; x0 = x; bouge = false; t0 = e.clientX; box.setPointerCapture?.(e.pointerId); box.dataset.tire = ''; });
  box.addEventListener('pointermove', (e) => {
    if (tire == null) return;
    const dx = e.clientX - tire;
    if (Math.abs(dx) > 5) bouge = true;
    vit = (e.clientX - t0) * 0.06; t0 = e.clientX;
    x = x0 + dx;
  });
  const lache = (e: PointerEvent) => {
    if (tire == null) return;
    tire = null; delete box.dataset.tire;
    if (!bouge) { const a = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.classList?.contains('xp-carnet-item')) as HTMLAnchorElement | undefined; a?.click(); }
    setTimeout(() => (bouge = false), 0);
  };
  box.addEventListener('pointerup', lache);
  box.addEventListener('pointercancel', lache);
  box.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); x -= e.deltaX; } }, { passive: false });
  return () => cancelAnimationFrame(raf);
}

/** Cascades : le texte d'ouverture d'une page arrive ligne après ligne (après la porte, sur l'accueil). */
export function xpCascades(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const blocs = [...root.querySelectorAll<HTMLElement>('[class*="__heroTxt"], [class*="__livretInfos"], [class*="__coordList"], [class*="__ouvTxt"]')].filter((b) => !b.dataset.cascade);
  blocs.forEach((b) => { b.dataset.cascade = ''; [...b.children].forEach((c, k) => (c as HTMLElement).style.setProperty('--i', String(k))); });
  const nettoie: (() => void)[] = [];
  nettoie.push(xpApresOuverture(() => nettoie.push(xpQuandVisible(blocs, '0px 0px -5% 0px'))));
  return () => nettoie.forEach((f) => f());
}

/** Compteurs : « 06 » se compte de 00 à 06 quand il arrive à l'écran. */
export function xpCompteurs(root: HTMLElement) {
  if (xpCalme()) return () => {};
  const els = [...root.querySelectorAll<HTMLElement>('[class*="__projetsHead"] span.eyebrow')].filter((e) => /^\d+$/.test(e.textContent || ''));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target as HTMLElement;
    const fin = +(el.dataset.fin || el.textContent || 0);
    el.dataset.fin = String(fin);
    const t0 = performance.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      el.textContent = String(Math.round(fin * (1 - Math.pow(1 - k, 3)))).padStart(2, '0');
      if (k < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }));
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}
