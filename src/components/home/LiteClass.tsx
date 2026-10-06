'use client';
import { useEffect, useRef } from 'react';
import { detectQuality } from '@/lib/quality';

/** En version allégée, ajoute une classe au bloc parent (fond dessiné au lieu de la 3D). */
export default function LiteClass({ liteClass }: { liteClass: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (parent && detectQuality().lite) parent.classList.add(liteClass);
  }, [liteClass]);
  return <span ref={ref} hidden />;
}
