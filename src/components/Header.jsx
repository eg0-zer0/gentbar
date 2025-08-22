import React, { useState } from 'react';

import { usePWA } from '../hooks/usePWA';

import { Download, Menu, Volume2, VolumeX, Layout, History, Sun, Moon, Home } from 'lucide-react';

import { Button } from './ui/button';

import { useTheme } from '../contexts/ThemeContext';

import { useViewMode } from '../contexts/ViewModeContext';

import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';

const Header = ({ soundEnabled, onToggleSound, onShowHistory }) => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { theme, cycleTheme } = useTheme();
  const { viewMode, cycleViewMode } = useViewMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Liste des thèmes et modes utilisés dans cycle
  const themeModes = ['light', 'dark', 'gentbar'];
  const currentThemeIndex = themeModes.indexOf(theme);
  const nextThemeIndex = (currentThemeIndex + 1) % themeModes.length;
  const nextTheme = themeModes[nextThemeIndex];

  const viewModes = ['large', 'compact', 'minimal'];
  const currentViewIndex = viewModes.indexOf(viewMode);
  const nextViewIndex = (currentViewIndex + 1) % viewModes.length;
  const nextView = viewModes[nextViewIndex];

  const renderNextThemeIcon = () => {
    switch (nextTheme) {
      case 'light':
        return <Sun className="w-5 h-5" aria-label="Mode clair" />;
      case 'dark':
        return <Moon className="w-5 h-5" aria-label="Mode sombre" />;
      case 'gentbar':
        return <Layout className="w-5 h-5" aria-label="Mode Gentbar" />;
      default:
        return null;
    }
  };

  return (
    <header className="flex items-center p-4 bg-background text-foreground shadow-sm">
      {/* Bloc vide à gauche pour équilibrer */}
      <div style={{ width: '2.25rem' }} />

      {/* Titre centré */}
      <h1 className="flex-grow text-center text-xl font-bold select-none">
        Gérez facilement vos commandes de boissons
      </h1>

      {/* Burger menu à droite */}
      <div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir menu">
              <Menu className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 dropdown-menu-content" align="end">
          <DropdownMenuItem className="dropdown-menu-item" onClick={() => { navigate('/'); setMenuOpen(false); }}>
    <Home className="mr-2 w-4 h-4 text-foreground" />
    Accueil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { cycleTheme(); setMenuOpen(false); }}>
              {renderNextThemeIcon()}
              <span className="ml-2">
                Mode {nextTheme === 'gentbar' ? 'Gentbar' : nextTheme === 'light' ? 'clair' : 'sombre'}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { cycleViewMode(); setMenuOpen(false); }}>
              <Layout className="mr-2 w-4 h-4" />
              Mode vue : {nextView}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { onToggleSound(); setMenuOpen(false); }}>
              {soundEnabled ? <Volume2 className="mr-2 w-4 h-4" /> : <VolumeX className="mr-2 w-4 h-4" />}
              {soundEnabled ? 'Désactiver son' : 'Activer son'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isInstallable && !isInstalled && (
              <DropdownMenuItem onClick={() => { installApp(); setMenuOpen(false); }}>
                <Download className="mr-2 w-4 h-4" />
                Installer l'app
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => { onShowHistory(); setMenuOpen(false); }}>
              <History className="mr-2 w-4 h-4" />
              Historique
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
