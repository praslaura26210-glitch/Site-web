import { xpCalme, xpDialogue, xpEl, xpFleche, xpGlisse, xpSaisie, type XPContexte } from './outils';

/**
 * Visite guidée : les six projets en diapositives plein écran. Rien ne défile tout seul :
 * on avance soi-même (flèches, glissé, molette, clic sur le fil), et l'on entre dans un projet quand on veut.
 */
export function xpVisite(ctx: XPContexte, depart = 0) {
  if (document.querySelector('dialog.xp-vi')) return;
  const T = ctx.D.t;
  const P = ctx.D.projets;
  const n = P.length + 1; // + la diapositive de fin
  let cur = Math.max(0, Math.min(n - 1, depart));

  const rail = xpEl('div', { class: 'xp-vi-rail' });
  const fil = xpEl('div', { class: 'xp-vi-fil', role: 'tablist', 'aria-label': T.visite });
  const prec = xpEl('button', { type: 'button', class: 'xp-vi-nav', 'aria-label': T.precedent, html: xpFleche(-1) });
  const suiv = xpEl('button', { type: 'button', class: 'xp-vi-nav', 'aria-label': T.suivant, html: xpFleche(1) });
  const compte = xpEl('span', { class: 'xp-vi-compte' });
  const quitter = xpEl('button', { type: 'button', class: 'xp-vi-quitter', text: T.quitter });

  const aller = (href: string) => (e: Event) => { e.preventDefault(); d.close(); ctx.naviguer(href); };
  P.forEach((p, k) => {
    const voir = xpEl('a', { class: 'lien', href: ctx.href(p.href), text: T.voirProjet });
    voir.addEventListener('click', aller(p.href));
    const img = xpEl('img', { src: p.cover.src, alt: '', loading: k < 2 ? 'eager' : 'lazy', draggable: 'false', width: p.cover.w, height: p.cover.h });
    if (p.cover.pos) img.style.objectPosition = p.cover.pos;
    rail.append(xpEl('section', { class: 'xp-vi-diapo', 'aria-roledescription': 'slide', 'aria-label': `${k + 1} / ${P.length} : ${p.titre}` }, [
      xpEl('div', { class: 'xp-vi-txt' }, [
        xpEl('p', { class: 'eyebrow xp-vi-n', html: `<span>${String(p.n).padStart(2, '0')}</span> / ${String(P.length).padStart(2, '0')}` }),
        xpEl('h2', { class: 'xp-vi-titre', text: p.titre }),
        xpEl('p', { class: 'eyebrow', text: [p.programme, p.annee, p.lieu].filter(Boolean).join(' · ') }),
        xpEl('p', { class: 'xp-vi-resume', text: p.resume }),
        voir,
      ]),
      xpEl('figure', { class: 'xp-vi-img' }, [img]),
    ]));
  });
  // fin : où aller ensuite
  const suite = xpEl('p', { class: 'xp-vi-suite' });
  ctx.D.pages.filter((p) => !/\/(mentions-legales|contact\/merci)\/$/.test(p.href) && p.href.split('/').length > 3).forEach((p) => {
    const a = xpEl('a', { class: 'lien', href: ctx.href(p.href), text: p.label });
    a.addEventListener('click', aller(p.href));
    suite.append(a);
  });
  const encore = xpEl('button', { type: 'button', class: 'lien', text: `↺ ${T.visite}` });
  encore.addEventListener('click', () => montre(0));
  suite.append(encore);
  rail.append(xpEl('section', { class: 'xp-vi-diapo xp-vi-fin', 'aria-label': T.visiteFin }, [
    xpEl('div', { class: 'xp-vi-txt' }, [xpEl('h2', { class: 'xp-vi-titre', text: T.visiteFin }), xpEl('p', { class: 'xp-vi-resume', text: T.visiteFinTexte }), suite]),
  ]));

  for (let k = 0; k < n; k++) {
    const b = xpEl('button', { type: 'button', role: 'tab', 'aria-label': k < P.length ? P[k].titre : T.visiteFin }, [xpEl('i')]);
    b.addEventListener('click', () => montre(k));
    fil.append(b);
  }

  const d = xpEl('dialog', { class: 'xp-vi', 'aria-label': T.visite }, [
    xpEl('div', { class: 'xp-vi-haut' }, [xpEl('span', { class: 'eyebrow', text: T.visite }), fil, quitter]),
    xpEl('div', { class: 'xp-vi-scene' }, [rail]),
    xpEl('div', { class: 'xp-vi-bas' }, [prec, compte, suiv, xpEl('span', { class: 'xp-vi-aide', text: T.glisser })]),
  ]);

  const montre = (k: number) => {
    cur = Math.max(0, Math.min(n - 1, k));
    rail.style.transform = `translateX(${-cur * 100}%)`;
    [...rail.children].forEach((s, j) => { s.toggleAttribute('data-on', j === cur); s.setAttribute('aria-hidden', String(j !== cur)); (s as HTMLElement).inert = j !== cur; });
    [...fil.children].forEach((b, j) => { b.setAttribute('aria-selected', String(j === cur)); b.toggleAttribute('data-vu', j < cur); });
    compte.innerHTML = `${String(Math.min(cur + 1, P.length)).padStart(2, '0')}<span> / ${String(P.length).padStart(2, '0')}</span>`;
    prec.disabled = cur === 0;
    suiv.disabled = cur === n - 1;
  };
  const va = (k: number) => montre(cur + k);
  prec.addEventListener('click', () => va(-1));
  suiv.addEventListener('click', () => va(1));
  quitter.addEventListener('click', () => d.close());
  xpGlisse(d, va);
  // molette : une diapositive par geste
  let verrou = 0;
  d.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 12 || Date.now() < verrou) return;
    verrou = Date.now() + 700;
    va(delta > 0 ? 1 : -1);
  }, { passive: true });
  d.addEventListener('keydown', (e) => {
    if (xpSaisie(e)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') va(1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') va(-1);
    else if (e.key === 'Home') montre(0);
    else if (e.key === 'End') montre(n - 1);
    else if (/^[1-9]$/.test(e.key) && +e.key <= P.length) montre(+e.key - 1);
    else if (e.key === 'Enter' && cur < P.length && (e.target as Element).tagName !== 'A' && (e.target as Element).tagName !== 'BUTTON') { d.close(); ctx.naviguer(P[cur].href); }
    else return;
    e.preventDefault();
  });
  if (xpCalme()) d.dataset.calme = '';
  xpDialogue(d);
  montre(cur);
  suiv.focus();
}
