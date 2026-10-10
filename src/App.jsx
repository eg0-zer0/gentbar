import React from "react";
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
