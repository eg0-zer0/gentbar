import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode doit être utilisé dans ViewModeProvider');
  return context;
};

const validViewModes = ['large', 'compact', 'minimal'];

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('viewMode');
    return validViewModes.includes(saved) ? saved : 'large';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);

    // Met à jour la classe CSS sur <html>
    document.documentElement.classList.remove(...validViewModes);
    document.documentElement.classList.add(viewMode);
  }, [viewMode]);

  const cycleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'large') return 'compact';
      if (prev === 'compact') return 'minimal';
      return 'large';
    });
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, cycleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
