import React, { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { useViewMode } from '../contexts/ViewModeContext';
import { Edit, Trash2, TrendingUp } from 'lucide-react';

const DrinkCard = ({
  drink,
  onAdd,
  onEdit,
  popularityScore = 0,
  quantityInOrder = 0,
  soundEnabled = true
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { viewMode } = useViewMode();
  const cardRef = useRef(null);
  const handleClick = () => {
    setIsAdded(true);
    if (soundEnabled) playBeep();
    if (onAdd) onAdd(drink);
  };

  // Niveau de popularité
  const getPopularityLevel = (score) => {
    if (score >= 20) return { label: 'TOP', className: 'badge-top' };
    if (score >= 10) return { label: 'HOT', className: 'badge-hot' };
    if (score >= 5) return { label: 'POP', className: 'badge-pop' };
    return null;
  };
  const popularity = getPopularityLevel(popularityScore);


  // Effet vert lors de l’ajout et badge quantité
  useEffect(() => {
    let timer;
    if (isAdded) timer = setTimeout(() => setIsAdded(false), 1000);
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

  const playBeep = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => ctx.close();
  };

  const addedHighlightClass = isAdded ? 'ring-2 ring-green-400' : '';
  const pulseClass = pulse ? 'animate-pulse' : '';
  const baseCardClass = 'drink-card rounded-md border border-border-color shadow-sm cursor-pointer select-none transition-colors duration-200 flex flex-col justify-center items-center relative';

  const iconButtonClass = 'btn-icon absolute bottom-2 right-2';

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleClick(); };

// --- VUE LARGE ---
if (viewMode === 'large') {
  return (
    <div
      ref={cardRef}
      className={`${baseCardClass} ${addedHighlightClass} ${pulseClass} p-4 text-base`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ajouter ${drink.name} à la commande`}
      style={{ minHeight: 140 }}
    >
      {/* Ligne 1 : Popularité */}
      <div className="flex justify-center mb-1 w-full">
        {popularity && (
          <Badge className={`${popularity.className} mx-auto`}>
            {popularity.label}
            <TrendingUp size={14} className="inline-block ml-1" />
          </Badge>
        )}
      </div>
      {/* Ligne 2 : Nom boisson, centrée */}
      <div className="font-semibold drink-name text-center mb-1 line-clamp-2">{drink.name}</div>
      {/* Ligne 3 : Prix, centré */}
      <div className="drink-price text-muted-text mb-2 text-center">{drink.price.toFixed(2)} €</div>
      {/* Bouton modifier, petit en bas à droite */}
      <div className="drink-actions" style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <button
          className="btn-icon"
          aria-label={`Modifier ${drink.name}`}
          onClick={e => { e.stopPropagation(); onEdit(drink, 'edit'); }}
          type="button"
        >
          <Edit size={16} />
        </button>
      </div>
      {/* Badge quantité commande en haut à droite */}
      {quantityInOrder > 0 && (
        <Badge className={`badge-secondary top-2 right-2 ${pulseClass}`}>{quantityInOrder}</Badge>
      )}
    </div>
  );
}

// --- VUE COMPACTE ---
if (viewMode === 'compact') {
  return (
    <div
      ref={cardRef}
      className={`${baseCardClass} ${addedHighlightClass} ${pulseClass} p-2 text-sm`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ajouter ${drink.name} à la commande`}
      style={{ minHeight: 98 }}
    >
      {/* Nom boisson, centré */}
      <div className="font-semibold drink-name text-center mb-1 line-clamp-2">{drink.name}</div>
      {/* Bouton modifier, petit en bas à droite */}
      <div className="drink-actions" style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <button
          className="btn-icon"
          aria-label={`Modifier ${drink.name}`}
          onClick={e => { e.stopPropagation(); onEdit(drink, 'edit'); }}
          type="button"
        >
          <Edit size={16} />
        </button>
      </div>
      {/* Badge commande en haut à droite */}
      {quantityInOrder > 0 && (
        <Badge className={`badge-secondary top-2 right-2 ${pulseClass}`}>{quantityInOrder}</Badge>
      )}
    </div>
  );
}

// --- VUE MINIMALE ---
return (
  <div
    ref={cardRef}
    className={`${baseCardClass} ${addedHighlightClass} ${pulseClass} p-1 text-xs`}
    onClick={handleClick}
    onKeyDown={handleKeyDown}
    tabIndex={0}
    role="button"
    aria-label={`Ajouter ${drink.name} à la commande`}
    style={{ minHeight: 78 }}
  >
    {/* Nom boisson, centré */}
    <div className="font-semibold drink-name text-center mb-1 line-clamp-2">{drink.name}</div>
    {/* Bouton modifier en bas à droite */}
    <div className="drink-actions" style={{ position: 'absolute', bottom: 0, right: 0 }}>
      <button
        className="btn-icon"
        aria-label={`Modifier ${drink.name}`}
        onClick={e => { e.stopPropagation(); onEdit(drink, 'edit'); }}
        type="button"
      >
        <Edit size={12} />
      </button>
    </div>
    {/* Badge commande en haut à droite */}
    {quantityInOrder > 0 && (
      <Badge className={`badge-secondary top-1 right-1 ${pulseClass}`}>{quantityInOrder}</Badge>
    )}
  </div>
  );
}

export default DrinkCard;
