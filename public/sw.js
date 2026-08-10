// public/sw.js
//
// Étape 1 vers le hors-ligne : PAS un mode transactionnel complet (créer/
// modifier des commandes sans connexion puis synchroniser). Ce service
// worker fait deux choses, plus modestes mais réelles :
//   1. Permet l'installation de l'app sur l'écran d'accueil (PWA).
//   2. Évite un écran blanc/erreur réseau : les pages déjà visitées et les
//      fichiers statiques restent consultables hors connexion (lecture
//      seule, dernières données connues — pas de nouvelles données).
//
// Toute création/modification (commande, stock...) nécessite toujours une
// vraie connexion — ce service worker ne met rien en file d'attente pour
// synchronisation ultérieure.

const CACHE_NAME = 'noveresto-shell-v1';
const BASE = '/app';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // jamais de cache sur POST/PATCH/DELETE (données transactionnelles)

  const url = new URL(request.url);

  // Ne jamais mettre en cache les appels API — ils doivent toujours
  // refléter les vraies données serveur quand une connexion existe.
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Réseau disponible : on sert la réponse fraîche, et on la met en
        // cache au passage pour la prochaine fois sans connexion.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        // Réseau indisponible : on sert la dernière version connue.
        caches.match(request).then((cached) => cached || caches.match(`${BASE}/offline`))
      )
  );
});
