importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  workbox.setConfig({ debug: false });

  // Forcer l'activation immédiate du SW et prise en charge clients
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Cache des assets essentiels avec versionnement (précache)
  workbox.precaching.precacheAndRoute([
    { url: 'asset-manifest.json', revision: '1aae72d07b1482ce693fcc635c69eded' },
    { url: 'icons/icon-144x144.png', revision: '20d1be77e1eb4ce788cebbd9a052da05' },
    { url: 'icons/icon-192x192.png', revision: '784eab32205fced657f053657589fef1' },
    { url: 'icons/icon-256x256.png', revision: '7ba6df86005200e1a02c9eb3bd73d1ee' },
    { url: 'icons/icon-512x512.png', revision: 'dbdf3848694a414ef0ad15ce50c6e79d' },
    { url: 'icons/icons.json', revision: '5dbbc3fe59816e65ba28e355a58ea45c' },
    { url: 'index.html', revision: 'e077b4d153afe08c24351bd82ae4071b' },
    { url: 'manifest.json', revision: '85a7323c60bca5ab8bea1f44732fa525' },
    { url: 'static/css/main.7a6564fc.css', revision: 'c74dd12948a1a870627561cf76eb9ddd' },
    { url: 'static/js/main.062af3e9.js', revision: '572d63bee543ade520cd90a128da757a' },
    { url: 'offline.html', revision: '1' }  // Ajout de la page offline
  ]);

  // Stratégie cache first pour les images / icônes
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 jours
      ],
    })
  );

  // Stratégie réseau d'abord pour les HTML / pages
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'document',
    async ({event}) => {
      try {
        return await workbox.strategies.networkFirst({
          cacheName: 'html-cache',
          networkTimeoutSeconds: 3,
        }).handle({event});
      } catch (error) {
        return caches.match('offline.html', {cacheName: workbox.core.cacheNames.precache});
      }
    }
  );

  // Stratégie cache-first pour CSS, JS
  workbox.routing.registerRoute(
    ({request}) =>
      request.destination === 'script' ||
      request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Par défaut : répondre via le cache si offline
  workbox.routing.setCatchHandler(async ({event}) => {
    if (event.request.destination === 'document') {
      return caches.match('offline.html', {cacheName: workbox.core.cacheNames.precache});
    }
    return Response.error();
  });
} else {
  console.error('Workbox non chargé');
}
