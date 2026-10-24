import React, { useState } from 'react';

import DrinkCard from './DrinkCard';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Edit, Plus, FileText } from 'lucide-react';
import BulkAddDrinksModal from './BulkAddDrinksModal';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

const CategorySection = ({
  category,
  onAddDrink,
  onEditDrink,
  onToggleCategory,
  onEditCategory,
  onAddDrinkToCategory,
  onAddDrinksToCategory,
  onDeleteCategory,
  onDeleteDrink,
  sortedDrinks = [],
  drinkPopularity = {},
  orders = [],
  soundEnabled = true,
}) => {
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Choix des boissons à afficher : tri personnalisé ou d'origine
  const drinksToShow = sortedDrinks.length > 0 ? sortedDrinks : category.drinks;

  // Récupère la quantité commandée pour une boisson
  const getQuantityForDrink = (drinkId) => {
    const order = orders.find(o => o.drinkId === drinkId);
    return order ? order.quantity : 0;
  };

  return (
    <section aria-label={`Catégorie ${category.name}`} className="mb-3.5 sm:mb-5">
      {/* 1. ÉTAT PLIÉ (Pill Card compacte Stitch) */}
      {category.isCollapsed ? (
        <div
          className="rounded-xl bg-card border border-slate-700/50 p-3 flex items-center justify-between hover:bg-secondary/40 transition-colors cursor-pointer select-none"
          onClick={() => onToggleCategory(category.id)}
          role="button"
          aria-expanded={false}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleCategory(category.id);
            }
          }}
        >
          {/* Chevron repliable strictement à gauche du nom de catégorie */}
          <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
            <ChevronRight className="w-5 h-5 text-[#f59e0b] shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold truncate text-white">
              {category.name}
            </h2>
            {category.icon && <span aria-hidden="true" className="ml-1 text-base">{category.icon}</span>}
          </div>
          {/* Actions à droite : uniquement le bouton + et le crayon d'édition (pas de flèche supplémentaire) */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#0e1b35] border border-[#23355b] text-slate-300 hover:text-white transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onAddDrinkToCategory(category.id);
              }}
              aria-label={`Ajouter une boisson à la catégorie ${category.name}`}
            >
              <Plus size={18} strokeWidth={2} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#0e1b35] border border-[#23355b] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label={`Options pour la catégorie ${category.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit size={17} strokeWidth={1.8} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[#0e1b35] border border-[#23355b] shadow-2xl p-1.5 flex flex-col space-y-0.5 backdrop-blur-md text-slate-100">
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-100 hover:bg-[#16274a] transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsBulkOpen(true);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4 text-slate-300 shrink-0" />
                  <span className="leading-snug">Ajouter plusieurs boissons</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-100 hover:bg-[#16274a] transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    onEditCategory(category);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 text-slate-300 shrink-0" />
                  <span>Modifier</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer focus:text-rose-400 focus:bg-rose-500/10"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteCategory(category);
                  }}
                >
                  <span className="pl-0.5">Supprimer</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        /* 2. ÉTAT DÉPLIÉ (En-tête ouvert + Grille 2 colonnes Stitch) */
        <div>
          <header
            className="flex items-center justify-between cursor-pointer select-none mb-2.5 py-1"
            onClick={() => onToggleCategory(category.id)}
            role="button"
            aria-expanded={true}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleCategory(category.id);
              }
            }}
          >
            {/* Chevron repliable strictement à gauche du nom de catégorie */}
            <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
              <ChevronDown className="w-5 h-5 text-[#f59e0b] shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 truncate">
                <span>{category.name}</span>
                {category.icon && <span aria-hidden="true">{category.icon}</span>}
              </h2>
            </div>

            {/* Actions à droite : uniquement bouton + et crayon d'édition (pas de flèche supplémentaire) */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#0e1b35] border border-[#23355b] text-slate-300 hover:text-white transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDrinkToCategory(category.id);
                }}
                aria-label={`Ajouter une boisson à la catégorie ${category.name}`}
              >
                <Plus size={18} strokeWidth={2} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#0e1b35] border border-[#23355b] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    aria-label={`Options pour la catégorie ${category.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={17} strokeWidth={1.8} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[#0e1b35] border border-[#23355b] shadow-2xl p-1.5 flex flex-col space-y-0.5 backdrop-blur-md text-slate-100">
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-100 hover:bg-[#16274a] transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBulkOpen(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4 text-slate-300 shrink-0" />
                    <span className="leading-snug">Ajouter plusieurs boissons</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-100 hover:bg-[#16274a] transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      onEditCategory(category);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4 text-slate-300 shrink-0" />
                    <span>Modifier</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer focus:text-rose-400 focus:bg-rose-500/10"
                    onClick={(e) => {
                      e.preventDefault();
                      onDeleteCategory(category);
                    }}
                  >
                    <span className="pl-0.5">Supprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Grille 2 colonnes fidèle à Stitch */}
          <div className="category-grid" aria-label={`Boissons de la catégorie ${category.name}`}>
            {drinksToShow && drinksToShow.length > 0 ? (
              drinksToShow.map((drink) => (
                <DrinkCard
                  key={drink.id}
                  drink={drink}
                  onAdd={() => onAddDrink(drink)}
                  onEdit={() => onEditDrink(drink)}
                  popularityScore={drinkPopularity[drink.id] || 0}
                  quantityInOrder={getQuantityForDrink(drink.id)}
                  soundEnabled={soundEnabled}
                />
              ))
            ) : (
              <p className="col-span-2 text-muted-foreground text-sm py-4 italic text-center">
                Aucune boisson dans cette catégorie.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modale d'ajout en lot */}
      {isBulkOpen && (
        <BulkAddDrinksModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          allowCategories={false}
          targetCategoryName={category.name}
          existingNames={(category.drinks || []).map((d) => d.name)}
          onConfirm={(drinks) => {
            if (onAddDrinksToCategory) {
              onAddDrinksToCategory(category.id, drinks);
            }
          }}
        />
      )}
    </section>
  );
};

export default CategorySection;
