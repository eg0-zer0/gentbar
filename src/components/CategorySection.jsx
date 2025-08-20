import React from 'react';
import DrinkCard from './DrinkCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

// Petite icône boisson compacte
const DrinkIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 2h8l-1 8H5L4 2zm3 10a1 1 0 1 1 2 0h-2z"/>
  </svg>
);

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
  viewMode = 'large',
}) => {
  const drinksToShow = sortedDrinks.length > 0 ? sortedDrinks : category.drinks;

  return (
    <div className="mb-6 w-full overflow-x-hidden">
      {/* HEADER DE CATÉGORIE */}
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center gap-1 min-w-0 max-w-[65%]">
          {/* Bouton plier/déplier */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleCategory(category.id)}
            className="p-1 h-8 dark:hover:bg-gray-700 flex-shrink-0"
            tabIndex={0}
            draggable={false}
            aria-label={category.isCollapsed ? "Déplier catégorie" : "Replier catégorie"}
          >
            {category.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-primary" />
            )}
          </Button>

          {/* Icône catégorie */}
          <span className="text-2xl text-text-primary flex-shrink-0">{category.icon}</span>

          {/* NOM MULTI-LIGNES avec truncature uniquement si trop long */}
          <h2 
            className="text-xl font-bold text-text-primary break-words whitespace-normal line-clamp-2"
            title={category.name} // tooltip au survol
          >
            {category.name}
          </h2>

          {/* BADGE: NOMBRE + ICON BOISSON */}
          <Badge
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md h-7
             bg-white text-blue-900 border-none
             dark:bg-yellow-300 dark:text-blue-900
             transition-colors"
          >
            <DrinkIcon />
           {category.drinks.length}
          </Badge>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddDrinkToCategory(category.id)}
            className="text-xs dark:border-gray-600 dark:hover:bg-gray-700 px-2"
            aria-label="Ajouter une boisson"
          >
            <Plus className="w-3 h-3 mr-1" />
            {viewMode === 'minimal' ? "" : "Ajouter"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs dark:hover:bg-gray-700" aria-label="Modifier catégorie">
                <Edit className="w-3 h-3 text-text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuItem
                onClick={() => onEditCategory(category)}
                className="dark:hover:bg-gray-700 text-text-primary"
              >
                <Edit className="w-3 h-3 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteCategory(category)}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* LISTE DES BOISSONS */}
      {!category.isCollapsed && (
        <div
            className={`grid gap-1.5 ${
      viewMode === 'minimal'
        ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
        : viewMode === 'compact'
        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}
        >
          {drinksToShow.map((drink) => {
            const orderItem = orders.find((o) => o.drinkId === drink.id);
            const quantityInOrder = orderItem ? orderItem.quantity : 0;

            return (
              <DrinkCard
                key={drink.id}
                drink={drink}
                categoryColor={category.color}
                onAdd={onAddDrink}
                onEdit={onEditDrink}
                onDelete={onDeleteDrink}
                popularityScore={drinkPopularity[drink.id] || 0}
                quantityInOrder={quantityInOrder}
                soundEnabled={soundEnabled}
                viewMode={viewMode}
                categoryIcon={category.icon}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySection;
