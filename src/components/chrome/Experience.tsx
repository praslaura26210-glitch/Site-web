'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { xpDemarrer, xpPage } from '@/experience';
import type { XPContexte, XPDonnees } from '@/experience/outils';

/** Branche la couche « expérience » (src/experience) sur le routeur de Next. */
export default function Experience() {
  const router = useRouter();
  const path = usePathname();
  const ctx = useRef<XPContexte | null>(null);
  if (!ctx.current && typeof document !== 'undefined') {
    const el = document.getElementById('lp-donnees');
    if (el) {
      ctx.current = {
        D: JSON.parse(el.textContent || '{}') as XPDonnees,
        href: (h) => h,
        ancre: () => decodeURIComponent(location.hash.slice(1)),
        naviguer: (h) => {
          const u = new URL(h, location.href);
          if (u.pathname === location.pathname) {
            history.pushState(null, '', u.hash || u.pathname);
            dispatchEvent(new Event('lp:ancre'));
          } else router.push(h);
        },
      };
    }
  }
  useEffect(() => (ctx.current ? xpDemarrer(ctx.current) : undefined), []);
  useEffect(() => {
    const main = document.getElementById('contenu');
    return ctx.current && main ? xpPage(ctx.current, main) : undefined;
  }, [path]);
  return null;
}
