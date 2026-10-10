import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const PWAContext = createContext(null);

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator?.standalone ||
      document.referrer?.includes('android-app://')
    );
  });

  useEffect(() => {
    // Écoute de l'événement beforeinstallprompt émis par les navigateurs compatibles Chromium
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Écoute de la confirmation d'installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("Application installée avec succès !");
    };

    // Détection changement de mode d'affichage (ex: passage en standalone)
    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (isInstalled) {
      toast.info("L'application est déjà installée sur cet appareil.");
      return true;
    }

    if (!deferredPrompt) {
      // Navigateur ne supportant pas beforeinstallprompt (Firefox, Safari...) ou mode navigation privée
      toast.info(
        "Installation directe non disponible. Ouvrez le menu de votre navigateur (⋮ ou Partager) et choisissez « Ajouter à l'écran d'accueil ».",
        { duration: 6000 }
      );
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        toast.info("Installation reportée. Vous pouvez l'installer à tout moment.");
        return false;
      }
    } catch (err) {
      console.error("Erreur lors de l'installation PWA :", err);
      toast.error("Impossible de lancer l'installation.");
      return false;
    }
  }, [deferredPrompt, isInstalled]);

  const value = {
    isInstallable,
    isInstalled,
    installApp
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext doit être utilisé à l\'intérieur d\'un PWAProvider');
  }
  return context;
};

export default PWAContext;
