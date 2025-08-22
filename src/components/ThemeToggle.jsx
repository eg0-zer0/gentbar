import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, cycleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="rounded-full w-9 h-9 p-0"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4 text-gray-600" />
      )}
      <span className="sr-only">{isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}</span>
    </Button>
  );
};

export default ThemeToggle;
