import React, { useState } from 'react';

import { usePWA } from '../hooks/usePWA';

import { Download, Menu, Volume2, VolumeX, Layout, History, Sun, Moon, Home, FolderPlus } from 'lucide-react';

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

const Header = ({ 
  soundEnabled, 
  onToggleSound, 
  onShowHistory, 
  onAddCategory,
  activeBarName = 'Club de hockey',
  activeBarIcon = '🏒'
}) => {
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
    <header className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3 bg-background text-foreground border-b border-border/40 shadow-xs rounded-lg mb-2">
      {/* Marque et bar actif */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="font-bold text-base sm:text-lg tracking-tight select-none flex items-center gap-1.5 text-foreground shrink-0">
          <span className="text-xl" role="img" aria-label="Cocktail">🍹</span> GentBar
        </span>
        {/* Pilule du bar actif (préparation multi-bars A-29) */}
        <div 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/80 text-foreground border border-border/60 max-w-[170px] sm:max-w-[260px] truncate select-none shadow-xs"
          title={`Carte active : ${activeBarName}`}
        >
          <span className="text-sm shrink-0" role="img" aria-label="Icône du bar">{activeBarIcon}</span>
          <span className="truncate">{activeBarName}</span>
        </div>
      </div>

      {/* Burger menu à droite */}
      <div className="shrink-0">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir menu" className="h-9 w-9">
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 dropdown-menu-content" align="end">
            <DropdownMenuItem className="dropdown-menu-item" onClick={() => { navigate('/?manual=true', { state: { fromMenu: true } }); setMenuOpen(false); }}>
              <Home className="mr-2 w-4 h-4 text-foreground" />
              Accueil
            </DropdownMenuItem>
            {onAddCategory && (
              <DropdownMenuItem className="dropdown-menu-item" onClick={() => { onAddCategory(); setMenuOpen(false); }}>
                <FolderPlus className="mr-2 w-4 h-4 text-foreground" />
                Ajouter une catégorie
              </DropdownMenuItem>
            )}
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
