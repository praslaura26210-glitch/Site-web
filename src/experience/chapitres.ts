import { xpEl, type XPContexte } from './outils';

/**
 * Page projet : un fil de lecture. Sur ordinateur, les chapitres du projet sur le bord droit
 * (le chapitre en cours en terre cuite, un clic pour y aller) ; partout, un trait de progression en haut.
 * Les chapitres sont les éléments marqués data-chapitre.
 */
export function xpChapitres(ctx: XPContexte, root: HTMLElement) {
  const ch = [...root.querySelectorAll<HTMLElement>('[data-chapitre]')];
  if (ch.length < 2) return () => {};
  const T = ctx.D.t;
  const barre = xpEl('div', { class: 'xp-ch-barre', 'aria-hidden': 'true' }, [xpEl('i')]);
  const liste = xpEl('ol', { class: 'xp-ch-liste' });
  const nav = xpEl('nav', { class: 'xp-ch', 'aria-label': T.chapitres }, [liste]);
  const mobile = xpEl('button', { type: 'button', class: 'xp-ch-mobile', 'aria-expanded': 'false' });
  ch.forEach((c, k) => {
    const a = xpEl('a', { href: `#${c.id}` }, [xpEl('span', { class: 'xp-ch-n', text: String(k + 1).padStart(2, '0') }), xpEl('span', { class: 'xp-ch-t', text: c.dataset.chapitre! })]);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      nav.removeAttribute('data-ouvert');
      mobile.setAttribute('aria-expanded', 'false');
      const y = c.getBoundingClientRect().top + scrollY - 96;
      scrollTo({ top: y, behavior: 'smooth' });
    });
    liste.append(xpEl('li', {}, [a]));
  });
  mobile.addEventListener('click', () => {
    const o = !nav.hasAttribute('data-ouvert');
    nav.toggleAttribute('data-ouvert', o);
    mobile.setAttribute('aria-expanded', String(o));
  });
  document.body.append(barre, nav, mobile);

  let actif = -1;
  const maj = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    (barre.firstElementChild as HTMLElement).style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    let k = 0;
    ch.forEach((c, j) => { if (c.getBoundingClientRect().top < innerHeight * 0.45) k = j; });
    // visible seulement une fois l'ouverture du projet passée
    const montre = ch[0].getBoundingClientRect().top < innerHeight * 0.9;
    nav.toggleAttribute('data-visible', montre);
    mobile.toggleAttribute('data-visible', montre);
    if (k === actif) return;
    actif = k;
    [...liste.children].forEach((li, j) => { const a = li.firstElementChild!; if (j === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); li.toggleAttribute('data-lu', j < k); });
    mobile.innerHTML = `<span class="xp-ch-n">${String(k + 1).padStart(2, '0')} / ${String(ch.length).padStart(2, '0')}</span> ${ch[k].dataset.chapitre}`;
  };
  addEventListener('scroll', maj, { passive: true });
  addEventListener('resize', maj);
  maj();
  return () => { removeEventListener('scroll', maj); removeEventListener('resize', maj); barre.remove(); nav.remove(); mobile.remove(); };
}
