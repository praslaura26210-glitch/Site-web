/** Export statique : le dossier out/ se dépose tel quel sur Netlify ou Vercel. */
const nextConfig = {
  output: 'export',
  // aperçu en artefact : pages servies sans barre finale (fr/projets au lieu de fr/projets/index.html)
  trailingSlash: process.env.APERCU_ARTEFACT !== '1',
  distDir: process.env.APERCU_ARTEFACT === '1' ? '.next-apercu' : '.next',
  // l'hébergeur d'aperçu réserve les noms commençant par « _ » : les fichiers /_next passent sous /a/_next
  assetPrefix: process.env.APERCU_ARTEFACT === '1' ? '/a' : undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
