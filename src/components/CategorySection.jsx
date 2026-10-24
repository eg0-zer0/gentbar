import React, { useState } from 'react';

import DrinkCard from './DrinkCard';
import { ChevronDown, ChevronRight, Edit, Plus, FileText } from 'lucide-react';
import BulkAddDrinksModal from './BulkAddDrinksModal';
import { useViewMode } from '../contexts/ViewModeContext';

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
  sortedDrinks = [],
  drinkPopularity = {},
  orders = [],
  soundEnabled = true,
  viewMode: viewModeProp
}) => {
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const { viewMode: contextViewMode = 'large' } = useViewMode() || {};
  const activeViewMode = viewModeProp || contextViewMode;

  // Colonnes gouvernées exclusivement par la logique React (normal : 2, compact : 3, minimal : 4)
  const gridColsClass =
    activeViewMode === 'minimal'
      ? 'grid grid-cols-4 gap-1.5 sm:gap-2'
      : activeViewMode === 'compact'
      ? 'grid grid-cols-3 gap-2 sm:gap-3'
      : 'grid grid-cols-2 gap-2.5 sm:gap-4';

  // Choix des boissons à afficher : tri personnalisé ou d'origine
  const drinksToShow = sortedDrinks.length > 0 ? sortedDrinks : category.drinks;

  // Récupère la quantité commandée pour une boisson
  const getQuantityForDrink = (drinkId) => {
    const order = orders.find(o => o.drinkId === drinkId);
    return order ? order.quantity : 0;
  };

  return (
    <section aria-label={`Catégorie ${category.name}`} className="mb-3.5 sm:mb-5">
      {/* 1. ÉTAT PLIÉ (Pill Card compacte) */}
      {category.isCollapsed ? (
        <div
          className="rounded-xl bg-card border border-border p-3 flex items-center justify-between hover:bg-secondary/40 transition-colors cursor-pointer select-none"
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
            <ChevronRight className="w-5 h-5 text-price shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold truncate text-card-foreground">
              {category.name}
            </h2>
            {category.icon && <span aria-hidden="true" className="ml-1 text-base">{category.icon}</span>}
          </div>
          {/* Actions à droite : uniquement le bouton + et le crayon d'édition */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-card-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-card-foreground hover:bg-secondary transition-colors cursor-pointer"
                  aria-label={`Options pour la catégorie ${category.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit size={17} strokeWidth={1.8} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-popover border border-border shadow-2xl p-1.5 flex flex-col space-y-0.5 backdrop-blur-md text-popover-foreground">
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-popover-foreground hover:bg-secondary focus:bg-secondary hover:text-card-foreground focus:text-card-foreground transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsBulkOpen(true);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="leading-snug">Ajouter plusieurs boissons</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-popover-foreground hover:bg-secondary focus:bg-secondary hover:text-card-foreground focus:text-card-foreground transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    onEditCategory(category);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Modifier</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus:text-destructive focus:bg-destructive/10"
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
        /* 2. ÉTAT DÉPLIÉ (En-tête ouvert + Grille dynamique selon le mode de vue) */
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
              <ChevronDown className="w-5 h-5 text-price shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5 truncate">
                <span>{category.name}</span>
                {category.icon && <span aria-hidden="true">{category.icon}</span>}
              </h2>
            </div>

            {/* Actions à droite : uniquement bouton + et crayon d'édition */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-card-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-card-foreground hover:bg-secondary transition-colors cursor-pointer"
                    aria-label={`Options pour la catégorie ${category.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={17} strokeWidth={1.8} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-popover border border-border shadow-2xl p-1.5 flex flex-col space-y-0.5 backdrop-blur-md text-popover-foreground">
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-popover-foreground hover:bg-secondary focus:bg-secondary hover:text-card-foreground focus:text-card-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBulkOpen(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="leading-snug">Ajouter plusieurs boissons</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-popover-foreground hover:bg-secondary focus:bg-secondary hover:text-card-foreground focus:text-card-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      onEditCategory(category);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Modifier</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus:text-destructive focus:bg-destructive/10"
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

          {/* Grille gouvernée par viewMode (2 / 3 / 4 colonnes) */}
          <div className={`category-grid ${gridColsClass}`} aria-label={`Boissons de la catégorie ${category.name}`}>
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
              <p className="col-span-full text-muted-foreground text-sm py-4 italic text-center">
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
