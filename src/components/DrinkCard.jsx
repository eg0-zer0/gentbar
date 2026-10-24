import React, { useState, useEffect, useRef } from 'react';
import { Pencil, TrendingUp } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { useViewMode } from '../contexts/ViewModeContext';

let sharedAudioCtx = null;

const getSharedAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playBeep = () => {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // L'échec audio ne doit jamais bloquer l'ajout au panier
  }
};

const DrinkCard = ({
  drink,
  onAdd,
  onEdit,
  popularityScore = 0,
  quantityInOrder = 0,
  soundEnabled = true,
  categoryName,
  categoryIcon
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { viewMode = 'large' } = useViewMode() || {};
  const cardRef = useRef(null);

  const isMinimal = viewMode === 'minimal';
  const isCompact = viewMode === 'compact';

  const handleClick = () => {
    setIsAdded(true);
    if (onAdd) onAdd(drink);
    if (soundEnabled) playBeep();
  };

  // Niveau de popularité
  const getPopularityLevel = (score) => {
    if (score >= 20) return { label: 'TOP', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (score >= 10) return { label: 'HOT', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (score >= 5) return { label: 'POP', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return null;
  };
  const popularity = getPopularityLevel(popularityScore);

  useEffect(() => {
    let timer;
    if (isAdded) timer = setTimeout(() => setIsAdded(false), 600);
    return () => clearTimeout(timer);
  }, [isAdded]);

  useEffect(() => {
    let timer;
    if (quantityInOrder > 0) {
      setPulse(true);
      timer = setTimeout(() => setPulse(false), 500);
    }
    return () => clearTimeout(timer);
  }, [quantityInOrder]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Tailles proportionnées selon le mode de vue
  const pencilIconSize = isMinimal ? 11 : isCompact ? 12 : 13;
  const editButtonClasses = isMinimal
    ? 'w-6 h-6 rounded-md bg-secondary/80 hover:bg-secondary text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-auto'
    : isCompact
    ? 'w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg bg-secondary/80 hover:bg-secondary text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0'
    : 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary/80 hover:bg-secondary text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0';

  const badgeSizeClasses = isMinimal
    ? 'min-w-[20px] h-5 px-1 text-[10px]'
    : isCompact
    ? 'min-w-[22px] h-5.5 px-1.5 text-[11px]'
    : 'min-w-[24px] h-6 px-1.5 text-xs';

  return (
    <div
      ref={cardRef}
      className={`drink-card group relative rounded-xl bg-card border border-slate-700/50 p-2.5 sm:p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-600 transition-all cursor-pointer select-none active:scale-[0.98] ${
        isAdded ? 'ring-2 ring-[#ff4897]' : ''
      } ${pulse ? 'animate-pulse' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ajouter ${drink.name} à la commande`}
    >
      {/* Badge quantité en haut à droite (Stitch : rond magenta vibrant) */}
      {quantityInOrder > 0 && (
        <div className={`absolute -top-1.5 -right-1.5 ${badgeSizeClasses} rounded-full bg-[#ff4897] text-white font-bold flex items-center justify-center shadow-lg ring-2 ring-[#06122c] z-10`}>
          {quantityInOrder}
        </div>
      )}

      {/* Partie haute : Nom de la boisson (+ badge popularité ou catégorie en recherche) */}
      <div className="min-w-0 pr-1 text-left">
        {!isMinimal && popularity && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border mb-1 ${popularity.className}`}>
            {popularity.label}
            <TrendingUp size={11} />
          </span>
        )}
        {categoryName && (
          <span className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1 truncate">
            {categoryIcon && <span>{categoryIcon}</span>}
            <span className="truncate">{categoryName}</span>
          </span>
        )}
        <p className={`drink-name leading-tight text-white text-left ${
          isMinimal
            ? 'text-xs font-medium line-clamp-3'
            : isCompact
            ? 'text-xs sm:text-sm font-semibold line-clamp-2'
            : 'text-sm sm:text-base font-semibold line-clamp-2'
        }`}>
          {drink.name}
        </p>
      </div>

      {/* Partie basse : Prix (masqué en vue minimal) + Bouton modifier (icône Pencil Stitch) */}
      <div className={`flex items-end ${isMinimal ? 'justify-end pt-1' : 'justify-between mt-auto pt-2'}`}>
        {!isMinimal && (
          <span className="drink-price font-bold text-xs sm:text-base text-[#f59e0b] tracking-tight">
            {formatPrice(drink.price)}
          </span>
        )}
        <button
          type="button"
          aria-label={`Modifier ${drink.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(drink, 'edit');
          }}
          className={editButtonClasses}
        >
          <Pencil size={pencilIconSize} className="stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
};

export default DrinkCard;
