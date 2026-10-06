/** Export statique : le dossier out/ se dépose tel quel sur Netlify ou Vercel. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
