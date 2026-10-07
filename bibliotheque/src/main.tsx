import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/cormorant-garamond/wght.css';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/jost/wght.css';
import '@fontsource/instrument-serif/latin-400.css';
import './styles.css';
import { App } from './App';
import { DEMO, installerDemo } from './lib/demo';
import { Ouverture } from './composants/Logo';

// à l'ouverture : le logo se dessine sur une page blanche, pendant que la bibliothèque se charge
const boite = document.createElement('div');
document.body.appendChild(boite);
const ouverture = createRoot(boite);
ouverture.render(<Ouverture fin={() => { ouverture.unmount(); boite.remove(); }} />);

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
