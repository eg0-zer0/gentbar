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
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg bg-secondary/80 text-white border border-slate-700/60 hover:bg-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onAddDrinkToCategory(category.id);
              }}
              aria-label={`Ajouter une boisson à la catégorie ${category.name}`}
            >
              <Plus size={15} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-lg bg-secondary/80 text-muted-foreground hover:text-white border border-slate-700/60 hover:bg-secondary"
                  aria-label={`Options pour la catégorie ${category.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover text-popover-foreground border border-slate-700/60 shadow-xl rounded-xl">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsBulkOpen(true);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ajouter plusieurs boissons
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    onEditCategory(category);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteCategory(category);
                  }}
                >
                  Supprimer
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
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg bg-secondary/80 text-white border border-slate-700/60 hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDrinkToCategory(category.id);
                }}
                aria-label={`Ajouter une boisson à la catégorie ${category.name}`}
              >
                <Plus size={15} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg bg-secondary/80 text-muted-foreground hover:text-white border border-slate-700/60 hover:bg-secondary"
                    aria-label={`Options pour la catégorie ${category.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover text-popover-foreground border border-slate-700/60 shadow-xl rounded-xl">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBulkOpen(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ajouter plusieurs boissons
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      onEditCategory(category);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      onDeleteCategory(category);
                    }}
                  >
                    Supprimer
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
