import { xpCalme, xpDialogue, xpEl, xpFleche, xpGlisse, xpSaisie, type XPContexte } from './outils';

type Ref = { id: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; info?: string; w: number; h: number; img: string };

/** Références : un clic ouvre la fiche ; on passe d'une référence à l'autre sans la refermer (← →, glissé). */
export function xpFiches(ctx: XPContexte, root: HTMLElement) {
  const ul = root.querySelector<HTMLElement>('[data-refs]');
  if (!ul) return () => {};
  const L = JSON.parse(ul.dataset.refs!) as { fermer: string; auteur: string; lieu: string; annee: string };
  const tuiles = [...ul.querySelectorAll<HTMLElement>('[data-fiche]')];
  const refs = tuiles.map((b) => JSON.parse(b.dataset.fiche!) as Ref);

  const ouvre = (i: number) => {
    const T = ctx.D.t;
    let cur = i;
    const n = refs.length;
    const fig = xpEl('figure', { class: 'xp-fi-img' });
    const txt = xpEl('div', { class: 'xp-fi-txt' });
    const compte = xpEl('span', { class: 'xp-fi-compte' });
    const prec = xpEl('button', { type: 'button', class: 'xp-fi-nav', 'aria-label': T.precedent, html: xpFleche(-1) });
    const suiv = xpEl('button', { type: 'button', class: 'xp-fi-nav', 'aria-label': T.suivant, html: xpFleche(1) });
    const fermer = xpEl('button', { type: 'button', class: 'lien xp-fi-fermer', text: L.fermer });
    const d = xpEl('dialog', { class: 'xp-fi' }, [
      xpEl('div', { class: 'xp-fi-in' }, [fig, xpEl('div', { class: 'xp-fi-col' }, [txt, xpEl('div', { class: 'xp-fi-bas' }, [prec, compte, suiv, fermer])])]),
    ]);
    const ligne = (dt: string, dd?: string) => (dd ? xpEl('div', {}, [xpEl('dt', { text: dt }), xpEl('dd', { text: dd })]) : null);
    const montre = (k: number) => {
      const sens = k > cur ? 1 : -1;
      cur = (k + n) % n;
      const r = refs[cur];
      d.setAttribute('aria-label', r.titre);
      fig.replaceChildren(xpEl('img', { src: r.img, alt: r.titre, width: r.w, height: r.h }));
      txt.replaceChildren(
        xpEl('h2', { class: 'xp-fi-titre', text: r.titre }),
        xpEl('dl', { class: 'xp-fi-dl' }, [ligne(L.auteur, r.auteur), ligne(L.lieu, r.lieu), ligne(L.annee, r.annee), ligne(' ', r.info)]),
        xpEl('p', { class: 'xp-fi-credit', text: r.credit }),
      );
      compte.innerHTML = `${String(cur + 1).padStart(2, '0')}<span> / ${String(n).padStart(2, '0')}</span>`;
      if (!xpCalme()) { d.dataset.sens = String(sens); d.classList.remove('xp-fi-entre'); void d.offsetWidth; d.classList.add('xp-fi-entre'); }
    };
    prec.addEventListener('click', () => montre(cur - 1));
    suiv.addEventListener('click', () => montre(cur + 1));
    fermer.addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    d.addEventListener('keydown', (e) => {
      if (xpSaisie(e)) return;
      if (e.key === 'ArrowRight') montre(cur + 1); else if (e.key === 'ArrowLeft') montre(cur - 1); else return;
      e.preventDefault();
    });
    xpGlisse(fig, (k) => montre(cur + k));
    montre(i);
    xpDialogue(d, () => tuiles[cur]?.focus());
    fermer.focus();
  };
  const clic = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-fiche]');
    if (!b || !ul.contains(b)) return;
    ouvre(tuiles.indexOf(b));
  };
  ul.addEventListener('click', clic);
  return () => ul.removeEventListener('click', clic);
}
