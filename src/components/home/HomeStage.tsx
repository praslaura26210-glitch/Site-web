'use client';
import { useEffect, useRef } from 'react';
import { getState, setState } from '@/lib/store';

/** Active le terrain tant que le haut de l'accueil est visible. */
export default function HomeStage({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const st = getState();
    if (st.introDone && st.scene !== 'intro') setState({ scene: 'terrain' });
    const io = new IntersectionObserver(([e]) => {
      const s = getState();
      if (s.scene === 'intro') return;
      setState({ stageVisible: e.isIntersecting, scene: s.introDone ? 'terrain' : s.scene });
    }, { threshold: 0 });
    io.observe(ref.current!);
    return () => { io.disconnect(); setState({ stageVisible: false, scene: 'none' }); };
  }, []);
  return <section ref={ref} className={className}>{children}</section>;
}
