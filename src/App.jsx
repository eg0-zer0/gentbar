import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";

import ErrorBoundary from "./components/ErrorBoundary";
import InstallBanner from "./components/InstallBanner";
import LandingPage from "./components/LandingPage";
import DrinkOrderApp from "./components/DrinkOrderApp";

import "./index.css";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ViewModeProvider>
          <BrowserRouter>
            <InstallBanner />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<DrinkOrderApp />} />
            </Routes>
          </BrowserRouter>
        </ViewModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
