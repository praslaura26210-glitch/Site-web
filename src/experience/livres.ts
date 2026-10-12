import { xpCalme, xpEl, xpFleche, xpSaisie, type XPContexte } from './outils';

/*
 * Le livre d'un projet (ouvert depuis la collection de l'accueil). On fait défiler la page et ses pages tournent,
 * l'une après l'autre, autour de la reliure (double page sur écran large, une page sur téléphone).
 * Les pages sont écrites dans la page (components/home/LivrePages.tsx) ; chacune s'anime la première fois
 * qu'elle apparaît : les images entrent, les plans se dessinent, l'existant glisse vers le projet (on peut
 * ensuite faire glisser le trait), les matériaux tombent sur la page, les chiffres défilent.
 */

/** Ce qui s'anime sur une page quand elle apparaît ; retourne de quoi l'arrêter. */
export function xpAnimePage(page: HTMLElement) {
  const fins: (() => void)[] = [];
  requestAnimationFrame(() => page.setAttribute('data-vu', ''));
  const calme = xpCalme();

  // existant / projet : le trait balaie, puis on le fait glisser
  page.querySelectorAll<HTMLElement>('[data-lv-cmp]').forEach((sc) => {
    let tenu = false, raf = 0;
    const pose = (v: number) => sc.style.setProperty('--p', `${Math.min(100, Math.max(0, v))}%`);
    pose(calme ? 50 : 100);
    if (!calme) {
      const t0 = performance.now() + 600;
      const f = (now: number) => {
        if (tenu) return;
        const t = Math.max(0, Math.min(1, (now - t0) / 2600));
        // de l'existant au projet, puis retour au milieu
        if (t < 0.6) pose(100 - (1 - (1 - t / 0.6) ** 3) * 92);
        else { const u = (t - 0.6) / 0.4; pose(8 + u * u * (3 - 2 * u) * 42); }
        if (t < 1) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }
    const at = (x: number) => { const r = sc.getBoundingClientRect(); pose(((x - r.left) / r.width) * 100); };
    sc.addEventListener('pointerdown', (e) => { tenu = true; cancelAnimationFrame(raf); sc.setPointerCapture(e.pointerId); at(e.clientX); });
    sc.addEventListener('pointermove', (e) => { if (tenu) at(e.clientX); });
    sc.addEventListener('pointerup', () => { tenu = false; });
    fins.push(() => cancelAnimationFrame(raf));
  });

  // les matériaux suivent un peu la souris, comme si on penchait la page
  page.querySelectorAll<HTMLElement>('.xp-lv-mat').forEach((zone) => {
    zone.addEventListener('pointermove', (e) => {
      const r = zone.getBoundingClientRect();
      zone.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      zone.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  });

  // les chiffres défilent jusqu'à leur valeur
  page.querySelectorAll<HTMLElement>('[data-compte]').forEach((dd) => {
    const fin = dd.textContent || '';
    const m = fin.match(/\d[\d\s.,]*/);
    if (!m || calme) return;
    const brut = m[0].trim();
    const n = parseFloat(brut.replace(/[\s.]/g, '').replace(',', '.'));
    if (!isFinite(n)) return;
    const dec = /,\d+$/.test(brut) ? brut.split(',')[1].length : 0;
    const t0 = performance.now() + 300;
    let raf = 0;
    const f = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / 1300));
      const s = (n * (1 - (1 - t) ** 3)).toLocaleString(document.documentElement.lang || 'fr', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      dd.textContent = t < 1 ? fin.replace(brut, s) : fin;
      if (t < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    fins.push(() => { cancelAnimationFrame(raf); dd.textContent = fin; });
  });
  return () => fins.forEach((f) => f());
}

/** Le livre du projet, relié au défilement de la page. */
export function xpLivres(ctx: XPContexte, root: HTMLElement) {
  const sec = root.querySelector<HTMLElement>('[data-livre-projet]');
  const source = sec?.querySelector<HTMLElement>('[data-livre-pages]');
  if (!sec || !source || sec.querySelector('.xp-lp-scene')) return () => {};
  const T = ctx.D.t;
  const titre = source.dataset.titre || '';
  const sections = [...source.children] as HTMLElement[];

  // les pages : la couverture, la page de garde, puis celles du projet
  const couverture = () => xpEl('div', { class: 'xp-lv-page xp-lv-couv-recto' }, [
    xpEl('img', { src: source.dataset.couv || '', alt: '', draggable: 'false', style: source.dataset.couvPos ? `object-position:${source.dataset.couvPos}` : null }),
    xpEl('span', { class: 'xp-lv-couv-n', text: `N° ${source.dataset.n || ''}${source.dataset.annee ? ` — ${source.dataset.annee}` : ''}` }),
    xpEl('span', { class: 'xp-lv-couv-t', text: titre }),
    xpEl('span', { class: 'xp-lv-couv-nom', text: 'Laura Pras' }),
  ]);
  const garde = () => xpEl('div', { class: 'xp-lv-page' }, [xpEl('div', { class: 'xp-lv-p xp-lv-garde' }, [
    xpEl('span', { class: 'xp-lv-garde-n', text: `N° ${source.dataset.n || ''}` }),
    xpEl('span', { class: 'xp-lv-garde-nom', text: 'Laura Pras' }),
    xpEl('span', { class: 'xp-lv-garde-t', text: titre }),
  ])]);
  const page = (i: number) => {
    const s = sections[i];
    const copies = [...s.children].map((c) => c.cloneNode(true) as HTMLElement);
    // une image encore « en attente » dans la page cachée ne doit pas le rester dans le livre
    copies.forEach((c) => c.querySelectorAll('[data-attente]').forEach((i) => i.removeAttribute('data-attente')));
    return xpEl('div', { class: 'xp-lv-page' }, [
      ...copies,
      xpEl('div', { class: 'xp-lv-pied' }, [xpEl('span', { text: s.dataset.rubrique || titre }), xpEl('span', { class: 'xp-lv-folio', text: String(i + 1) })]),
    ]);
  };
  const pages = [couverture, garde, ...sections.map((_, i) => () => page(i))];
  const blanche = () => xpEl('div', { class: 'xp-lv-page' });

  const livre = xpEl('div', { class: 'xp-lp-livre' });
  const compte = xpEl('span', { class: 'xp-lv-compte' });
  const prec = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.precedent, html: xpFleche(-1) });
  const suiv = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.suivant, html: xpFleche(1) });
  const scene = xpEl('div', { class: 'xp-lp-scene' }, [livre, xpEl('div', { class: 'xp-lv-bas' }, [prec, compte, suiv])]);
  sec.append(scene);

  const etroit = () => matchMedia('(max-width: 760px)').matches;
  let simple = etroit();
  let feuilles: { el: HTMLElement; recto: HTMLElement; verso: HTMLElement | null }[] = [];
  let maxS = 1;
  let arrets: (() => void)[] = [];
  const vues = new Set<HTMLElement>();
  const relie = () => {
    arrets.forEach((f) => f()); arrets = []; vues.clear();
    simple = etroit();
    livre.toggleAttribute('data-simple', simple);
    feuilles = [];
    const n = simple ? pages.length : Math.ceil(pages.length / 2);
    for (let j = 0; j < n; j++) {
      const recto = (simple ? pages[j] : pages[2 * j])();
      const v = simple ? null : pages[2 * j + 1];
      const verso = v ? v() : blanche();
      const el = xpEl('div', { class: 'xp-lp-feuille' }, [xpEl('div', { class: 'xp-lp-face xp-lp-recto' }, [recto]), xpEl('div', { class: 'xp-lp-face xp-lp-verso' }, [verso])]);
      feuilles.push({ el, recto, verso: v ? verso : null });
    }
    livre.replaceChildren(...feuilles.map((f) => f.el));
    // le nombre de pages à tourner : jusqu'à la dernière page du projet
    maxS = simple ? pages.length - 1 : Math.ceil((pages.length - 1) / 2);
    sec.style.setProperty('--n', String(maxS));
    maj();
  };

  const course = () => Math.max(1, sec.offsetHeight - innerHeight);
  const progres = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / course())) * maxS;
  const vu = (p: HTMLElement | null) => { if (p && !vues.has(p)) { vues.add(p); arrets.push(xpAnimePage(p)); } };
  let raf = 0;
  const maj = () => {
    raf = 0;
    const p = progres();
    let e0 = 0, eDer = 0;
    feuilles.forEach((f, j) => {
      const t = Math.min(1, Math.max(0, (p - j - 0.15) / 0.7));
      const e = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2;
      if (j === 0) e0 = e;
      if (j === feuilles.length - 1) eDer = e;
      f.el.style.transform = `rotateY(${(-180 * e).toFixed(2)}deg)`;
      f.el.style.zIndex = String(e < 0.5 ? 200 - j : j + 1);
      // la page de droite apparaît dès que la précédente se soulève ; celle de gauche quand elle est tournée
      if (j === 0 || (feuilles[j - 1] && Math.min(1, Math.max(0, (p - (j - 1) - 0.15) / 0.7)) > 0.3)) vu(f.recto);
      if (e > 0.5) vu(f.verso);
    });
    // livre fermé : il est centré ; il glisse en s'ouvrant (et se recentre s'il se referme à la fin)
    const dernierTourne = !simple && pages.length % 2 === 0;
    livre.style.transform = simple ? '' : `translateX(${(-25 * (1 - e0) + (dernierTourne ? 25 * eDer : 0)).toFixed(2)}%)`;
    const s = Math.round(p);
    compte.innerHTML = `${String(s + 1).padStart(2, '0')}<span> / ${String(maxS + 1).padStart(2, '0')}</span>`;
    prec.toggleAttribute('disabled', s <= 0);
    suiv.toggleAttribute('disabled', s >= maxS);
  };
  const defile = () => { if (!raf) raf = requestAnimationFrame(maj); };

  // aller à une double page : on fait défiler la page jusqu'à elle
  const va = (s: number) => {
    s = Math.min(maxS, Math.max(0, s));
    const haut = sec.getBoundingClientRect().top + scrollY;
    scrollTo({ top: haut + (s / maxS) * course() + 1, behavior: xpCalme() ? 'auto' : 'smooth' });
  };
  prec.addEventListener('click', () => va(Math.round(progres()) - 1));
  suiv.addEventListener('click', () => va(Math.round(progres()) + 1));
  livre.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('a, button, [data-lv-cmp]')) return;
    const r = livre.getBoundingClientRect();
    va(Math.round(progres()) + (e.clientX > r.left + r.width / 2 ? 1 : -1));
  });
  const touche = (e: KeyboardEvent) => {
    if (xpSaisie(e) || document.querySelector('dialog[open]')) return;
    const r = sec.getBoundingClientRect();
    if (r.top > 1 || r.bottom < innerHeight) return;
    if (e.key === 'ArrowRight') va(Math.round(progres()) + 1); else if (e.key === 'ArrowLeft') va(Math.round(progres()) - 1); else return;
    e.preventDefault();
  };
  const redim = () => { if (etroit() !== simple) relie(); else defile(); };
  addEventListener('scroll', defile, { passive: true });
  addEventListener('resize', redim);
  addEventListener('keydown', touche);
  relie();
  return () => {
    cancelAnimationFrame(raf); arrets.forEach((f) => f());
    removeEventListener('scroll', defile); removeEventListener('resize', redim); removeEventListener('keydown', touche);
  };
}
