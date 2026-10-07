import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_DEMO=1 : aperçu de démonstration (claude.ai), polices et images intégrées, chemins relatifs
const demo = process.env.VITE_DEMO === '1';

export default defineConfig({
  plugins: [react()],
  base: demo ? './' : '/',
  build: demo ? { outDir: 'dist-apercu', assetsInlineLimit: 1_000_000, modulePreload: false } : {},
  server: { proxy: { '/api': 'http://localhost:8788' } },
});
