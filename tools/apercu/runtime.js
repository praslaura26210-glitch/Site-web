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

  /* ---------- boîte d'agrandissement ---------- */
  const ouvreDialogue = (d) => {
    document.body.append(d);
    d.addEventListener('close', () => { d.remove(); html.style.overflow = ''; });
    d.showModal();
    html.style.overflow = 'hidden';
  };

  /* lecture des plans : zoom molette / pincement / boutons / clavier, déplacement au glisser */
  const lecteur = (p) => {
    const L = T[lang].projet;
    const canvas = el('div', { class: c('project.canvas') });
    const echelle = el('p', { class: c('project.scale'), text: '×1.0' });
    const bPlus = el('button', { type: 'button', 'aria-label': L.zoomIn, text: '+' });
    const bMoins = el('button', { type: 'button', 'aria-label': L.zoomOut, text: '−' });
    const bCadre = el('button', { type: 'button', 'aria-label': L.zoomReset, text: '⤢' });
    const vue = el('div', { class: `${c('project.viewer')} ${c('project.lbViewer')}`, tabindex: '0', role: 'img', 'aria-label': `${p.label}. ${L.zoomHint}`, 'data-cursor': 'drag' }, [
      canvas, el('div', { class: c('project.tools') }, [bPlus, bMoins, bCadre]), el('p', { class: c('project.hint'), text: L.zoomHint }), echelle,
    ]);
    const wrap = el('div', { class: c('project.viewerWrap') }, [vue]);
    const tf = { s: 1, x: 0, y: 0 };
    let svgCharge = false, hd = false, img = null;
    const chargeSvg = () => {
      if (svgCharge || !p.svg) return;
      svgCharge = true;
      fetch(p.svg).then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => { canvas.innerHTML = ''; canvas.append(Object.assign(el('div'), { innerHTML: t })); })
        .catch(() => { if (!img) { img = el('img', { src: p.svg, alt: '', draggable: 'false' }); canvas.append(img); } });
    };
    const apply = () => {
      canvas.style.transform = `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})`;
      echelle.textContent = '×' + tf.s.toFixed(1);
      if (tf.s > 1.6) {
        if (p.svg && p.preview) chargeSvg();
        if (p.full && !hd && img) { hd = true; img.src = p.full; }
      }
    };
    const fit = () => {
      const v = vue.getBoundingClientRect();
      const w = Math.min(v.width, v.height * p.ratio);
      canvas.style.width = `${w}px`;
      Object.assign(tf, { s: 1, x: (v.width - w) / 2, y: (v.height - w / p.ratio) / 2 });
      apply();
    };
    if (p.preview) { img = el('img', { src: p.preview, alt: '', draggable: 'false' }); canvas.append(img); } else chargeSvg();
    const zoomAt = (f, cx, cy) => {
      const s = Math.min(24, Math.max(0.6, tf.s * f));
      const k = s / tf.s;
      tf.x = cx - (cx - tf.x) * k; tf.y = cy - (cy - tf.y) * k; tf.s = s;
      apply();
    };
    const centre = () => { const r = vue.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
    vue.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); const r = vue.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    const pts = new Map();
    vue.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; vue.setPointerCapture?.(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    vue.addEventListener('pointermove', (e) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      if (pts.size === 1) { tf.x += e.clientX - prev.x; tf.y += e.clientY - prev.y; apply(); }
      else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const autre = a === prev ? b : a;
        const d0 = Math.hypot(prev.x - autre.x, prev.y - autre.y);
        const d1 = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
        const r = vue.getBoundingClientRect();
        if (d0 > 0) zoomAt(d1 / d0, (e.clientX + autre.x) / 2 - r.left, (e.clientY + autre.y) / 2 - r.top);
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const up = (e) => pts.delete(e.pointerId);
    vue.addEventListener('pointerup', up);
    vue.addEventListener('pointercancel', up);
    vue.addEventListener('keydown', (e) => {
      const [cx, cy] = centre();
      if (e.key === '+' || e.key === '=') zoomAt(1.25, cx, cy);
      else if (e.key === '-') zoomAt(0.8, cx, cy);
      else if (e.key === '0') fit();
      else if (e.key.startsWith('Arrow')) {
        if (e.key === 'ArrowLeft') tf.x += 40;
        if (e.key === 'ArrowRight') tf.x -= 40;
        if (e.key === 'ArrowUp') tf.y += 40;
        if (e.key === 'ArrowDown') tf.y -= 40;
        apply();
      } else return;
      e.preventDefault();
    });
    bPlus.addEventListener('click', () => { const [x, y] = centre(); zoomAt(1.4, x, y); });
    bMoins.addEventListener('click', () => { const [x, y] = centre(); zoomAt(1 / 1.4, x, y); });
    bCadre.addEventListener('click', fit);
    addEventListener('resize', fit);
    return { wrap, fit, stop: () => removeEventListener('resize', fit) };
  };

  const agrandit = (p) => {
    const L = T[lang].projet;
    const v = lecteur(p);
    const fermer = el('button', { type: 'button', class: c('project.lbFermer'), 'aria-label': L.fermer, text: '✕' });
    const d = el('dialog', { class: c('project.lightbox'), 'aria-label': p.label }, [fermer, v.wrap, p.credit ? el('p', { class: c('project.lbCredit'), text: p.credit }) : null]);
    fermer.addEventListener('click', () => d.close());
    d.addEventListener('close', v.stop);
    ouvreDialogue(d);
    fermer.focus();
    requestAnimationFrame(v.fit);
  };

  /* ---------- parties interactives de la page affichée ---------- */
  const planches = () => main.querySelectorAll('button[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const z = JSON.parse(b.dataset.zoom);
    agrandit({ ...z, label: b.querySelector('img')?.alt || '' });
  }));

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
    const ouvre = () => { const m = items[i]; agrandit({ svg: m.svg, preview: m.vect ? undefined : m.src, full: m.full, ratio: m.w / m.h, credit, label: m.legende }); };
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

  const couloir = () => {
    const b = $('home.couloir', main);
    if (!b) return;
    b.addEventListener('click', () => {
      const legende = b.querySelector('img').alt;
      const fermer = el('button', { type: 'button', class: c('home.grandFermer'), 'aria-label': T[lang].projet.fermer, text: '✕' });
      const d = el('dialog', { class: c('home.grand'), 'aria-label': legende }, [
        el('img', { src: 'media/site/dessin-couverture-2000.webp', alt: legende, width: '1398', height: '1328' }), fermer, el('p', { class: c('home.grandCredit'), text: '© Laura Pras' }),
      ]);
      fermer.addEventListener('click', () => d.close());
      d.addEventListener('click', (e) => e.target === d && d.close());
      ouvreDialogue(d);
      fermer.focus();
    });
  };

  const index = () => {
    const liste = $('home.liste', main);
    const apercu = $('home.apercu', main);
    if (!liste || !apercu) return;
    const lis = [...liste.children];
    const imgs = [...apercu.querySelectorAll('img')];
    const pose = (i) => [lis, imgs].forEach((g) => g.forEach((e, k) => (k === i ? e.setAttribute('data-on', 'true') : e.removeAttribute('data-on'))));
    lis.forEach((li, i) => { const a = li.querySelector('a'); a.addEventListener('pointerenter', () => pose(i)); a.addEventListener('focus', () => pose(i)); });
  };

  const references = () => {
    const ul = main.querySelector('ul[data-labels]');
    if (!ul) return;
    const L = JSON.parse(ul.dataset.labels);
    ul.querySelectorAll('button[data-fiche]').forEach((b) => b.addEventListener('click', () => {
      const x = JSON.parse(b.dataset.fiche);
      const ligne = (dt, dd) => dd && el('div', {}, [el('dt', { text: dt }), el('dd', { text: dd })]);
      const fermer = el('button', { type: 'button', class: 'lien', text: L.fermer });
      const d = el('dialog', { class: c('pages.fiche'), 'aria-label': x.titre }, [
        el('div', { class: c('pages.ficheIn') }, [
          el('img', { src: `media/site/inspirations/${x.id}.webp`, alt: x.titre, width: String(x.w), height: String(x.h) }),
          el('div', { class: c('pages.ficheTxt') }, [
            el('h2', { class: c('pages.ficheT'), text: x.titre }),
            el('dl', { class: c('pages.ficheDl') }, [ligne(L.auteur, x.auteur), ligne(L.lieu, x.lieu), ligne(L.annee, x.annee), x.info && ligne(' ', x.info)]),
            el('p', { class: c('pages.ficheCredit'), text: x.credit }),
            fermer,
          ]),
        ]),
      ]);
      fermer.addEventListener('click', () => d.close());
      d.addEventListener('click', (e) => e.target === d && d.close());
      ouvreDialogue(d);
      fermer.focus();
    }));
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
    if (l !== lang) { lang = l; chrome(l); }
    const t = tpl(`data-r="${p}"`);
    main.replaceChildren(t.content.cloneNode(true));
    document.title = t.dataset.titre;
    route = p;
    majEnTete(p);
    if (pousse) { try { history.pushState({ p }, '', '#' + p.slice(1).replace(/\/$/, '')); } catch (e) { /* cadre sans historique */ } }
    if (ancre && document.getElementById(ancre)) document.getElementById(ancre).scrollIntoView(); else scrollTo(0, 0);
    defile();
    planches(); visionneuses(); comparateurs(); couloir(); index(); references(); formulaire();
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

  const depart = (() => { const h = location.hash.slice(1).replace(/\./g, '/'); return h ? '/' + h.replace(/^\/+/, '') : '/fr/'; })();
  va(existe(depart.endsWith('/') ? depart : depart + '/') ? depart : '/fr/', { pousse: false });
})();
