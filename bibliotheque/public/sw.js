// Bibliothèque : appli installable, lisible hors ligne (dernière version consultée).
const CACHE = 'bibliotheque-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icone.svg'])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const garder = async (req, rep) => {
  if (rep && rep.ok) (await caches.open(CACHE)).put(req, rep.clone());
  return rep;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // images : elles ne changent jamais, le cache d'abord
  if (url.pathname.startsWith('/api/images/')) {
    e.respondWith(caches.match(req).then((c) => c || fetch(req).then((r) => garder(req, r))));
    return;
  }
  // fiches : le réseau d'abord, la dernière copie sans connexion
  if (url.pathname === '/api/bibliotheque') {
    e.respondWith(fetch(req).then((r) => garder(req, r)).catch(() => caches.match(req).then((c) => c || Response.error())));
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  // pages et fichiers du site
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => garder('/', r)).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(
    caches.match(req).then((c) => {
      const reseau = fetch(req).then((r) => garder(req, r)).catch(() => c);
      return c || reseau;
    }),
  );
});
