module.exports = {
  // Dossier racine où Workbox va chercher les fichiers à precacher
  globDirectory: 'build/',

  // Types de fichiers à inclure dans le precache (html, js, css, images, ico, json)
  globPatterns: [
    '**/*.{html,js,css,png,svg,jpg,ico,json}'
  ],

  // Emplacement où sera écrit le service worker généré
  swDest: 'build/service-worker.js',

  // Permet au nouveau SW de prendre le contrôle immédiatement de tous les clients ouverts
  clientsClaim: true,

  // Force le SW à activer sans attendre la fermeture des pages
  skipWaiting: true,

  // Nettoyage des anciens caches obsolètes
  cleanupOutdatedCaches: true,

  // Repli SPA pour le routage côté client en mode hors ligne
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
};
