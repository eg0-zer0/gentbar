import React, { useState } from 'react';

import { usePWA } from '../hooks/usePWA';

import { Download, Menu, Volume2, VolumeX, Layout, History, Sun, Moon, Home, Store, ChevronDown, QrCode } from 'lucide-react';

import { Button } from './ui/button';

import { useTheme } from '../contexts/ThemeContext';

import { useViewMode } from '../contexts/ViewModeContext';

import { useNavigate } from 'react-router-dom';
const ShareAppModal = React.lazy(() => import('./ShareAppModal'));

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

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

  // Liste des thèmes et modes utilisés dans cycle
  const themeModes = ['light', 'dark', 'gentbar'];
  const currentThemeIndex = themeModes.indexOf(theme);
  const nextThemeIndex = (currentThemeIndex + 1) % themeModes.length;
  const nextTheme = themeModes[nextThemeIndex];

  const viewModes = ['large', 'compact', 'minimal'];
  const currentViewIndex = viewModes.indexOf(viewMode);
  const nextViewIndex = (currentViewIndex + 1) % viewModes.length;
  const nextView = viewModes[nextViewIndex];

  const itemClassName = "flex items-center space-x-3 px-4 py-2.5 text-xs font-medium tracking-tight text-slate-200 rounded-none cursor-pointer hover:bg-[#152549] hover:text-white focus:bg-[#152549] focus:text-white transition-colors outline-none group select-none";
  const iconClassName = "w-4 h-4 text-slate-300 stroke-2 group-hover:text-white group-focus:text-white shrink-0";

  const renderNextThemeIcon = () => {
    switch (nextTheme) {
      case 'light':
        return <Sun className={iconClassName} aria-label="Mode clair" />;
      case 'dark':
        return <Moon className={iconClassName} aria-label="Mode sombre" />;
      case 'gentbar':
        return <Layout className={iconClassName} aria-label="Mode Gentbar" />;
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
              className="h-9 w-9 p-0 rounded-lg text-slate-300 hover:text-white hover:bg-[#0e1b35] transition-colors focus:outline-none cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[220px] bg-[#0e1b35] border border-[#23355b] rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7),0_0_0_1px_#23355b] p-0 overflow-hidden text-slate-200 z-50 divide-y divide-white/[0.06]"
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
                  Mode {nextTheme === 'gentbar' ? 'Gentbar' : nextTheme === 'light' ? 'clair' : 'sombre'}
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
