'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { live, setState } from '@/lib/store';
import { detectQuality } from '@/lib/quality';
import styles from './home.module.css';

const KEY = 'lp-intro-vue';
const DUREE = 3.6; // secondes

/**
 * Intro : une seule fois par session, bouton « passer », jamais si « réduire les animations ».
 * Version complète : la scène 3D (IntroScene) suit live.intro.
 * Version allégée : le dessin apparaît en fondu, puis le nom.
 */
export default function Intro({ skipLabel }: { skipLabel: string }) {
  const [mode, setMode] = useState<'off' | 'full' | 'lite'>('off');
  const [name, setName] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const tween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const q = detectQuality();
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}
    if (seen || q.reduced || new URLSearchParams(location.search).has('nointro')) {
      setState({ scene: q.lite ? 'none' : 'terrain', introDone: true });
      return;
    }
    const m = q.lite ? 'lite' : 'full';
    setMode(m);
    document.documentElement.dataset.intro = 'on';
    if (m === 'full') setState({ scene: 'intro', stageVisible: true, introDone: false });
    live.intro = 0;
    const o = { p: 0 };
    const start = () => {
      if (tween.current) return;
      tween.current = gsap.to(o, {
      p: 1,
      duration: m === 'full' ? DUREE : 2.2,
      ease: 'none',
      onUpdate: () => {
        live.intro = o.p;
        if (o.p > (m === 'full' ? 0.62 : 0.35)) setName(true);
        if (o.p > 0.86) setLeaving(true);
      },
      onComplete: finish,
      });
    };
    // version complète : on attend que la scène 3D ait chargé le dessin (au plus 2,5 s)
    if (m === 'full') {
      window.addEventListener('lp-intro-pret', start, { once: true });
      const t = setTimeout(start, 2500);
      return () => { clearTimeout(t); window.removeEventListener('lp-intro-pret', start); tween.current?.kill(); };
    }
    start();
    return () => { tween.current?.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    delete document.documentElement.dataset.intro;
    live.intro = 1;
    setState({ scene: detectQuality().lite ? 'none' : 'terrain', introDone: true });
    setMode('off');
  }

  function skip() {
    if (!tween.current) return finish();
    tween.current.timeScale(6);
  }

  useEffect(() => {
    if (mode === 'off') return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  if (mode === 'off') return null;
  return (
    <div className={`${styles.intro} ${leaving ? styles.introOut : ''}`} data-mode={mode} role="dialog" aria-label="Introduction">
      {mode === 'lite' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.introDrawing} src="/media/site/dessin-couverture-1000.webp" alt="" />
      )}
      <p className={`${styles.introName} ${name ? styles.on : ''}`} aria-hidden={!name}>Laura Pras</p>
      <button className={styles.skip} onClick={skip} autoFocus>
        {skipLabel}
      </button>
    </div>
  );
}
