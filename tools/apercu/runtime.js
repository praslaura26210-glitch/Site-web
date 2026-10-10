/* Aperçu du site en une seule page (artefact Claude) : routeur et parties interactives, sans React.
   Reprend le comportement des composants de src/components ; les classes viennent de la table C. */
(() => {
  const C = JSON.parse(document.getElementById('apercu-classes').textContent);
  const T = JSON.parse(document.getElementById('apercu-textes').textContent);
  const c = (k) => C[k] || k;
  const $ = (k, root = document) => root.querySelector('.' + c(k));
  const $$ = (k, root = document) => [...root.querySelectorAll('.' + c(k))];
  const html = document.documentElement;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tpl = (sel) => document.querySelector(`template[${sel}]`);
  const main = document.getElementById('contenu');
  let lang = null;
  let route = null;
  let nettoyages = [];
  // contexte de la couche « expérience » (src/experience, transpilée dans XP par construire.mjs)
  let ancreCourante = '';
  let finPage = () => {};
  const ctx = {
    D: null,
    href: (h) => '#' + h,
    ancre: () => ancreCourante,
    lien: (a) => { const h = a.getAttribute('href') || ''; return h.startsWith('#/') ? h.slice(1) : null; },
    naviguer: (h, image) => {
      const [p, a] = h.split('#');
      const norm = p.endsWith('/') ? p : p + '/';
      if (norm === route) { va(p, { ancre: a }); return; }
      XP.xpTransition(() => va(p, { ancre: a }), image);
    },
  };

  const el = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
    }
    kids.forEach((k) => k && e.append(k));
    return e;
  };

  /* ---------- en-tête, pied de page, ouverture : selon la langue ---------- */
  const chrome = (l) => {
    const h = tpl(`data-h="${l}"`).content.firstElementChild.cloneNode(true);
    const f = tpl(`data-f="${l}"`).content.firstElementChild.cloneNode(true);
    const o = tpl(`data-o="${l}"`).content.firstElementChild.cloneNode(true);
    document.querySelector('body > header').replaceWith(h);
    document.querySelector('.page > footer').replaceWith(f);
    document.querySelector('.' + c('home.ouverture')).replaceWith(o);
    document.querySelector('a.skip').textContent = T[l].nav.skip;
    html.lang = l;
    enTete(h, l);
  };

  const enTete = (h, l) => {
    const burger = $('chrome.burger', h);
    burger?.addEventListener('click', () => {
      const o = !h.hasAttribute('data-open');
      h.toggleAttribute('data-open', o);
      burger.setAttribute('aria-expanded', String(o));
      burger.textContent = o ? T[l].nav.close : T[l].nav.menu;
    });
    const globe = $('chrome.globe', h);
    const liste = $('chrome.langList', h);
    globe?.addEventListener('click', () => {
      liste.hidden = !liste.hidden;
      globe.setAttribute('aria-expanded', String(!liste.hidden));
    });
    document.addEventListener('pointerdown', (e) => { if (liste && !liste.hidden && !$('chrome.langues', h).contains(e.target)) { liste.hidden = true; globe.setAttribute('aria-expanded', 'false'); } });
  };
  const fermeMenu = () => {
    const h = document.querySelector('body > header');
    if (!h.hasAttribute('data-open')) return;
    h.removeAttribute('data-open');
    const b = $('chrome.burger', h);
    b.setAttribute('aria-expanded', 'false');
    b.textContent = T[lang].nav.menu;
  };
  const majEnTete = (p) => {
    const h = document.querySelector('body > header');
    h.querySelectorAll(`nav a[href^="#/"]`).forEach((a) => {
      const href = a.getAttribute('href').slice(1);
      if (p.startsWith(href)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    h.querySelectorAll(`.${c('chrome.langList')} a`).forEach((a) => {
      const l = a.getAttribute('hreflang');
      a.setAttribute('href', '#' + p.replace(/^\/(fr|en|it)/, '/' + l));
      if (l === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    const liste = $('chrome.langList', h);
    if (liste) liste.hidden = true;
    fermeMenu();
  };
  const defile = () => document.querySelector('body > header')?.classList.toggle(c('chrome.scrolled'), scrollY > 24);
  addEventListener('scroll', defile, { passive: true });

  /* ---------- ouverture : la cabane se dessine, puis la porte s'ouvre ---------- */
  const PORTE = { x: (70 - 12) / 98, y: (94 - 16) / 112 };
  const OUVRE = 2150, FIN = 2650;
  let minuteurs = [];
  const ouverture = () => {
    if (calme) return;
    minuteurs.forEach(clearTimeout);
    const vieux = document.querySelector('.' + c('home.ouverture'));
    const o = tpl(`data-o="${lang}"`).content.firstElementChild.cloneNode(true);
    vieux.replaceWith(o);
    html.dataset.intro = 'on';
    o.setAttribute('data-actif', '');
    const r = $('home.ouvLogoBox', o).getBoundingClientRect();
    o.style.setProperty('--px', `${r.left + r.width * PORTE.x}px`);
    o.style.setProperty('--py', `${r.top + r.height * PORTE.y}px`);
    const montre = () => { delete html.dataset.intro; };
    const cache = () => o.setAttribute('data-out', '');
    minuteurs = [setTimeout(montre, OUVRE), setTimeout(cache, FIN)];
    const passe = () => { montre(); cache(); removeEventListener('keydown', touche); };
    const touche = (e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && passe();
    addEventListener('keydown', touche);
    o.addEventListener('click', passe);
    minuteurs.push(setTimeout(() => removeEventListener('keydown', touche), FIN));
  };

  /* ---------- apparition douce des éléments « rv » ---------- */
  const apparitions = () => {
    if (calme) return;
    const els = [...main.querySelectorAll('.rv:not([data-rv])')].filter((e) => e.getBoundingClientRect().top > innerHeight * 0.92);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.dataset.rv = 'in';
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => { e.dataset.rv = 'wait'; io.observe(e); });
    nettoyages.push(() => io.disconnect());
  };

  /* ---------- parties interactives de la page affichée (les autres sont dans src/experience) ---------- */
  const visionneuses = () => main.querySelectorAll('[data-items]').forEach((v) => {
    const items = JSON.parse(v.dataset.items);
    const credit = v.dataset.credit;
    const n = items.length;
    let i = 0;
    const scene = $('project.visScene', v);
    const img = scene.querySelector('img');
    const compte = $('project.visCompte', v);
    const boutons = [...$('project.visListe', v).querySelectorAll('button')];
    const montre = () => {
      const m = items[i];
      img.src = m.src; img.alt = m.legende; img.width = Math.round(m.w); img.height = Math.round(m.h);
      img.className = m.dessin ? c('project.visDessin') : '';
      scene.setAttribute('aria-label', `${m.legende}. ${T[lang].projet.agrandir}`);
      compte.innerHTML = '';
      compte.append(String(i + 1).padStart(2, '0'), el('span', { text: ` / ${String(n).padStart(2, '0')}` }));
      boutons.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      [items[(i + 1) % n], items[(i - 1 + n) % n]].forEach((x) => { new Image().src = x.src; });
    };
    const va = (k) => { i = (i + k + n) % n; montre(); };
    $('project.visPrev', v)?.addEventListener('click', () => va(-1));
    $('project.visNext', v)?.addEventListener('click', () => va(1));
    boutons.forEach((b, k) => b.addEventListener('click', () => { i = k; montre(); }));
    scene.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') va(1); if (e.key === 'ArrowLeft') va(-1); if (e.key === 'Enter') ouvre(); });
    let x0 = null;
    const ouvre = () => dispatchEvent(new CustomEvent('lp:zoom', { detail: { el: v, k: i } }));
    scene.addEventListener('pointerdown', (e) => (x0 = e.clientX));
    scene.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) va(dx < 0 ? 1 : -1); else ouvre();
    });
    montre();
  });

  const comparateurs = () => $$('project.cmpStage', main).forEach((box) => {
    const range = $('project.cmpRange', box);
    let drag = false;
    const pose = (x) => { box.style.setProperty('--x', `${x}%`); range.value = String(Math.round(x)); };
    const at = (cx) => { const r = box.getBoundingClientRect(); pose(Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100))); };
    box.addEventListener('pointerdown', (e) => { drag = true; e.target.setPointerCapture?.(e.pointerId); at(e.clientX); });
    box.addEventListener('pointermove', (e) => drag && at(e.clientX));
    box.addEventListener('pointerup', () => (drag = false));
    box.addEventListener('pointercancel', () => (drag = false));
    range.addEventListener('input', () => pose(+range.value));
    if (calme) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const f = (now) => {
        if (drag) return;
        const t = Math.min(1, (now - t0) / 2000);
        pose(50 + Math.sin(t * Math.PI * 2) * 30 * (1 - t));
        if (t < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, { threshold: 0.7 });
    io.observe(box);
    nettoyages.push(() => io.disconnect());
  });

  const index = () => {
    const liste = $('home.liste', main);
    const apercu = $('home.apercu', main);
    if (!liste || !apercu) return;
    const lis = [...liste.children];
    const imgs = [...apercu.querySelectorAll('img')];
    const pose = (i) => [lis, imgs].forEach((g) => g.forEach((e, k) => (k === i ? e.setAttribute('data-on', 'true') : e.removeAttribute('data-on'))));
    lis.forEach((li, i) => { const a = li.querySelector('a'); a.addEventListener('pointerenter', () => pose(i)); a.addEventListener('focus', () => pose(i)); });
  };

  /* le formulaire ne peut rien envoyer depuis l'aperçu : il mène à la page de remerciement */
  const formulaire = () => main.querySelectorAll('form').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    va(`/${lang}/contact/merci/`);
  }));

  /* ---------- routeur ---------- */
  const existe = (p) => !!tpl(`data-r="${p}"`);
  const va = (p, { ancre, pousse = true } = {}) => {
    if (!p.endsWith('/')) p += '/';
    if (!existe(p)) p = `/${lang || 'fr'}/`;
    const l = p.slice(1, 3);
    nettoyages.forEach((f) => f()); nettoyages = [];
    if (l !== lang) { lang = l; chrome(l); ctx.D = JSON.parse(document.getElementById('lp-donnees-' + l).textContent); }
    ancreCourante = ancre || '';
    const t = tpl(`data-r="${p}"`);
    main.replaceChildren(t.content.cloneNode(true));
    document.title = t.dataset.titre;
    route = p;
    majEnTete(p);
    if (pousse) { try { history.pushState({ p }, '', '#' + p.slice(1).replace(/\/$/, '')); } catch (e) { /* cadre sans historique */ } }
    if (ancre && document.getElementById(ancre)) document.getElementById(ancre).scrollIntoView(); else scrollTo(0, 0);
    defile();
    visionneuses(); comparateurs(); index(); formulaire();
    finPage(); finPage = XP.xpPage(ctx, main);
    apparitions();
    if (/^\/(fr|en|it)\/$/.test(p)) ouverture();
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const [p, ancre] = a.getAttribute('href').slice(1).split('#');
    va(p, { ancre });
  });
  addEventListener('popstate', (e) => { const p = e.state?.p; if (p) va(p, { pousse: false }); });

  XP.xpDemarrer(ctx);
  const depart = (() => { const h = location.hash.slice(1).replace(/\./g, '/'); return h ? '/' + h.replace(/^\/+/, '') : '/fr/'; })();
  va(existe(depart.endsWith('/') ? depart : depart + '/') ? depart : '/fr/', { pousse: false });
})();
