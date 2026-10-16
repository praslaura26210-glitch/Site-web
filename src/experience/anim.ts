import { xpCalme, type XPContexte } from './outils';

/*
 * Mouvements de la page. Règle : un mouvement n'existe que s'il répond à une question du visiteur.
 *   « Où suis-je ? » (orientation) · « Qu'est-ce qui a réagi ? » (retour d'action)
 *   « D'où vient ce que je vois ? » (continuité) · « Qu'est-ce que je peux faire ici ? » (indice)
 * Rien de décoratif, rien qui retienne le contenu : le texte et les images sont lisibles tout de suite.
 * Durées courtes (de 150 à 450 ms ; seule la photo qui devient couverture prend un peu plus).
 */

/** En-tête : il s'efface quand on descend (plus de place pour les images) et revient dès qu'on remonte. */
export function xpEntete() {
  const html = document.documentElement;
  let y0 = scrollY;
  const defile = () => {
    const y = scrollY;
    if (document.querySelector('header[data-open]')) return;
    if (y > 240 && y > y0 + 4) html.dataset.enteteCache = '';
    else if (y < y0 - 4 || y < 120) delete html.dataset.enteteCache;
    y0 = y;
  };
  addEventListener('scroll', defile, { passive: true });
  return () => removeEventListener('scroll', defile);
}

/**
 * Préchargement : dès qu'on survole un projet (ou qu'on le sélectionne au clavier), sa grande image
 * se charge. Au clic, la page s'ouvre sans attente et la photo reste nette pendant la transition.
 */
export function xpPrecharge(ctx: XPContexte) {
  const fait = new Set<string>();
  const vise = (e: Event) => {
    const a = (e.target as Element).closest?.('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    const p = ctx.D.projets.find((x) => /\/(projets|livres)\//.test(h) && h.replace(/\/$/, "").endsWith(`/${x.slug}`));
    if (!p || fait.has(p.slug)) return;
    fait.add(p.slug);
    new Image().src = p.cover.src;
  };
  document.addEventListener('pointerover', vise, { passive: true });
  document.addEventListener('focusin', vise);
  return () => { document.removeEventListener('pointerover', vise); document.removeEventListener('focusin', vise); };
}

/** Images : celles qui ne sont pas encore arrivées apparaissent en fondu court au lieu de surgir par morceaux. */
export function xpImagesDouces(root: HTMLElement) {
  const imgs = [...root.querySelectorAll<HTMLImageElement>('figure img, [class*="__carteImg"] img, [class*="__tuile"] img')].filter((i) => !i.complete && !i.closest('[hidden]'));
  imgs.forEach((i) => {
    i.dataset.attente = '';
    const fin = () => { delete i.dataset.attente; };
    i.addEventListener('load', fin, { once: true });
    i.addEventListener('error', fin, { once: true });
  });
  return () => imgs.forEach((i) => delete i.dataset.attente);
}

/** Écouter : la voix de Laura qui présente le projet. Rien ne se lance tout seul ; un clic pour lire, un clic pour arrêter. */
export function xpEcoute(root: HTMLElement) {
  const boutons = [...root.querySelectorAll<HTMLButtonElement>('[data-ecoute]')];
  const sons: HTMLAudioElement[] = [];
  boutons.forEach((b) => {
    const son = new Audio();
    son.preload = 'metadata';
    son.src = b.dataset.ecoute!;
    sons.push(son);
    const t = b.querySelector<HTMLElement>('.xp-ecoute-t')!, temps = b.querySelector<HTMLElement>('.xp-ecoute-temps')!, barre = b.querySelector<HTMLElement>('.xp-ecoute-barre i')!;
    const libelle = t.textContent || '';
    const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    son.addEventListener('loadedmetadata', () => (temps.textContent = mmss(son.duration)));
    son.addEventListener('timeupdate', () => {
      barre.style.transform = `scaleX(${son.duration ? son.currentTime / son.duration : 0})`;
      if (son.duration) temps.textContent = `${mmss(son.currentTime)} / ${mmss(son.duration)}`;
    });
    const etat = () => { const lit = !son.paused; b.toggleAttribute('data-lit', lit); t.textContent = lit ? b.dataset.pause || libelle : libelle; b.setAttribute('aria-pressed', String(lit)); };
    son.addEventListener('play', etat); son.addEventListener('pause', etat);
    son.addEventListener('ended', () => { son.currentTime = 0; etat(); });
    b.addEventListener('click', () => (son.paused ? son.play() : son.pause()));
  });
  return () => sons.forEach((s) => { s.pause(); s.src = ''; });
}

/** Accueil, carte du territoire : choisir un lieu montre ce que Laura y a fait ; la légende filtre projets, stages, études. */
export function xpTerritoire(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-territoire]');
  if (!box) return () => {};
  const info = box.querySelector<HTMLElement>('[data-terr-info]')!;
  const lieux = [...box.querySelectorAll<SVGGElement>('.xp-terr-lieu')];
  const masques = new Set<string>();
  const montre = (g: SVGGElement) => {
    const f = box.querySelector<HTMLElement>(`[data-terr-fiche="${g.dataset.lieu}"]`);
    if (!f) return;
    info.replaceChildren(...[...f.children].map((c) => c.cloneNode(true)));
    lieux.forEach((l) => l.toggleAttribute('data-actif', l === g));
  };
  lieux.forEach((g) => {
    g.addEventListener('pointerenter', () => montre(g));
    g.addEventListener('focus', () => montre(g));
    g.addEventListener('click', () => montre(g));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montre(g); (info.querySelector('a') as HTMLElement | null)?.focus(); } });
  });
  box.querySelectorAll<HTMLButtonElement>('[data-terr-filtre]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.terrFiltre!;
    if (masques.has(k)) masques.delete(k); else masques.add(k);
    b.setAttribute('aria-pressed', String(!masques.has(k)));
    box.toggleAttribute(`data-masque-${k}`, masques.has(k));
    lieux.forEach((g) => {
      const ty = (g.dataset.types || '').split(' ');
      const visible = ty.includes('m') || ty.some((x) => !masques.has(x));
      g.toggleAttribute('data-eteint', !visible);
    });
  }));
  return () => {};
}

/**
 * Les dessins qui se construisent (escalier) : quand le dessin arrive à l'écran, data-vu le fait apparaître,
 * forme après forme, de bas en haut (CSS) ; un clic le rejoue.
 */
export function xpConstruire(root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>('[data-construire]')];
  if (!els.length) return () => {};
  if (xpCalme()) { els.forEach((el) => { el.dataset.vu = ''; }); return () => {}; }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { (e.target as HTMLElement).dataset.vu = ''; io.unobserve(e.target); }
  }), { threshold: 0.35 });
  els.forEach((el) => io.observe(el));
  const rejoue = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-construire]');
    if (!el || !els.includes(el)) return;
    el.dataset.rejoue = '';
    delete el.dataset.vu;
    void el.offsetWidth;
    delete el.dataset.rejoue;
    el.dataset.vu = '';
  };
  root.addEventListener('click', rejoue);
  return () => { io.disconnect(); root.removeEventListener('click', rejoue); };
}

/**
 * Les lectures guidées (escalier) : la liste d'étapes défile à côté du dessin ; l'étape qui passe au milieu
 * de l'écran devient data-etape du bloc, et le dessin éclaire la partie qui la concerne (CSS).
 */
export function xpEtapes(root: HTMLElement) {
  const blocs = [...root.querySelectorAll<HTMLElement>('[data-etapes]')];
  if (!blocs.length) return () => {};
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    const b = el.closest<HTMLElement>('[data-etapes]');
    if (b) b.dataset.etape = el.dataset.etape || '0';
  }), { rootMargin: matchMedia('(max-width: 900px)').matches ? '-62% 0px -26% 0px' : '-45% 0px -45% 0px' });
  blocs.forEach((b) => b.querySelectorAll('li[data-etape]').forEach((li) => io.observe(li)));
  return () => io.disconnect();
}
