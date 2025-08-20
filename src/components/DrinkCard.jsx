import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Edit, Trash2, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

const DrinkCard = ({
  drink,
  onAdd,
  onEdit,
  onDelete,
  popularityScore = 0,
  quantityInOrder = 0,
  soundEnabled = true,
  viewMode = 'large',
  categoryIcon = '🍹', // icone catégorie par défaut
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const cardRef = useRef(null);

  // --- Niveau de popularité ---
  const getPopularityLevel = (score) => {
    if (score >= 10) return { label: 'TOP', color: 'bg-red-500 text-white' };
    if (score >= 5) return { label: 'HOT', color: 'bg-orange-500 text-white' };
    if (score >= 2) return { label: 'POP', color: 'bg-blue-500 text-white' };
    return null;
  };
  const popularity = getPopularityLevel(popularityScore);

  // --- Flash vert à l'ajout ---
  useEffect(() => {
    let timer;
    if (isAdded) {
      timer = setTimeout(() => setIsAdded(false), 1000);
    }
    return () => clearTimeout(timer);
  }, [isAdded]);

  // --- Pulse sur badge quantité ---
  useEffect(() => {
    if (quantityInOrder > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [quantityInOrder]);

  // --- Génération d'un bip bref en Web Audio ---
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

  // --- Clic sur carte ---
  const handleClick = () => {
    setIsAdded(true);
    if (soundEnabled) {
      playBeep();
    }
    if (onAdd) {
      onAdd(drink);
    }
  };

  // --- Vue MINIMALE ---
  if (viewMode === 'minimal') {
    return (
      <Card
        ref={cardRef}
        className="cursor-pointer p-2 min-h-[85px] min-w-[70px] xs:min-w-0 xs:w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center"
        onClick={handleClick}
        draggable={false}
      >
        <CardContent className="p-2 flex flex-col items-center justify-center">
          {/* Icône catégorie */}
          <div className="text-4xl mb-1 select-none" aria-hidden="true">
            {categoryIcon}
          </div>
          {/* Nom centré et coupé sur 2 lignes */}
          <div className="flex items-center justify-center min-h-[2.5em] w-full">
            <h3
              className="drink-name-minimal text-base xs:text-sm sm:text-xs"
              title={drink.name}
            >
              {drink.name}
            </h3>
          </div>
          {/* Boutons Modifier / Supprimer */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(drink, 'edit');
              }}
              aria-label={`Modifier ${drink.name}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(drink);
              }}
              aria-label={`Supprimer ${drink.name}`}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Vue COMPACTE ---
  if (viewMode === 'compact') {
    return (
      <Card
        ref={cardRef}
        className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative touch-manipulation cursor-pointer bg-white dark:bg-gray-800"
        onClick={handleClick}
        draggable={false}
      >
        {quantityInOrder > 0 && (
          <div
            className={`absolute top-1 right-1 bg-purple-600 text-white text-xs rounded-full px-2 py-0.5 z-10 ${
              pulse ? 'animate-bounce' : ''
            }`}
            aria-label={`Quantité dans la commande : ${quantityInOrder}`}
          >
            {quantityInOrder}
          </div>
        )}
        <CardContent className="p-3">
          <div className="flex flex-col items-center justify-center">
            {/* Icône catégorie si besoin */}
            <div className="text-2xl mb-1 select-none" aria-hidden="true">
              {categoryIcon}
            </div>
            {/* Nom boisson compact */}
            <div className="flex items-center justify-center min-h-[2.6em] w-full">
              <h3
                className="drink-name-compact text-lg xs:text-base sm:text-sm"
                title={drink.name}
              >
                {drink.name}
              </h3>
            </div>
            {/* Boutons Modifier / Supprimer */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(drink, 'edit');
                }}
                aria-label={`Modifier ${drink.name}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(drink);
                }}
                aria-label={`Supprimer ${drink.name}`}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Vue LARGE ---
  return (
    <Card
      ref={cardRef}
      className={`hover:shadow-md transition-all duration-200 hover:-translate-y-1 
        relative touch-manipulation cursor-pointer ${
          isAdded ? 'bg-green-100 dark:bg-green-900' : 'bg-white dark:bg-gray-800'
        }`}
      onClick={handleClick}
      draggable={false}
    >
      {quantityInOrder > 0 && (
        <div
          className={`absolute top-1 right-1 bg-purple-600 text-white text-xs rounded-full px-2 py-0.5 z-10 ${
            pulse ? 'animate-bounce' : ''
          }`}
          aria-label={`Quantité dans la commande : ${quantityInOrder}`}
        >
          {quantityInOrder}
        </div>
      )}

      <CardContent className="p-3">
        <div className="flex items-start">
          {/* Infos boisson */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight break-words whitespace-normal line-clamp-2">
              {drink.name}
            </h3>

            <div className="flex flex-wrap gap-2 mt-1">
              {popularity && (
                <Badge className={`${popularity.color} border-0 text-xs px-2 py-0 h-4`}>
                  {popularity.label}
                </Badge>
              )}
              {popularityScore > 0 && (
                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {popularityScore}
                </span>
              )}
            </div>

            <p className="text-base font-medium text-gray-700 dark:text-gray-300 mt-2">
              {drink.price.toFixed(2)}€
            </p>
          </div>

          {/* Menu contextuel */}
          <div className="flex flex-col items-end ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 dark:hover:bg-gray-700"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Modifier"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(drink, 'edit');
                  }}
                  className="dark:hover:bg-gray-700"
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(drink);
                  }}
                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrinkCard;
