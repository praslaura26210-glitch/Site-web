'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Les éléments marqués « rv » apparaissent en douceur quand ils entrent à l'écran.
 * Ce qui est déjà visible au chargement ne bouge pas ; sans JavaScript, tout est visible.
 */
export default function Apparitions() {
  const path = usePathname();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = [...document.querySelectorAll<HTMLElement>('.rv:not([data-rv])')].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.92);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (e.target as HTMLElement).dataset.rv = 'in';
        io.unobserve(e.target);
      }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => { el.dataset.rv = 'wait'; io.observe(el); });
    return () => io.disconnect();
  }, [path]);
  return null;
}
