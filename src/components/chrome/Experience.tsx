'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { xpDemarrer, xpPage } from '@/experience';
import { xpTransition } from '@/experience/transition';
import type { XPContexte, XPDonnees } from '@/experience/outils';

/** Branche la couche « expérience » (src/experience) sur le routeur de Next. */
export default function Experience() {
  const router = useRouter();
  const path = usePathname();
  const ctx = useRef<XPContexte | null>(null);
  // résolue quand la nouvelle page est affichée : la transition attend ce moment pour la dévoiler
  const pret = useRef<(() => void) | null>(null);
  if (!ctx.current && typeof document !== 'undefined') {
    const el = document.getElementById('lp-donnees');
    if (el) {
      const D = JSON.parse(el.textContent || '{}') as XPDonnees;
      ctx.current = {
        D,
        href: (h) => h,
        ancre: () => decodeURIComponent(location.hash.slice(1)),
        // l'accueil se recharge (l'ouverture se rejoue) ; une autre langue aussi (autres données)
        lien: (a) => {
          const h = a.getAttribute('href') || '';
          if (!h.startsWith('/') || h.startsWith('//') || /\.\w+$/.test(h.split('#')[0])) return null;
          if (!h.startsWith(`/${D.lang}/`) || /^\/\w\w\/?$/.test(h.split('#')[0])) return null;
          if (h.startsWith('#') || (h.split('#')[0] === location.pathname && h.includes('#'))) return null;
          return h;
        },
        naviguer: (h, image) => {
          const u = new URL(h, location.href);
          if (u.pathname === location.pathname) {
            history.pushState(null, '', u.hash || u.pathname);
            dispatchEvent(new Event('lp:ancre'));
            return;
          }
          xpTransition(() => new Promise<void>((resolve) => {
            pret.current = () => { if (!u.hash) scrollTo(0, 0); resolve(); };
            setTimeout(resolve, 2500);
            router.push(h, { scroll: false });
          }), image);
        },
      };
    }
  }
  useEffect(() => (ctx.current ? xpDemarrer(ctx.current) : undefined), []);
  useEffect(() => {
    pret.current?.();
    pret.current = null;
    const main = document.getElementById('contenu');
    return ctx.current && main ? xpPage(ctx.current, main) : undefined;
  }, [path]);
  return null;
}
