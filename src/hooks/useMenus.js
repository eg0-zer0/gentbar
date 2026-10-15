import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { mockCategories, MENU_VERSION } from '../mock';
import { generateDrinkId } from '../utils/id';
import {
  load,
  save,
  loadRaw,
  saveRaw,
  normalizeCategories,
  normalizeOrders
} from '../lib/storage';

// Message à afficher une fois après un remplacement de carte ayant retiré des lignes du panier.
let menuMigrationNotice = null;

/**
 * Remplace la carte stockée quand MENU_VERSION change (8 bis) :
 *  1. l'ancienne carte est copiée telle quelle dans `categories__backup` (jamais perdue) ;
 *  2. la nouvelle carte est installée, puis le marqueur de version est écrit en dernier
 *     (une interruption en cours de route relance simplement la migration) ;
 *  3. les lignes du panier dont le drinkId n'existe plus dans la nouvelle carte sont retirées.
 * Idempotent : sans changement de version, ne fait rien.
 */
const migrateMenuIfNeeded = () => {
  if (loadRaw('menuVersion') === MENU_VERSION) return;

  const previousRaw = loadRaw('categories');
  if (previousRaw !== null) saveRaw('categories__backup', previousRaw);

  save('categories', mockCategories);

  const validIds = new Set(mockCategories.flatMap((c) => c.drinks.map((d) => d.id)));
  const currentOrders = load('orders', [], normalizeOrders);
  const keptOrders = currentOrders.filter((o) => validIds.has(o.drinkId));
  const removedCount = currentOrders.length - keptOrders.length;
  if (removedCount > 0) {
    save('orders', keptOrders);
    menuMigrationNotice = `${removedCount} article${removedCount > 1 ? 's' : ''} retiré${removedCount > 1 ? 's' : ''} du panier : absent${removedCount > 1 ? 's' : ''} de la nouvelle carte.`;
  }

  saveRaw('menuVersion', MENU_VERSION);
};

/**
 * Hook de gestion des menus et catégories.
 * Prépare la transition vers le multi-bars (A-29).
 */
export const useMenus = () => {
  const [categories, setCategories] = useState(() => {
    migrateMenuIfNeeded();
    return load('categories', mockCategories, normalizeCategories);
  });

  useEffect(() => {
    save('categories', categories);
  }, [categories]);

  // Avertir si des articles ont été retirés lors de la migration
  useEffect(() => {
    if (menuMigrationNotice) {
      toast(menuMigrationNotice);
      menuMigrationNotice = null;
    }
  }, []);

  // Déplier / replier une catégorie
  const toggleCategory = (categoryId) => {
    setCategories(prev =>
      Array.isArray(prev) ? prev.map(c => c.id === categoryId ? { ...c, isCollapsed: !c.isCollapsed } : c) : []
    );
  };

  // Enregistrer (ajouter ou modifier) une catégorie
  const saveCategory = (cat) => {
    setCategories(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(c => c.id === cat.id);
      if (exists) {
        toast("Catégorie modifiée", { description: `${cat.name} mise à jour` });
        return list.map(c => c.id === cat.id ? cat : c);
      } else {
        toast("Catégorie ajoutée", { description: `${cat.name} créée` });
        return [...list, { ...cat, id: `cat-${Date.now()}`, drinks: [], isCollapsed: false }];
      }
    });
  };

  // Supprimer une catégorie et notifier pour synchroniser le panier
  const deleteCategory = (cat, onCategoryDeleted) => {
    const catDrinkIds = new Set(cat?.drinks?.map(d => d.id) || []);
    setCategories(prev => (Array.isArray(prev) ? prev.filter(c => c.id !== cat.id) : []));
    if (onCategoryDeleted) {
      onCategoryDeleted(catDrinkIds);
    }
    toast("Catégorie supprimée", { description: `${cat?.name || 'Catégorie'} supprimée` });
  };

  // Enregistrer (ajouter ou modifier) une boisson
  const saveDrink = (updated, mode, categoryId, onDrinkUpdated) => {
    if (mode === 'add') {
      setCategories(prev => (Array.isArray(prev) ? prev : []).map(c =>
        c.id === categoryId
          ? { ...c, drinks: [...(c.drinks || []), { ...updated, id: generateDrinkId(updated.name, c.id) }] }
          : c
      ));
      toast("Boisson ajoutée", { description: `${updated.name} ajoutée au menu` });
    } else {
      setCategories(prev => (Array.isArray(prev) ? prev : []).map(c => ({
        ...c,
        drinks: (c.drinks || []).map(d => d.id === updated.id ? updated : d)
      })));
      if (onDrinkUpdated) {
        onDrinkUpdated(updated.id, updated.name, updated.price);
      }
      toast("Boisson modifiée", { description: `${updated.name} modifiée` });
    }
  };

  // Supprimer une boisson et notifier pour synchroniser le panier
  const deleteDrink = (item, categoryId, onDrinkDeleted) => {
    setCategories(prev => (Array.isArray(prev) ? prev : []).map(c =>
      c.id === categoryId ? { ...c, drinks: (c.drinks || []).filter(d => d.id !== item.id) } : c
    ));
    if (onDrinkDeleted) {
      onDrinkDeleted(item.id);
    }
    toast("Boisson supprimée", { description: `${item?.name || 'Boisson'} a été retirée du menu` });
  };

  return {
    categories,
    setCategories,
    toggleCategory,
    saveCategory,
    deleteCategory,
    saveDrink,
    deleteDrink
  };
};

export default useMenus;
