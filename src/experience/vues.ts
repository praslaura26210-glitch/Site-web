import { xpCalme } from './outils';

const CLE = 'lp-vue-projets';

/** Page Projets : trois façons de parcourir (sommaire, planches, frise), au choix du visiteur, mémorisé. */
export function xpVues(root: HTMLElement) {
  const nettoie: (() => void)[] = [];
  root.querySelectorAll<HTMLElement>('[data-vues]').forEach((box) => {
    const boutons = [...box.querySelectorAll<HTMLButtonElement>('[data-vue-btn]')];
    const pose = (v: string, memo = true) => {
      if (!box.querySelector(`[data-vue-panneau="${v}"]`)) return;
      box.dataset.vue = v;
      boutons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vueBtn === v)));
      if (memo) { try { localStorage.setItem(CLE, v); } catch { /* stockage indisponible */ } }
      const p = box.querySelector<HTMLElement>(`[data-vue-panneau="${v}"]`)!;
      if (!xpCalme()) { p.classList.remove('xp-vue-entre'); void p.offsetWidth; p.classList.add('xp-vue-entre'); }
      p.querySelectorAll<HTMLElement>('.rv[data-rv="wait"]').forEach((e) => (e.dataset.rv = 'in'));
    };
    boutons.forEach((b) => b.addEventListener('click', () => pose(b.dataset.vueBtn!)));
    let memo: string | null = null;
    try { memo = localStorage.getItem(CLE); } catch { /* idem */ }
    if (memo) pose(memo, false);
  });

  // frise : glisser pour faire défiler, molette verticale convertie en défilement horizontal, flèches
  root.querySelectorAll<HTMLElement>('[data-frise]').forEach((f) => {
    const piste = f.querySelector<HTMLElement>('[data-frise-piste]')!;
    const jauge = f.querySelector<HTMLElement>('[data-frise-jauge]');
    const [prec, suiv] = [f.querySelector<HTMLButtonElement>('[data-frise-prec]'), f.querySelector<HTMLButtonElement>('[data-frise-suiv]')];
    const maj = () => {
      const max = piste.scrollWidth - piste.clientWidth;
      if (jauge) jauge.style.transform = `scaleX(${max > 0 ? Math.max(0.04, piste.scrollLeft / max) : 1})`;
      if (prec) prec.disabled = piste.scrollLeft <= 2;
      if (suiv) suiv.disabled = piste.scrollLeft >= max - 2;
    };
    const pas = () => Math.max(260, piste.clientWidth * 0.6);
    prec?.addEventListener('click', () => piste.scrollBy({ left: -pas(), behavior: 'smooth' }));
    suiv?.addEventListener('click', () => piste.scrollBy({ left: pas(), behavior: 'smooth' }));
    piste.addEventListener('scroll', maj, { passive: true });
    piste.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = piste.scrollWidth - piste.clientWidth;
      if ((e.deltaY > 0 && piste.scrollLeft < max - 1) || (e.deltaY < 0 && piste.scrollLeft > 1)) { e.preventDefault(); piste.scrollLeft += e.deltaY; }
    }, { passive: false });
    let x0: number | null = null, s0 = 0, bouge = false;
    piste.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = piste.scrollLeft; bouge = false; });
    const glisse = (e: PointerEvent) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) { bouge = true; piste.dataset.glisse = ''; }
      piste.scrollLeft = s0 - dx;
    };
    const fin = () => { x0 = null; delete piste.dataset.glisse; };
    addEventListener('pointermove', glisse);
    addEventListener('pointerup', fin);
    nettoie.push(() => { removeEventListener('pointermove', glisse); removeEventListener('pointerup', fin); });
    piste.addEventListener('click', (e) => { if (bouge) { e.preventDefault(); e.stopPropagation(); bouge = false; } }, true);
    piste.addEventListener('dragstart', (e) => e.preventDefault());
    piste.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') piste.scrollBy({ left: pas(), behavior: 'smooth' });
      else if (e.key === 'ArrowLeft') piste.scrollBy({ left: -pas(), behavior: 'smooth' });
      else return;
      e.preventDefault();
    });
    requestAnimationFrame(maj);
  });
  return () => nettoie.forEach((f) => f());
}
