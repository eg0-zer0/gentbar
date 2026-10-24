import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Ordre officiel de rotation des thèmes :
// 1. Clair => light theme ('light')
// 2. GentBar => GentBar ('gentbar')
// 3. Green => Green Turf ('green')
// 4. Sombre => Dark Theme ('dark')
export const THEME_MODES = ['light', 'gentbar', 'green', 'dark'];

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme-preference');
    return THEME_MODES.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);

    document.documentElement.classList.remove(
      'light',
      'gentbar',
      'green',
      'dark',
      'gentbar-light',
      'gentbar-green',
      'gentbar-dark'
    );
    document.documentElement.classList.add(theme);
    if (theme !== 'gentbar') {
      document.documentElement.classList.add(`gentbar-${theme}`);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      const currentIndex = THEME_MODES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEME_MODES.length;
      return THEME_MODES[nextIndex];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
