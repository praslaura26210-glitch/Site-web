import { xpCalme, xpDialogue, xpEl, xpFleche, xpGlisse, xpSaisie, type XPContexte } from './outils';

/*
 * Page Projets : on choisit un livre dans l'étui ; il sort, et s'ouvre en grand.
 * La couverture tourne autour de la reliure, puis on tourne les pages (double page, une seule sur téléphone).
 * Les pages sont écrites dans la page (components/home/LivrePages.tsx) ; chaque page s'anime quand elle
 * apparaît : les images entrent, les plans se dessinent, l'existant glisse vers le projet (on peut ensuite
 * faire glisser le trait), les échantillons de matériaux tombent sur la page et flottent (on peut les
 * attraper), les chiffres défilent.
 */

/** Ce qui s'anime sur une page quand elle apparaît ; retourne de quoi l'arrêter. */
function xpAnimePage(page: HTMLElement) {
  const fins: (() => void)[] = [];
  requestAnimationFrame(() => page.setAttribute('data-vu', ''));
  const calme = xpCalme();

  // existant / projet : le trait balaie, puis on le fait glisser
  page.querySelectorAll<HTMLElement>('[data-lv-cmp]').forEach((sc) => {
    let p = 100, tenu = false, raf = 0;
    const pose = (v: number) => { p = Math.min(100, Math.max(0, v)); sc.style.setProperty('--p', `${p}%`); };
    pose(calme ? 50 : 100);
    if (!calme) {
      const t0 = performance.now() + 700;
      const f = (now: number) => {
        if (tenu) return;
        const t = Math.max(0, Math.min(1, (now - t0) / 2600));
        // de l'existant au projet, puis retour au milieu
        if (t < 0.6) pose(100 - (1 - (1 - t / 0.6) ** 3) * 92);
        else { const u = (t - 0.6) / 0.4; pose(8 + (u * u * (3 - 2 * u)) * 42); }
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

  // les matériaux : ils tombent sur la page, flottent, suivent un peu la souris, et s'attrapent
  page.querySelectorAll<HTMLElement>('[data-lv-mat]').forEach((zone) => {
    const bouge = (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      zone.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
      zone.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
    };
    zone.addEventListener('pointermove', bouge);
    let tenu: HTMLElement | null = null, dx = 0, dy = 0, z = 10;
    zone.addEventListener('pointerdown', (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-lv-ech]');
      if (!el) return;
      e.preventDefault();
      tenu = el; el.setPointerCapture(e.pointerId); el.dataset.tenu = ''; el.style.zIndex = String(++z);
      const r = el.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
    });
    zone.addEventListener('pointermove', (e) => {
      if (!tenu) return;
      const r = zone.getBoundingClientRect();
      tenu.style.setProperty('--x', `${((e.clientX - dx - r.left) / r.width) * 100}%`);
      tenu.style.setProperty('--y', `${((e.clientY - dy - r.top) / r.height) * 100}%`);
    });
    const lache = () => { if (tenu) { delete tenu.dataset.tenu; tenu = null; } };
    zone.addEventListener('pointerup', lache);
    zone.addEventListener('pointercancel', lache);
  });

  // les chiffres défilent jusqu'à leur valeur
  page.querySelectorAll<HTMLElement>('[data-compte]').forEach((dd) => {
    const fin = dd.textContent || '';
    const m = fin.match(/[\d\s.,]+/);
    if (!m || calme) return;
    const brut = m[0].trim();
    const n = parseFloat(brut.replace(/[\s.]/g, '').replace(',', '.'));
    if (!isFinite(n)) return;
    const dec = (brut.split(/[,.]/)[1] || '').length * (brut.includes(',') || /\.\d{1,2}$/.test(brut) ? 1 : 0);
    const t0 = performance.now() + 300;
    let raf = 0;
    const f = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / 1300));
      const v = n * (1 - (1 - t) ** 3);
      const s = v.toLocaleString(document.documentElement.lang || 'fr', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      dd.textContent = t < 1 ? fin.replace(m[0].trim(), s) : fin;
      if (t < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    fins.push(() => { cancelAnimationFrame(raf); dd.textContent = fin; });
  });
  return () => fins.forEach((f) => f());
}

/** Ouvre le livre d'un projet. */
function xpOuvrirLivre(ctx: XPContexte, source: HTMLElement, retour: HTMLElement, auFermer: () => void) {
  const T = ctx.D.t;
  const titre = source.dataset.titre || '';
  const sections = [...source.children] as HTMLElement[];
  const simple = () => matchMedia('(max-width: 760px)').matches; // une page à la fois
  const calme = xpCalme();
  // la page de garde : le dos de la couverture, en papier kraft, avec le nom
  const garde = () => xpEl('div', { class: 'xp-lv-p xp-lv-garde' }, [
    xpEl('span', { class: 'xp-lv-garde-n', text: `N° ${source.dataset.n || ''}` }),
    xpEl('span', { class: 'xp-lv-garde-nom', text: 'Laura Pras' }),
    xpEl('span', { class: 'xp-lv-garde-t', text: titre }),
  ]);
  const total = sections.length + 1;
  // k : la première page visible (à gauche en double page) ; 0 = la page de garde
  let k = simple() ? 1 : 0;
  const pas = () => (simple() ? 1 : 2);

  const rendu = (i: number) => {
    if (i < 0 || i >= total) return xpEl('div', { class: 'xp-lv-page xp-lv-vide' });
    const page = xpEl('div', { class: 'xp-lv-page' });
    if (i === 0) page.append(garde());
    else {
      const s = sections[i - 1];
      page.append(...[...s.children].map((c) => c.cloneNode(true)));
      const rub = s.dataset.rubrique;
      page.append(xpEl('div', { class: 'xp-lv-pied' }, [xpEl('span', { text: rub || titre }), xpEl('span', { class: 'xp-lv-folio', text: String(i) })]));
    }
    return page;
  };

  const gauche = xpEl('div', { class: 'xp-lv-cote xp-lv-g' });
  const droite = xpEl('div', { class: 'xp-lv-cote xp-lv-d' });
  const livre = xpEl('div', { class: 'xp-lv-livre' }, [gauche, droite]);
  const compte = xpEl('span', { class: 'xp-lv-compte' });
  const prec = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.precedent, html: xpFleche(-1) });
  const suiv = xpEl('button', { type: 'button', class: 'xp-lv-nav', 'aria-label': T.suivant, html: xpFleche(1) });
  const fermer = xpEl('button', { type: 'button', class: 'lien xp-lv-fermer', text: T.fermer });
  const d = xpEl('dialog', { class: 'xp-lv', 'aria-label': titre }, [
    xpEl('div', { class: 'xp-lv-scene' }, [livre]),
    xpEl('div', { class: 'xp-lv-bas' }, [prec, compte, suiv, fermer]),
  ]);

  let arrets: (() => void)[] = [];
  const affiche = () => {
    arrets.forEach((f) => f()); arrets = [];
    livre.toggleAttribute('data-simple', simple());
    const g = rendu(k), dr = simple() ? xpEl('span') : rendu(k + 1);
    gauche.replaceChildren(g);
    droite.replaceChildren(dr);
    [g, dr].forEach((p) => { if (p.classList.contains('xp-lv-page')) arrets.push(xpAnimePage(p)); });
    const n = pas();
    compte.innerHTML = `${String(Math.floor(k / n) + 1).padStart(2, '0')}<span> / ${String(Math.ceil(total / n)).padStart(2, '0')}</span>`;
    prec.toggleAttribute('disabled', k <= (simple() ? 1 : 0));
    suiv.toggleAttribute('disabled', k + n >= total);
  };

  let tourne = false;
  const tourner = (sens: 1 | -1) => {
    const n = pas();
    const cible = k + sens * n;
    if (tourne || cible < (simple() ? 1 : 0) || cible >= total) return;
    if (calme) { k = cible; affiche(); return; }
    tourne = true;
    // la feuille qui tourne : recto et verso, posée sur la page qu'on quitte
    const recto = xpEl('div', { class: 'xp-lv-recto' });
    const verso = xpEl('div', { class: 'xp-lv-verso' });
    const feuille = xpEl('div', { class: 'xp-lv-feuille' }, [recto, verso]);
    if (simple()) {
      if (sens > 0) { recto.append(rendu(k)); gauche.replaceChildren(rendu(cible)); }
      else { recto.append(rendu(cible)); feuille.dataset.depart = 'tournee'; }
      feuille.dataset.cote = 'g';
    } else if (sens > 0) {
      recto.append(rendu(k + 1)); verso.append(rendu(k + 2));
      droite.replaceChildren(rendu(k + 3));
      feuille.dataset.cote = 'd';
    } else {
      recto.append(rendu(k)); verso.append(rendu(k - 1));
      gauche.replaceChildren(rendu(k - 2));
      feuille.dataset.cote = 'g';
    }
    livre.append(feuille);
    const debut = feuille.dataset.depart ? 'rotateY(-180deg)' : 'rotateY(0deg)';
    const fin = simple() ? (sens > 0 ? 'rotateY(-180deg)' : 'rotateY(0deg)') : sens > 0 ? 'rotateY(-180deg)' : 'rotateY(180deg)';
    const a = feuille.animate([{ transform: debut }, { transform: fin }], { duration: 820, easing: 'cubic-bezier(.45, .05, .3, 1)' });
    a.finished.then(() => { feuille.remove(); k = cible; affiche(); tourne = false; });
  };

  // la couverture : elle s'ouvre en tournant autour de la reliure
  const ouvrir = () => {
    if (calme) { affiche(); return; }
    tourne = true;
    const couv = xpEl('div', { class: 'xp-lv-couv' }, [
      xpEl('div', { class: 'xp-lv-recto xp-lv-couv-recto' }, [
        xpEl('img', { src: source.dataset.couv || '', alt: '', draggable: 'false', style: source.dataset.couvPos ? `object-position:${source.dataset.couvPos}` : null }),
        xpEl('span', { class: 'xp-lv-couv-n', text: `N° ${source.dataset.n || ''}${source.dataset.annee ? ` — ${source.dataset.annee}` : ''}` }),
        xpEl('span', { class: 'xp-lv-couv-t', text: titre }),
        xpEl('span', { class: 'xp-lv-couv-nom', text: 'Laura Pras' }),
      ]),
      xpEl('div', { class: 'xp-lv-verso' }, [xpEl('div', { class: 'xp-lv-page' }, [garde()])]),
    ]);
    livre.toggleAttribute('data-simple', simple());
    livre.dataset.ferme = '';
    gauche.replaceChildren(xpEl('div', { class: 'xp-lv-page xp-lv-vide' }));
    const premiere = rendu(1);
    (simple() ? gauche : droite).replaceChildren(premiere);
    livre.append(couv);
    const a = couv.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: 1100, delay: 500, easing: 'cubic-bezier(.5, .05, .25, 1)', fill: 'both' });
    setTimeout(() => delete livre.dataset.ferme, 850);
    a.finished.then(() => { couv.remove(); tourne = false; affiche(); });
  };

  prec.addEventListener('click', () => tourner(-1));
  suiv.addEventListener('click', () => tourner(1));
  fermer.addEventListener('click', () => d.close());
  // un clic dans la marge d'une page tourne la page (pas sur ce qu'on manipule)
  let x0 = 0, y0 = 0;
  livre.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
  livre.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, [data-lv-cmp], [data-lv-mat]') || Math.hypot(e.clientX - x0, e.clientY - y0) > 6) return;
    const r = livre.getBoundingClientRect();
    tourner((e as MouseEvent).clientX > r.left + r.width / 2 ? 1 : -1);
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('keydown', (e) => {
    if (xpSaisie(e)) return;
    if (e.key === 'ArrowRight') tourner(1); else if (e.key === 'ArrowLeft') tourner(-1); else return;
    e.preventDefault();
  });
  // « voir le projet en entier » : on ferme le livre et on va à la page du projet
  d.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-lv-voir]');
    if (!a) return;
    e.preventDefault();
    d.close();
    const cible = ctx.lien(a);
    if (cible) ctx.naviguer(cible); else location.href = a.href;
  });
  xpGlisse(livre, (s) => tourner(s > 0 ? 1 : -1), () => !document.querySelector('.xp-lv [data-tenu]'));
  const redim = () => { if (!tourne) affiche(); };
  addEventListener('resize', redim);
  d.addEventListener('close', () => { removeEventListener('resize', redim); arrets.forEach((f) => f()); });
  xpDialogue(d, () => { auFermer(); retour.focus(); });
  ouvrir();
  suiv.focus();
}

/** Branche l'étui de la page Projets : un clic sur un livre le fait sortir, puis l'ouvre. */
export function xpLivres(ctx: XPContexte, root: HTMLElement) {
  const etui = root.querySelector<HTMLElement>('[data-etui]');
  if (!etui) return () => {};
  let t = 0;
  const clic = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-livre]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const source = etui.querySelector<HTMLElement>(`[data-livre-pages="${a.dataset.livre}"]`);
    if (!source) return;
    e.preventDefault();
    const li = a.closest<HTMLElement>('[data-livre-li]');
    li?.setAttribute('data-sorti', '');
    clearTimeout(t);
    t = window.setTimeout(() => xpOuvrirLivre(ctx, source, a, () => li?.removeAttribute('data-sorti')), xpCalme() ? 0 : 480);
  };
  etui.addEventListener('click', clic);
  return () => { clearTimeout(t); etui.removeEventListener('click', clic); };
}
