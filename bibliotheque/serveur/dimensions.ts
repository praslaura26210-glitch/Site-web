/** Largeur et hauteur d'une image JPEG, PNG, GIF ou WebP, lues dans l'en-tête du fichier. */
export function dimensions(buf: ArrayBuffer): { w: number; h: number } | null {
  const b = new Uint8Array(buf);
  const v = new DataView(buf);
  if (b.length < 30) return null;
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50) return { w: v.getUint32(16), h: v.getUint32(20) };
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49) return { w: v.getUint16(6, true), h: v.getUint16(8, true) };
  // WebP
  if (b[0] === 0x52 && b[8] === 0x57 && b[9] === 0x45) {
    const fmt = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (fmt === 'VP8 ') return { w: v.getUint16(26, true) & 0x3fff, h: v.getUint16(28, true) & 0x3fff };
    if (fmt === 'VP8L') {
      const n = v.getUint32(21, true);
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
    }
    if (fmt === 'VP8X') {
      return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    }
    return null;
  }
  // JPEG : on parcourt les segments jusqu'au marqueur SOF
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: v.getUint16(i + 5), w: v.getUint16(i + 7) };
      }
      i += 2 + v.getUint16(i + 2);
    }
  }
  return null;
}

export function typeImage(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49) return 'image/gif';
  if (b[0] === 0x52 && b[8] === 0x57) return 'image/webp';
  return null;
}
