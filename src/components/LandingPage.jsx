import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { register } from '../serviceWorkerRegistration';
import IosInstallPopup from './IosInstallPopup';

import { useTheme } from '../contexts/ThemeContext';
import { useViewMode } from '../contexts/ViewModeContext';

export default function LandingPage() {
  const { isInstallable, installApp } = usePWA();
  const navigate = useNavigate();

  const { theme } = useTheme();
  const { viewMode } = useViewMode();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [waitingSW, setWaitingSW] = useState(null);
  const [showIosPopup, setShowIosPopup] = useState(false);

  useEffect(() => {
    register({
      onUpdate: (registration) => {
        setWaitingSW(registration.waiting);
        setUpdateAvailable(true);
        setUpToDate(false);
      },
      onSuccess: () => {
        setUpdateAvailable(false);
        setUpToDate(true);
        setTimeout(() => setUpToDate(false), 4000);
      }
    });
  }, []);

  const reloadApp = () => {
    if (waitingSW) {
      waitingSW.postMessage({ type: 'SKIP_WAITING' });
      waitingSW.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          window.location.reload();
        }
      });
    }
  };

  // Détecter iOS
  const isIOS = () =>
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.navigator.standalone;

  const handleInstallClick = () => {
    if (isIOS()) {
      setShowIosPopup(true);
    } else {
      installApp && installApp();
    }
  };

  // Classes globales via variables CSS pour thème
  const commonBase = "transition-colors duration-300";

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-6 py-12 ${commonBase}`}>
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <Button
          onClick={handleInstallClick}
          aria-label="Installer l'application Drink Order"
          className="btn-outline"
        >
          Installer l&apos;App
        </Button>
        <IosInstallPopup open={showIosPopup} onClose={() => setShowIosPopup(false)} />
        <Button
          className="btn-outline"
          onClick={() => navigate('/app')}
        >
          Accéder à l&apos;application
        </Button>
        <Button
          className="btn-outline"
          onClick={() => navigate('/app')}
        >
          Vérifier les mises à jour
        </Button>
      </div>
      <div className="mt-6 min-h-[2rem]">
        {updateAvailable && (
          <div className="inline-flex items-center gap-3 rounded px-3 py-1 bg-warning text-warning-text">
            <span>Nouvelle version disponible</span>
            <Button size="sm" className="bg-warning-accent text-button-text px-3 py-1" onClick={reloadApp}>
              Mettre à jour
            </Button>
          </div>
        )}
        {!updateAvailable && upToDate && (
          <div className="inline-block rounded px-3 py-1 bg-success text-success-text">
            ✅ Application à jour — dernière version
          </div>
        )}
      </div>
      {!isInstallable && (
        <p className="text-muted-text text-sm mt-6 max-w-sm">
          💡 Astuce : Vous pouvez aussi installer cette application depuis le
          menu de votre navigateur.
          Utilisez « Vérifier les mises à jour » pour vous assurer d&apos;avoir la dernière version.
        </p>
      )}
      <footer className="mt-8 text-xs text-muted-text">
        Mode d&apos;affichage actuel : <strong>{viewMode}</strong>
      </footer>
    </main>
  );
}
