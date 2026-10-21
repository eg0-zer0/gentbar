import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { PWAProvider } from "./contexts/PWAContext";

import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/LandingPage";
import DrinkOrderApp from "./components/DrinkOrderApp";
import NotFoundPage from "./components/NotFoundPage";
import { Toaster } from "./components/ui/sonner";

import "./index.css";
import "./App.css";

// Chargement à la demande des écrans secondaires de gestion et réception de cartes
const MyBarsScreen = React.lazy(() => import("./components/MyBarsScreen"));
const ReceiveBarPage = React.lazy(() => import("./components/ReceiveBarPage"));

/**
 * Écran d'attente sobre lors du premier chargement d'un écran secondaire.
 */
const PageFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
        <span className="text-xl">🍹</span>
      </div>
      <p className="text-xs font-medium tracking-wide">Chargement…</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ViewModeProvider>
          <PWAProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<DrinkOrderApp />} />
                <Route
                  path="/bars"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <MyBarsScreen />
                    </Suspense>
                  }
                />
                <Route
                  path="/recevoir"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <ReceiveBarPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </PWAProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
