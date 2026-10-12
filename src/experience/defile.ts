import { xpOuvrirLightbox } from './lightbox';
import { xpCalme, xpEl, type XPContexte } from './outils';

/*
 * Page projet : les images du projet en défilé horizontal. En descendant dans la page, la bande se fige
 * et les images glissent vers la gauche, en grand, l'une après l'autre (comme une planche qu'on parcourt
 * du regard) ; puis la page reprend. Un clic ouvre l'image en plein écran. Sur téléphone, la bande se
 * parcourt au doigt.
 */
export function xpDefile(ctx: XPContexte, root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-defile]');
  const slug = root.querySelector<HTMLElement>('[data-projet]')?.dataset.projet;
  if (!box || !slug || box.childElementCount) return () => {};
  const ds = ctx.D.dessins.filter((d) => d.slug === slug);
  if (ds.length < 3) return () => {};
  const T = ctx.D.t;
  const n = ds.length;

  const compte = xpEl('span', { class: 'xp-df-compte' });
  const jauge = xpEl('i');
  const piste = xpEl('div', { class: 'xp-df-piste' });
  // la visionneuse plein écran reprend les mêmes images, dans le même ordre
  const tiroir = xpEl('div');
  ds.forEach((d, k) => {
    const fig = xpEl('figure', { class: `xp-df-vue${d.dessin ? ' xp-df-dessin' : ''}` }, [
      xpEl('button', { type: 'button', class: 'xp-df-img', 'aria-label': `${d.legende}, ${T.zoomIn}` }, [
        xpEl('img', { src: d.preview || d.thumb, alt: d.legende, loading: k < 3 ? 'eager' : 'lazy', draggable: 'false', width: Math.round(d.w), height: Math.round(d.h) }),
      ]),
      xpEl('figcaption', {}, [xpEl('span', { class: 'xp-df-n', text: String(k + 1).padStart(2, '0') }), xpEl('span', { text: d.legende })]),
    ]);
    fig.querySelector('button')!.addEventListener('click', () => xpOuvrirLightbox(ctx, tiroir, k, fig.querySelector('img')));
    piste.append(fig);
    tiroir.append(xpEl('button', { 'data-zoom': JSON.stringify({ id: d.id, legende: d.legende, preview: d.preview, svg: d.svg, full: d.full, ratio: d.w / d.h, credit: d.credit, thumb: d.thumb }) }));
  });
  const scene = xpEl('div', { class: 'xp-df-scene' }, [
    xpEl('div', { class: 'wrap xp-df-tete' }, [xpEl('h2', { class: 'eyebrow', text: T.defile }), compte, xpEl('span', { class: 'xp-df-jauge' }, [jauge])]),
    piste,
  ]);
  box.append(scene);

  // défilement : la hauteur de la section donne la longueur du parcours horizontal
  const etroit = () => matchMedia('(max-width: 760px)').matches || xpCalme();
  let course = 0, raf = 0;
  const mesure = () => {
    if (etroit()) { box.style.height = ''; piste.style.transform = ''; box.toggleAttribute('data-libre', true); maj(); return; }
    box.removeAttribute('data-libre');
    course = Math.max(0, piste.scrollWidth - innerWidth);
    box.style.height = `${course + innerHeight}px`;
    maj();
  };
  const maj = () => {
    raf = 0;
    let p: number;
    if (box.hasAttribute('data-libre')) {
      const max = piste.scrollWidth - piste.clientWidth;
      p = max > 0 ? piste.scrollLeft / max : 0;
    } else {
      const top = box.getBoundingClientRect().top;
      p = course > 0 ? Math.min(1, Math.max(0, -top / course)) : 0;
      piste.style.transform = `translate3d(${(-p * course).toFixed(1)}px, 0, 0)`;
    }
    jauge.style.transform = `scaleX(${Math.max(0.03, p)})`;
    compte.innerHTML = `${String(Math.min(n, Math.round(p * (n - 1)) + 1)).padStart(2, '0')}<span> / ${String(n).padStart(2, '0')}</span>`;
  };
  const defile = () => { if (!raf) raf = requestAnimationFrame(maj); };
  addEventListener('scroll', defile, { passive: true });
  piste.addEventListener('scroll', defile, { passive: true });
  addEventListener('resize', mesure);
  // les images arrivent : leur largeur change la course
  piste.querySelectorAll('img').forEach((i) => i.addEventListener('load', mesure, { once: true }));
  mesure();
  return () => { cancelAnimationFrame(raf); removeEventListener('scroll', defile); removeEventListener('resize', mesure); };
}
