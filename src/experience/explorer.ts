import { xpDialogue, xpEl, xpNorm, type XPContexte } from './outils';

type Res = { type: 'page' | 'projet' | 'dessin' | 'action'; label: string; sous?: string; href?: string; thumb?: string; n?: string; action?: () => void };

/** Explorateur : tout le site dans une seule fenêtre de recherche (pages, projets, dessins). */
export function xpExplorer(ctx: XPContexte, actions: { visite: () => void; raccourcis: () => void }) {
  if (document.querySelector('dialog.xp-ex')) return;
  const T = ctx.D.t;
  const champ = xpEl('input', { type: 'search', class: 'xp-ex-champ', placeholder: T.rechercher, 'aria-label': T.rechercher, autocomplete: 'off', spellcheck: 'false', id: 'xp-ex-champ' });
  const fermer = xpEl('button', { type: 'button', class: 'xp-ex-fermer', text: T.fermer });
  const compte = xpEl('p', { class: 'xp-ex-compte', 'aria-live': 'polite' });
  const corps = xpEl('div', { class: 'xp-ex-corps' });
  const d = xpEl('dialog', { class: 'xp-ex', 'aria-label': T.explorer }, [
    xpEl('div', { class: 'xp-ex-in' }, [
      xpEl('div', { class: 'xp-ex-tete' }, [
        xpEl('span', { class: 'xp-ex-loupe', 'aria-hidden': 'true', html: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="8.5" cy="8.5" r="6"/><path d="m13 13 5 5"/></svg>' }),
        champ, fermer,
      ]),
      compte, corps,
    ]),
  ]);

  const pages: Res[] = ctx.D.pages.map((p) => ({ type: 'page', label: p.label, href: p.href }));
  const actionsRes: Res[] = [
    { type: 'action', label: T.visite, sous: 'V', action: () => { d.close(); actions.visite(); } },
    { type: 'action', label: T.raccourcis, sous: '?', action: () => { d.close(); actions.raccourcis(); } },
  ];
  const projets: Res[] = ctx.D.projets.map((p) => ({ type: 'projet', label: p.titre, sous: [p.programme, p.annee].filter(Boolean).join(' · '), href: p.href, thumb: p.cover.srcSmall || p.cover.src, n: String(p.n).padStart(2, '0') }));
  const dessins: Res[] = ctx.D.dessins.map((x) => ({ type: 'dessin', label: x.legende, sous: x.projet, href: x.href, thumb: x.thumb }));

  let items: { r: Res; el: HTMLElement }[] = [];
  let sel = 0;
  const choisir = (r: Res) => {
    if (r.action) return r.action();
    d.close();
    if (r.href) ctx.naviguer(r.href);
  };
  const ligne = (r: Res) => {
    const a = xpEl('a', { class: `xp-ex-res xp-ex-${r.type}`, href: r.href ? ctx.href(r.href) : '#', role: 'option' }, [
      r.thumb ? xpEl('span', { class: 'xp-ex-vign' }, [xpEl('img', { src: r.thumb, alt: '', loading: 'lazy' })]) : null,
      r.n ? xpEl('span', { class: 'xp-ex-n', text: r.n }) : null,
      xpEl('span', { class: 'xp-ex-label', text: r.label }),
      r.sous ? xpEl('span', { class: 'xp-ex-sous', text: r.sous }) : null,
    ]);
    a.addEventListener('click', (e) => { e.preventDefault(); choisir(r); });
    a.addEventListener('pointermove', () => marque(items.findIndex((x) => x.el === a)));
    return a;
  };
  const marque = (k: number) => {
    if (k < 0 || !items.length) return;
    sel = Math.max(0, Math.min(items.length - 1, k));
    items.forEach((x, j) => x.el.toggleAttribute('data-sel', j === sel));
  };
  const rendu = () => {
    const q = xpNorm(champ.value.trim());
    const garde = (r: Res) => !q || q.split(/\s+/).every((m) => xpNorm(`${r.label} ${r.sous || ''}`).includes(m));
    const groupes: [string, Res[], string][] = [
      [T.projets, projets.filter(garde), 'xp-ex-liste'],
      [T.dessins, dessins.filter(garde), 'xp-ex-mosaique'],
      [T.pages, [...pages, ...actionsRes].filter(garde), 'xp-ex-liste xp-ex-pages'],
    ];
    corps.replaceChildren();
    items = [];
    let total = 0;
    for (const [titre, rs, cls] of groupes) {
      if (!rs.length) continue;
      total += rs.length;
      const ul = xpEl('div', { class: cls, role: 'listbox', 'aria-label': titre });
      rs.forEach((r) => { const el = ligne(r); items.push({ r, el }); ul.append(el); });
      corps.append(xpEl('section', { class: 'xp-ex-groupe' }, [xpEl('h2', { class: 'eyebrow', text: `${titre} · ${rs.length}` }), ul]));
    }
    if (!total) corps.append(xpEl('p', { class: 'xp-ex-vide', text: T.aucun }));
    compte.textContent = q ? `${total} ${T.resultats}` : '';
    marque(0);
  };
  champ.addEventListener('input', rendu);
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      marque(sel + (e.key === 'ArrowDown' ? 1 : -1));
      items[sel]?.el.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && items[sel] && document.activeElement === champ) {
      e.preventDefault();
      choisir(items[sel].r);
    }
  });
  fermer.addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  rendu();
  xpDialogue(d);
  champ.focus();
}
