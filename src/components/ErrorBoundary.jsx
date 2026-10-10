import React from 'react';
import { removeKeys, APP_DATA_KEYS } from '../lib/storage';

// Filet de sécurité global (A-08) : toute erreur de rendu affiche cet écran
// au lieu d'une page blanche. Volontairement sans dépendance aux composants UI
// (qui pourraient eux-mêmes être la cause de l'erreur).
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    const ok = window.confirm(
      "Réinitialiser les données ?\n\nLe panier, l'historique des commandes et vos modifications de la carte seront effacés. Cette action est irréversible."
    );
    if (!ok) return;
    removeKeys(APP_DATA_KEYS);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground"
      >
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-muted-text">
            L'application a rencontré un problème inattendu. Rechargez la page ; si le problème
            persiste, réinitialisez les données.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full !h-auto py-2.5 px-4 rounded font-medium text-sm flex items-center justify-center"
              onClick={this.handleReload}
            >
              Recharger
            </button>
            <button
              type="button"
              className="btn-outline w-full !h-auto py-2.5 px-4 rounded font-medium text-sm flex items-center justify-center"
              onClick={this.handleReset}
            >
              Réinitialiser les données
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
