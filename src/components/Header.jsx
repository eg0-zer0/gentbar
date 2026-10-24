import React, { useState } from 'react';

import { usePWA } from '../hooks/usePWA';

import { Download, Menu, Volume2, VolumeX, Layout, History, Sun, Moon, Beer, Clover, Home, Store, ChevronDown, QrCode } from 'lucide-react';

import { Button } from './ui/button';

import { useTheme, THEME_MODES } from '../contexts/ThemeContext';

import { useViewMode } from '../contexts/ViewModeContext';

import { useNavigate } from 'react-router-dom';
const ShareAppModal = React.lazy(() => import('./ShareAppModal'));

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

const THEME_LABELS = {
  light: 'Clair',
  gentbar: 'GentBar',
  green: 'Green',
  dark: 'Sombre',
};

const Header = ({ 
  soundEnabled, 
  onToggleSound, 
  onShowHistory, 
  activeBarName = 'Club de hockey',
  activeBarIcon = '🏒',
  barsCount = 2,
  onOpenBarSelector
}) => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { theme, cycleTheme } = useTheme();
  const { viewMode, cycleViewMode } = useViewMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Liste des thèmes dans l'ordre : 1. Clair -> 2. GentBar -> 3. Green -> 4. Sombre
  const themeModes = THEME_MODES;
  const currentThemeIndex = themeModes.indexOf(theme);
  const nextThemeIndex = (currentThemeIndex + 1) % themeModes.length;
  const nextTheme = themeModes[nextThemeIndex];

  const viewModes = ['large', 'compact', 'minimal'];
  const currentViewIndex = viewModes.indexOf(viewMode);
  const nextViewIndex = (currentViewIndex + 1) % viewModes.length;
  const nextView = viewModes[nextViewIndex];

  const itemClassName = "flex items-center space-x-3 px-4 py-2.5 text-xs font-medium tracking-tight text-popover-foreground rounded-none cursor-pointer hover:bg-secondary hover:text-card-foreground focus:bg-secondary focus:text-card-foreground transition-colors outline-none group select-none";
  const iconClassName = "w-4 h-4 text-muted-foreground stroke-2 group-hover:text-card-foreground group-focus:text-card-foreground shrink-0";

  const renderNextThemeIcon = () => {
    switch (nextTheme) {
      case 'light':
        return <Sun className={iconClassName} aria-label="Thème Clair" />;
      case 'gentbar':
        return <Beer className={iconClassName} aria-label="Thème GentBar" />;
      case 'green':
        return <Clover className={iconClassName} aria-label="Thème Green" />;
      case 'dark':
        return <Moon className={iconClassName} aria-label="Thème Sombre" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between text-foreground">
      {/* Marque et bar actif */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="font-bold text-base sm:text-lg tracking-tight select-none flex items-center gap-1.5 text-foreground shrink-0">
          <span className="text-xl" role="img" aria-label="Cocktail">🍹</span> GentBar
        </span>
        {/* Bouton du bar actif (§ 4.2 : cliquable dès qu'il y a au moins 2 bars) */}
        {barsCount >= 2 && onOpenBarSelector ? (
          <button
            type="button"
            onClick={onOpenBarSelector}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/80 hover:bg-muted text-foreground border border-border/60 max-w-[185px] sm:max-w-[270px] truncate transition-colors shadow-xs cursor-pointer"
            title={`Carte active : ${activeBarName} — toucher pour changer de bar`}
            aria-label={`Carte active : ${activeBarName}. Changer de bar`}
          >
            <span className="text-sm shrink-0" role="img" aria-label="Icône du bar">{activeBarIcon}</span>
            <span className="truncate">{activeBarName}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-75" />
          </button>
        ) : (
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/80 text-foreground border border-border/60 max-w-[170px] sm:max-w-[260px] truncate select-none shadow-xs"
            title={`Carte active : ${activeBarName}`}
          >
            <span className="text-sm shrink-0" role="img" aria-label="Icône du bar">{activeBarIcon}</span>
            <span className="truncate">{activeBarName}</span>
          </div>
        )}
      </div>

      {/* Burger menu à droite */}
      <div className="shrink-0">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu principal"
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors focus:outline-none cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[220px] bg-popover border border-border rounded-2xl shadow-2xl p-0 overflow-hidden text-popover-foreground z-50 divide-y divide-border/40"
            align="end"
            sideOffset={6}
            alignOffset={0}
          >
            {/* Groupe 1: Navigation Principale */}
            <div className="py-1">
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { navigate('/?manual=true', { state: { fromMenu: true } }); setMenuOpen(false); }}
              >
                <Home className={iconClassName} />
                <span>Accueil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { navigate('/bars'); setMenuOpen(false); }}
              >
                <Store className={iconClassName} />
                <span>Mes bars</span>
              </DropdownMenuItem>
            </div>

            {/* Groupe 2: Affichage & Vue */}
            <div className="py-1">
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { cycleTheme(); setMenuOpen(false); }}
              >
                {renderNextThemeIcon()}
                <span>
                  Thème : {THEME_LABELS[nextTheme] || 'Clair'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { cycleViewMode(); setMenuOpen(false); }}
              >
                <Layout className={iconClassName} />
                <span>Mode vue : {nextView}</span>
              </DropdownMenuItem>
            </div>

            {/* Groupe 3: Audio & Historique */}
            <div className="py-1">
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { onToggleSound(); setMenuOpen(false); }}
              >
                {soundEnabled ? (
                  <Volume2 className={iconClassName} />
                ) : (
                  <VolumeX className={iconClassName} />
                )}
                <span>{soundEnabled ? 'Désactiver son' : 'Activer son'}</span>
              </DropdownMenuItem>
              {isInstallable && !isInstalled && (
                <DropdownMenuItem
                  className={itemClassName}
                  onClick={() => { installApp(); setMenuOpen(false); }}
                >
                  <Download className={iconClassName} />
                  <span>Installer l'app</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { onShowHistory(); setMenuOpen(false); }}
              >
                <History className={iconClassName} />
                <span>Historique</span>
              </DropdownMenuItem>
            </div>

            {/* Groupe 4: Partage */}
            <div className="py-1">
              <DropdownMenuItem
                className={itemClassName}
                onClick={() => { setShowShareModal(true); setMenuOpen(false); }}
              >
                <QrCode className={iconClassName} />
                <span>Partager l'application</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showShareModal && (
        <React.Suspense fallback={null}>
          <ShareAppModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default Header;
