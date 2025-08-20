// src/serviceWorkerRegistration.js

// Vérification si on est en localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Enregistre le Service Worker avec options de gestion des mises à jour
 * @param {Object} config - { onUpdate(registration), onSuccess(registration) }
 */
export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Origin différent, pas d'enregistrement SW
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // Mode développement : vérification précise
        checkValidServiceWorker(swUrl, config);
      } else {
        // Production : enregistrement direct
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Enregistre un SW valide et gère les mises à jour
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ Service Worker enregistré :', registration);

      // Écoute les messages du service worker (ex: SKIP_WAITING)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });

      if (registration.waiting && config?.onUpdate) {
        config.onUpdate(registration);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nouvelle version dispo
              console.log('🔄 Nouvelle version disponible');
              config?.onUpdate && config.onUpdate(registration);
            } else {
              // Première installation
              console.log('📦 Contenu mis en cache pour utilisation offline');
              config?.onSuccess && config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('❌ Échec enregistrement Service Worker :', error);
    });
}

/**
 * Vérifie si un SW est valide (utile en localhost)
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf('javascript') === -1)
      ) {
        // SW introuvable ou non javascript => suppression + reload
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // SW valide, on le registre
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('📴 Pas de connexion internet — utilisation version offline');
    });
}

/**
 * Désenregistre le Service Worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => {
        console.error(error.message);
      });
  }
}
