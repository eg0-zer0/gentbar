import React from 'react';

const IosInstallPopup = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <>
      {/* Overlay d'arrière-plan */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modale centrée, scrollable, stylée avec ta palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="fixed top-[10vh] left-1/2 transform -translate-x-1/2 z-50 bg-card text-foreground shadow-lg rounded-xl px-4 py-6 max-w-sm w-[92vw] min-w-[320px] max-h-[72vh] overflow-y-auto"
        style={{
          backgroundColor: "rgb(var(--card-background-rgb))",
          color: "rgb(var(--foreground-rgb))",
          boxShadow: "0 8px 16px rgb(var(--shadow-color-rgb), 0.14)"
        }}
      >
        <h2
          id="ios-install-title"
          className="text-base font-semibold mb-4"
          style={{
            color: "rgb(var(--foreground-rgb))"
          }}
        >
          Pour installer cette application sur votre iPhone/iPad&nbsp;:
        </h2>

        <ol className="list-decimal list-inside space-y-3 text-base leading-relaxed">
          <li>
            <strong>Ouvrez Safari</strong> et assurez-vous d’afficher cette page.
          </li>
          <li>
            En bas de l’écran, appuyez sur l’icône <strong>Partager</strong>{' '}
            <span role="img" aria-label="partager">🟦⬆️</span> (carré avec une flèche vers le haut).
          </li>
          <li>
            Faites défiler et sélectionnez <strong>« Sur l’écran d’accueil »</strong>.
          </li>
          <li>
            Modifiez le nom si vous le souhaitez.
          </li>
          <li>
            <strong>Appuyez sur « Ajouter »</strong> en haut à droite.
          </li>
        </ol>

        <p className="mt-4 text-muted-text text-sm" style={{
          color: "rgb(var(--muted-text-rgb))"
        }}>
          L’application apparaîtra alors sur l’écran d’accueil de votre appareil, comme une véritable application mobile&nbsp;!
        </p>

        <button
          onClick={onClose}
          className="btn-primary mt-5 px-4 py-2"
        >
          Fermer
        </button>
      </div>
    </>
  );
};

export default IosInstallPopup;
