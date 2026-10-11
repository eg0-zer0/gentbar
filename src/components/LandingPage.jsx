import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { toast } from 'sonner';
import IosInstallPopup from './IosInstallPopup';
import { useViewMode } from '../contexts/ViewModeContext';

export default function LandingPage() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const navigate = useNavigate();
  const { viewMode } = useViewMode();

  const [showIosPopup, setShowIosPopup] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Redirection automatique si lancée en mode application autonome (standalone)
  useEffect(() => {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator?.standalone ||
      document.referrer?.includes('android-app://');

    if (isStandalone) {
      navigate('/app', { replace: true });
    }
  }, [navigate]);

  // Écoute de prise de contrôle par un nouveau Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        toast.info("Une nouvelle version est installée !", {
          action: {
            label: "Recharger",
            onClick: () => window.location.reload()
          }
        });
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  // Détecter iOS non installé
  const isIOS = () =>
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.navigator.standalone;

  const handleInstallClick = () => {
    if (isIOS()) {
      setShowIosPopup(true);
    } else {
      installApp();
    }
  };

  // Vrai comportement pour « Vérifier les mises à jour » (A-16)
  const handleCheckUpdate = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.info("Les mises à jour automatiques ne sont pas supportées par ce navigateur.");
      return;
    }
    setIsCheckingUpdate(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast.info("Aucun Service Worker actif. L'application utilise la version en ligne.");
        return;
      }
      await reg.update();
      if (reg.installing || reg.waiting) {
        toast.info("Une mise à jour est en cours de téléchargement...");
      } else {
        toast.success("Votre application est déjà à jour (dernière version installée).");
      }
    } catch (err) {
      console.error("Erreur vérification mise à jour :", err);
      toast.error("Impossible de vérifier les mises à jour hors connexion.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-6 py-12 transition-colors duration-300">
      <div className="mb-6">
        <img
          src={`${process.env.PUBLIC_URL}/icons/icon-192x192.png`}
          alt="Logo Drink Order"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-foreground">
          🍹 Gent Bar Order App
        </h1>
      </div>
      <p className="text-muted-text text-lg max-w-md mb-10">
        Gérez facilement vos commandes de boissons, consultez votre historique
        et profitez d&apos;une expérience fluide, même hors connexion.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
        {!isInstalled ? (
          <Button
            onClick={handleInstallClick}
            aria-label="Installer l'application Drink Order"
            className="btn-outline"
          >
            Installer l&apos;App
          </Button>
        ) : (
          <div className="inline-flex items-center text-xs text-muted-text py-2 px-3.5 rounded-md border border-border-color bg-card">
            ✓ Application déjà installée
          </div>
        )}

        <IosInstallPopup open={showIosPopup} onClose={() => setShowIosPopup(false)} />

        <Button
          className="btn-primary"
          onClick={() => navigate('/app')}
        >
          Accéder à l&apos;application
        </Button>

        <Button
          className="btn-outline"
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
        >
          {isCheckingUpdate ? 'Vérification...' : 'Vérifier les mises à jour'}
        </Button>
      </div>

      {!isInstalled && !isInstallable && (
        <p className="text-muted-text text-sm mt-6 max-w-sm">
          💡 Astuce : Vous pouvez aussi installer cette application depuis le
          menu de votre navigateur (⋮ ou Partager puis « Ajouter à l&apos;écran d&apos;accueil »).
        </p>
      )}

      <footer className="mt-8 text-xs text-muted-text">
        Mode d&apos;affichage actuel : <strong>{viewMode}</strong>
      </footer>
    </main>
  );
}
