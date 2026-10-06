/**
 * Le logo de Laura : une cabane dessinée à main levée, en sept traits.
 * `draw` : les traits se dessinent l'un après l'autre (voir .logoDraw dans globals.css).
 * `poids` multiplie l'épaisseur : plus le logo est petit, plus on l'épaissit pour qu'il reste lisible.
 */
export const TRAITS: { d: string; w: number; o?: number }[] = [
  { d: 'M17 113.5 L104 103.5', w: 1.15 },
  { d: 'M40.5 29 L40 123', w: 1, o: 0.72 },
  { d: 'M91.5 20.5 L94 115', w: 1, o: 0.78 },
  { d: 'M24 62.5 L99 23.5', w: 1.3 },
  { d: 'M24 61.5 L106 74', w: 1.2 },
  { d: 'M65 107 L65.5 80.5 L74.5 81 L74.5 106.5', w: 1.1 },
  { d: 'M66.7 30.5 L67 40', w: 0.7, o: 0.35 },
];

export default function Logo({ className, draw = false, poids = 1, label = 'Laura Pras' }: { className?: string; draw?: boolean; poids?: number; label?: string }) {
  return (
    <svg
      className={`${className || ''} ${draw ? 'logoDraw' : ''}`}
      viewBox="12 16 98 112"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {TRAITS.map((t, i) => (
        <path key={i} d={t.d} strokeWidth={t.w * poids} strokeOpacity={t.o} pathLength={1} style={draw ? { ['--i' as string]: i } : undefined} />
      ))}
    </svg>
  );
}
