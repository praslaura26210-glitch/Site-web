// Le relief du terrain, en JavaScript, identique au shader de TerrainScene (bruit simplex d'Ashima).
// Sert à poser les maquettes de l'index exactement sur le sol.
const mod289 = (x: number) => x - Math.floor(x * (1 / 289)) * 289;
const permute = (x: number) => mod289((x * 34 + 1) * x);
const fract = (x: number) => x - Math.floor(x);

function snoise(vx: number, vy: number) {
  const C = [0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439];
  let ix = Math.floor(vx + (vx + vy) * C[1]);
  let iy = Math.floor(vy + (vx + vy) * C[1]);
  const x0x = vx - ix + (ix + iy) * C[0];
  const x0y = vy - iy + (ix + iy) * C[0];
  const i1x = x0x > x0y ? 1 : 0, i1y = x0x > x0y ? 0 : 1;
  const x12 = [x0x + C[0] - i1x, x0y + C[0] - i1y, x0x + C[2], x0y + C[2]];
  ix = mod289(ix); iy = mod289(iy);
  const p = [0, i1y, 1].map((d, k) => permute(permute(iy + d) + ix + [0, i1x, 1][k]));
  const m = [x0x * x0x + x0y * x0y, x12[0] * x12[0] + x12[1] * x12[1], x12[2] * x12[2] + x12[3] * x12[3]].map((d) => {
    const v = Math.max(0.5 - d, 0);
    return v * v * v * v;
  });
  const g = [0, 0, 0];
  const xs = [x0x, x12[0], x12[2]], ys = [x0y, x12[1], x12[3]];
  for (let k = 0; k < 3; k++) {
    const x = 2 * fract(p[k] * C[3]) - 1;
    const h = Math.abs(x) - 0.5;
    const ox = Math.floor(x + 0.5);
    const a0 = x - ox;
    m[k] *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    g[k] = a0 * xs[k] + h * ys[k];
  }
  return 130 * (m[0] * g[0] + m[1] * g[1] + m[2] * g[2]);
}

export function height(px: number, py: number) {
  let h = 0, a = 0.55, f = 0.32;
  for (let i = 0; i < 5; i++) { h += a * snoise(px * f + 3.1, py * f + 7.7); f *= 2.03; a *= 0.48; }
  const river = px * 0.18 + Math.sin(py * 0.42) * 1.1 + Math.sin(py * 0.17 + 1.3) * 0.8;
  const valley = 1 - Math.exp(-river * river * 1.6);
  return (h * 0.75 + 0.35) * valley * 1.15 - (1 - valley) * 0.18;
}

/** Hauteur monde d'un point (x, z) du terrain : même transformation que le vertex shader. */
export function terrainY(x: number, z: number) {
  return -1.25 + height(x, -z) * 0.55;
}
