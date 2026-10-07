import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import './styles.css';
import { App } from './App';
import { DEMO, installerDemo } from './lib/demo';

const demarrer = () =>
  createRoot(document.getElementById('racine')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// aperçu de démonstration : le serveur est simulé dans le navigateur
if (DEMO) installerDemo().then(demarrer);
else demarrer();

// appli installable et lisible hors ligne
if ('serviceWorker' in navigator && import.meta.env.PROD && !DEMO) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
