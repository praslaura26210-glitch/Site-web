/** Le logo en ligne continue (terrain, cyprès, maison). `draw` : le trait se dessine à l'affichage. */
export const LOGO_PATH =
  'M2 62 C 22 62, 40 61, 58 58 C 74 55, 86 50, 98 45 C 101 44, 103 43, 104 42 C 103 34, 104 26, 106.5 21 C 109 26, 110 34, 108.5 41 C 112 40, 116 39, 120 38 L 120 27 L 132 17 L 144 27 L 144 38 L 137 38 L 137 32.5 C 137 29.5, 133 29.5, 133 32.5 L 133 38 L 150 38 C 160 40, 170 45, 182 49 C 198 54, 216 57, 238 57';

export default function Logo({ className, draw = false, width = 1.6, label = 'Laura Pras' }: { className?: string; draw?: boolean; width?: number; label?: string }) {
  return (
    <svg className={className} viewBox="0 10 240 58" {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} data-draw={draw || undefined}>
      <path d={LOGO_PATH} pathLength={1} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" vectorEffect={draw ? undefined : 'non-scaling-stroke'} />
    </svg>
  );
}
