import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";      // Tailwind + base CSS
import "./App.css";        // Variables/theme + classes personnalisées
import App from "./App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { requestPersistentStorage } from './lib/storage';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Demande de persistance du stockage local (A-27)
requestPersistentStorage();

if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('✅ PWA prête à l\'usage'),
    onUpdate: () => console.log('🔄 Nouvelle version disponible !')
  });
} else {
  console.log("ℹ️ Service Worker non enregistré en mode développement.");
}
