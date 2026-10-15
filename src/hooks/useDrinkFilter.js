import { useState, useMemo } from 'react';
import { useStoredState } from './useStoredState';
import { normalizeOneOf } from '../lib/storage';
import { searchDrinks } from '../lib/search';

const normalizeSortBy = normalizeOneOf(['name', 'popularity', 'price-asc', 'price-desc']);

/**
 * Hook de filtrage du menu : gère le tri (popularité, prix, alphabétique)
 * et la recherche instantanée multi-catégories (E-3).
 *
 * @param {Array} categories Catégories de boissons actuelles
 * @param {Object} drinkPopularity Scores de popularité par drinkId
 */
export const useDrinkFilter = (categories = [], drinkPopularity = {}) => {
  const [sortBy, setSortBy] = useStoredState('sortBy', 'popularity', normalizeSortBy);
  const [searchQuery, setSearchQuery] = useState('');

  // Fonction de tri des boissons
  const sortDrinks = (drinks, activeSort = sortBy) => {
    if (!Array.isArray(drinks)) return [];
    const sorted = [...drinks];
    switch (activeSort) {
      case 'popularity':
        return sorted.sort((a, b) => {
          const diff = (drinkPopularity?.[b.id] || 0) - (drinkPopularity?.[a.id] || 0);
          if (diff !== 0) return diff;
          return (a.name || '').localeCompare(b.name || '');
        });
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name':
      default:
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  };

  // Résultats de la recherche dans le menu (null si aucune recherche en cours)
  const searchResults = useMemo(() => {
    if (!Array.isArray(categories)) return null;
    const results = searchDrinks(categories, searchQuery);
    if (!results) return null;
    return sortDrinks(results, sortBy);
  }, [categories, searchQuery, sortBy, drinkPopularity]);

  const clearSearch = () => setSearchQuery('');

  return {
    sortBy,
    setSortBy,
    sortDrinks,
    searchQuery,
    setSearchQuery,
    clearSearch,
    searchResults
  };
};

export default useDrinkFilter;
