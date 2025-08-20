import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ThemeProvider } from "./contexts/ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// ✅ Enregistrer le service worker uniquement en production
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: (registration) => {
      console.log('✅ PWA: Prête pour utilisation hors-ligne', registration);
    },
    onUpdate: (registration) => {
      console.log('🔄 PWA: Nouvelle version disponible', registration);
      // 👉 Ici, tu pourrais proposer automatiquement à l'utilisateur de recharger
      // window.location.reload();
    }
  });
} else {
  console.log("ℹ️ Service Worker non enregistré en mode développement.");
}
