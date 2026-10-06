'use client';
import { useEffect } from 'react';
import { setState } from '@/lib/store';

const visibles = new Set<Element>();

/** Le canvas 3D calcule des images tant qu'au moins une section 3D est à l'écran. */
export function useStageSection(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    setState({ scene: 'building' });
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) visibles.add(el);
      else visibles.delete(el);
      setState({ stageVisible: visibles.size > 0 });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      visibles.delete(el);
      setState({ stageVisible: visibles.size > 0, ...(visibles.size ? {} : { scene: 'none' }) });
    };
  }, [enabled, ref]);
}
