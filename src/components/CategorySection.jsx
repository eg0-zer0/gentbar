import React from 'react';

import DrinkCard from './DrinkCard';

import { Badge } from './ui/badge';

import { Button } from './ui/button';

import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

import { useViewMode } from '../contexts/ViewModeContext';

const CategorySection = ({
  category,
  onAddDrink,
  onEditDrink,
  onToggleCategory,
  onEditCategory,
  onAddDrinkToCategory,
  onDeleteCategory,
  onDeleteDrink,
  sortedDrinks = [],
  drinkPopularity = {},
  orders = [],
  soundEnabled = true,
}) => {
  const { viewMode } = useViewMode();

  // Choix des boissons à afficher : tri personnalisé ou d'origine
  const drinksToShow = sortedDrinks.length > 0 ? sortedDrinks : category.drinks;

  // Récupère la quantité commandée pour une boisson
  const getQuantityForDrink = (drinkId) => {
    const order = orders.find(o => o.drinkId === drinkId);
    return order ? order.quantity : 0;
  };

  return (
    <section aria-label={`Catégorie ${category.name}`} className="mb-6">
      {/* En-tête de la catégorie, cliquable pour dérouler/plier */}
      <header
        className="flex items-center justify-between cursor-pointer select-none mb-2"
        onClick={() => onToggleCategory(category.id)}
        role="button"
        aria-expanded={!category.isCollapsed}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleCategory(category.id)}
      >
        <div className="flex items-center gap-2">
          {category.isCollapsed ? <ChevronRight /> : <ChevronDown />}
          <h2 className="text-lg font-semibold">{category.name}</h2>
          {/* Optionnel : icône ou badge */}
          {category.icon && <span aria-hidden="true">{category.icon}</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAddDrinkToCategory(category.id);
            }}
            aria-label={`Ajouter une boisson à la catégorie ${category.name}`}
          >
            <Plus size={16} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                aria-label={`Options pour la catégorie ${category.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Edit size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onEditCategory(category);
                }}
              >
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
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

      {/* Liste des boissons - grille responsive */}
      {!category.isCollapsed && (
        <div className="category-grid" aria-label={`Boissons de la catégorie ${category.name}`}>
          {drinksToShow.map((drink) => (
            <DrinkCard
              key={drink.id}
              drink={drink}
              onAdd={onAddDrink}
              onEdit={onEditDrink}
              onDelete={onDeleteDrink}
              popularityScore={drinkPopularity[drink.id] ?? 0}
              quantityInOrder={getQuantityForDrink(drink.id)}
              soundEnabled={soundEnabled}
              categoryIcon={category.icon}
              className="drink-card"
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CategorySection;
