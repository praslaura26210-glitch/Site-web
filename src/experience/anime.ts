/** Ce qui m'anime (À propos) : un clic sur une photo l'ouvre sur place et referme les autres ; ← → passent à la voisine. */
export function xpAnime(root: HTMLElement) {
  const ul = root.querySelector<HTMLElement>('[data-anime]');
  if (!ul) return () => {};
  const lis = [...ul.children] as HTMLElement[];
  const ouvre = (k: number, focus = false) => {
    lis.forEach((li, i) => {
      li.toggleAttribute('data-on', i === k);
      li.querySelector('button')?.setAttribute('aria-expanded', String(i === k));
    });
    if (focus) lis[k].querySelector('button')?.focus();
  };
  const clic = (e: MouseEvent) => {
    const li = (e.target as Element).closest('.xp-an-btn')?.parentElement as HTMLElement | null;
    if (li && lis.includes(li)) ouvre(lis.indexOf(li));
  };
  const touche = (e: KeyboardEvent) => {
    const li = (e.target as Element).closest('.xp-an-btn')?.parentElement as HTMLElement | null;
    if (!li || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    ouvre((lis.indexOf(li) + (e.key === 'ArrowRight' ? 1 : -1) + lis.length) % lis.length, true);
  };
  ul.addEventListener('click', clic);
  ul.addEventListener('keydown', touche);
  return () => { ul.removeEventListener('click', clic); ul.removeEventListener('keydown', touche); };
}
