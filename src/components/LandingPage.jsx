import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { toast } from 'sonner';
import { QrCode, ArrowRight, Smartphone, RefreshCw, Check } from 'lucide-react';
const ShareAppModal = React.lazy(() => import('./ShareAppModal'));
import IosInstallPopup from './IosInstallPopup';
import { useViewMode } from '../contexts/ViewModeContext';

export default function LandingPage() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();
  const { viewMode } = useViewMode();

  const [showIosPopup, setShowIosPopup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle' | 'checking' | 'up-to-date' | 'downloading'

  const isManualVisit = location.search.includes('manual') || location.state?.fromMenu;

  // Redirection automatique seulement lors du premier lancement de l'application autonome
  useEffect(() => {
    if (isManualVisit) return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator?.standalone ||
      document.referrer?.includes('android-app://');

    if (isStandalone) {
      navigate('/app', { replace: true });
    }
  }, [isManualVisit, navigate]);

  // Écoute de prise de contrôle par un nouveau Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        setUpdateStatus('downloading');
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
    setUpdateStatus('checking');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast.info("Aucun Service Worker actif. L'application utilise la version en ligne.");
        setUpdateStatus('idle');
        return;
      }
      await reg.update();
      if (reg.installing || reg.waiting) {
        setUpdateStatus('downloading');
        toast.info("Une mise à jour est en cours de téléchargement...");
      } else {
        setUpdateStatus('up-to-date');
        toast.success("Votre application est déjà à jour (dernière version installée).");
      }
    } catch (err) {
      console.error("Erreur vérification mise à jour :", err);
      toast.error("Impossible de vérifier les mises à jour hors connexion.");
      setUpdateStatus('idle');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-4 sm:px-6 py-12 transition-colors duration-300">
      <div className="mb-4 max-w-full">
        <img
          src={`${process.env.PUBLIC_URL}/icons/icon-192x192.png`}
          alt="Logo GentBar"
          className="w-24 h-24 mx-auto mb-4 drop-shadow-[0_4px_16px_rgba(225,29,72,0.4)]"
        />
        {/* Titre strict sur une seule ligne */}
        <h1 className="text-2xl xs:text-[26px] sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight whitespace-nowrap flex items-center justify-center">
          <span className="mr-2">🍹</span>
          <span>GentBar Order App</span>
        </h1>
      </div>

      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        Gérez facilement vos commandes de boissons, consultez votre historique
        et profitez d&apos;une expérience fluide, même hors connexion.
      </p>

      {/* 3. ACTIONS PRINCIPALES (Call To Action Stack) - Fidèle à Stitch */}
      <section className="w-full flex flex-col gap-3 my-2 max-w-sm mx-auto">
        {/* 1. CTA Principal : Accéder à l'application */}
        <button
          type="button"
          onClick={() => navigate('/app')}
          style={{ borderRadius: '9999px' }}
          className="w-full h-14 !rounded-full bg-gradient-to-r from-[#e11d48] to-[#ff4897] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(225,29,72,0.45)] hover:brightness-110 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          <span>Accéder à l&apos;application</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* 2. CTA Secondaire : Installer la PWA (bords arrondis capsule garantis) */}
        {!isInstalled ? (
          <button
            type="button"
            onClick={handleInstallClick}
            aria-label="Installer l'application GentBar"
            style={{ borderRadius: '9999px' }}
            className="w-full h-12 !rounded-full bg-card border border-slate-700/60 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#ff4897]" />
            <span>Installer l&apos;App (PWA)</span>
          </button>
        ) : (
          <div
            style={{ borderRadius: '9999px' }}
            className="w-full h-12 !rounded-full bg-card/60 border border-emerald-500/30 text-emerald-400 font-medium text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Application déjà installée</span>
          </div>
        )}

        <IosInstallPopup open={showIosPopup} onClose={() => setShowIosPopup(false)} />

        {/* 3. CTA Tertiaire : Partager l'application */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          aria-label="Partager l'application"
          style={{ borderRadius: '9999px' }}
          className="w-full h-11 !rounded-full bg-card/50 border border-slate-700/40 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:text-white hover:bg-card transition-colors active:scale-[0.98] cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-slate-400" />
          <span>Partager l&apos;application</span>
        </button>

        {/* 4. Quatrième action : Statut / Vérifier les mises à jour */}
        <button
          type="button"
          onClick={handleCheckUpdate}
          disabled={updateStatus === 'checking'}
          style={{ borderRadius: '9999px' }}
          className={`w-full h-11 !rounded-full border text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98] cursor-pointer ${
            updateStatus === 'up-to-date'
              ? 'bg-card/40 border-emerald-500/40 text-emerald-400'
              : 'bg-card/30 border-slate-700/40 text-slate-300 hover:text-white hover:bg-card'
          }`}
        >
          <RefreshCw className={`w-4 h-4 text-[#ff4897] ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
          <span>
            {updateStatus === 'checking'
              ? 'Vérification...'
              : updateStatus === 'up-to-date'
              ? '✓ Votre application est à jour'
              : updateStatus === 'downloading'
              ? 'Mise à jour en cours...'
              : 'Vérifier les mises à jour'}
          </span>
        </button>
      </section>

      {!isInstalled && !isInstallable && (
        <p className="text-muted-foreground text-xs mt-6 max-w-sm">
          💡 Astuce : Vous pouvez aussi installer cette application depuis le
          menu de votre navigateur (⋮ ou Partager puis « Ajouter à l&apos;écran d&apos;accueil »).
        </p>
      )}

      <footer className="mt-8 text-xs text-muted-foreground">
        Mode d&apos;affichage actuel : <strong>{viewMode}</strong>
      </footer>
      {showShareModal && (
        <React.Suspense fallback={null}>
          <ShareAppModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        </React.Suspense>
      )}
    </main>
  );
}
