import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { register } from '../serviceWorkerRegistration';

export default function LandingPage() {
  const { isInstallable, installApp } = usePWA();
  const navigate = useNavigate();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [waitingSW, setWaitingSW] = useState(null);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center px-6">
      <div className="mb-6">
        <img
          src={`${process.env.PUBLIC_URL}/icons/icon-192x192.png`}
          alt="Logo Drink Order"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          🍹 Drink Order
        </h1>
      </div>

      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mb-10">
        Gérez facilement vos commandes de boissons, consultez votre historique
        et profitez d'une expérience fluide, même hors connexion.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        {isInstallable && (
          <Button
            onClick={installApp}
            aria-label="Installer l'application Drink Order"
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-3"
          >
            Installer l’App
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => navigate('/app')}
          className="text-lg px-6 py-3"
        >
          Accéder à l’application
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/app')}
          className="text-lg px-6 py-3"
        >
          Vérifier les mises à jour
        </Button>
      </div>

      <div className="mt-6 min-h-[2rem]">
        {updateAvailable && (
          <div className="inline-flex items-center gap-3 bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 rounded px-3 py-1">
            <span>Nouvelle version disponible</span>
            <Button size="sm" className="bg-yellow-500 text-white px-3 py-1" onClick={reloadApp}>
              Mettre à jour
            </Button>
          </div>
        )}
        {!updateAvailable && upToDate && (
          <div className="inline-block bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100 rounded px-3 py-1">
            ✅ Application à jour — dernière version
          </div>
        )}
      </div>

      {!isInstallable && (
        <p className="text-sm text-gray-500 mt-6 max-w-sm">
          💡 Astuce : Vous pouvez aussi installer cette application depuis le
          menu de votre navigateur.
          Utilisez « Vérifier les mises à jour » pour vous assurer d'avoir la dernière version.
        </p>
      )}
    </div>
  );
}
