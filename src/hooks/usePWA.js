import { usePWAContext } from '../contexts/PWAContext';

/**
 * Hook pour accéder à l'état PWA et déclencher l'installation (A-30).
 * Partage l'écouteur unique beforeinstallprompt fourni par PWAProvider.
 */
export const usePWA = () => {
  return usePWAContext();
};

export default usePWA;
