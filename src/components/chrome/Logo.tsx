/**
 * Le logo de Laura : une cabane dessinée à main levée, en six traits (le dernier est la porte).
 * `draw` : les traits se dessinent l'un après l'autre (voir .logoDraw dans globals.css).
 * `poids` multiplie l'épaisseur : plus le logo est petit, plus on l'épaissit pour qu'il reste lisible.
 */
export const TRAITS: { d: string; w: number; o?: number; porte?: boolean }[] = [
  { d: 'M19.1 116.4 L109 106.7', w: 1.1 },
  { d: 'M37.2 38 L37.2 124.8', w: 1 },
  { d: 'M92.4 19.2 L92.4 124.8', w: 1 },
  { d: 'M12 70.3 L98.9 27.9', w: 1.1 },
  // le bas du toit part un peu sous le haut : les deux traits ne se touchent pas
  { d: 'M26.1 65.9 L110 78.4', w: 1.05 },
  { d: 'M59.9 112 L59.9 85.9 L71.2 86.1 L71.2 110.8', w: 1, porte: true },
]

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
        <path key={i} d={t.d} strokeWidth={t.w * poids} strokeOpacity={t.o} pathLength={1} data-porte={t.porte || undefined} style={{ ['--i' as string]: i }} />
      ))}
    </svg>
  );
}
