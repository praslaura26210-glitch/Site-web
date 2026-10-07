/** Réduit une photo (téléphone) avant l'envoi : 1600 px au plus, WebP, ou JPEG si le navigateur ne sait pas faire de WebP. */
export async function compresser(fichier: File, cote = 1600): Promise<Blob> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k);
    const h = Math.round(img.naturalHeight * k);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const vers = (type: string, q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
    const webp = await vers('image/webp', 0.82);
    if (webp && webp.type === 'image/webp') return webp;
    return (await vers('image/jpeg', 0.86)) ?? fichier;
  } finally {
    URL.revokeObjectURL(url);
  }
}
