import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mockCategories, MENU_VERSION } from '../mock';
import { generateDrinkId } from '../utils/id';
import {
  BASE_BAR_ID,
  SCHEMA_VERSION,
  buildBaseBar,
  migrateLegacyToMenus,
  getActiveBar,
  updateBarCategories,
  withBarId
} from '../lib/menus';
import {
  load,
  save,
  loadRaw,
  saveRaw,
  normalizeCategories,
  normalizeMenus,
  normalizeOrders,
  normalizeOrderHistory,
  normalizeString,
  normalizeNumber
} from '../lib/storage';

// Message à afficher une fois après un remplacement de carte ayant retiré des lignes du panier.
let menuMigrationNotice = null;

/**
 * Migration historique MENU_VERSION sur la clé `categories` (étape 3a, avant passage au schéma 2).
 */
const migrateLegacyMenuIfNeeded = () => {
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
 * Remplace le bar de base dans `menus` quand MENU_VERSION change (schéma >= 2) :
 *  1. `menus` est sauvegardé dans `menus__backup` avant remplacement ;
 *  2. le bar de base ('rllhc') est remplacé par la nouvelle carte de base ;
 *  3. les lignes du panier du bar de base dont le drinkId n'existe plus sont retirées ;
 *  4. `menuVersion` est mis à jour en dernier.
 * Sera remplacé par la fusion `mergeMenus` à l'étape 9.7c.
 */
export const migrateMenuIfNeeded = () => {
  if (loadRaw('menuVersion') === MENU_VERSION) return;

  const previousMenusRaw = loadRaw('menus');
  if (previousMenusRaw !== null) saveRaw('menus__backup', previousMenusRaw);

  const freshBaseBar = buildBaseBar(mockCategories, MENU_VERSION);
  const existingMenus = load('menus', () => [freshBaseBar], normalizeMenus);
  const hasBaseBar = existingMenus.some((b) => b && b.id === BASE_BAR_ID);
  const nextMenus = hasBaseBar
    ? existingMenus.map((b) => (b && b.id === BASE_BAR_ID ? freshBaseBar : b))
    : [freshBaseBar, ...existingMenus];

  save('menus', nextMenus);

  const validIds = new Set(mockCategories.flatMap((c) => c.drinks.map((d) => d.id)));
  const currentOrders = load('orders', [], normalizeOrders);
  const keptOrders = currentOrders.filter(
    (o) => (o.barId && o.barId !== BASE_BAR_ID) || validIds.has(o.drinkId)
  );
  const removedCount = currentOrders.length - keptOrders.length;
  if (removedCount > 0) {
    save('orders', keptOrders);
    menuMigrationNotice = `${removedCount} article${removedCount > 1 ? 's' : ''} retiré${removedCount > 1 ? 's' : ''} du panier : absent${removedCount > 1 ? 's' : ''} de la nouvelle carte.`;
  }

  saveRaw('menuVersion', MENU_VERSION);
};

/**
 * Exécute la migration vers le modèle multi-bars (schéma 2) une seule fois,
 * dans l'ordre strict, interruptible et relançable sans doublon :
 *  a. appliquer d'abord l'actuelle migration MENU_VERSION ;
 *  b. copier la valeur brute de `categories` dans `categories__pre_multibars` (sans supprimer `categories`) ;
 *  c. écrire `menus` et `activeMenuId` ;
 *  d. ajouter `barId: 'rllhc'` aux lignes de `orders` et `orderHistory` qui n'en ont pas ;
 *  e. écrire `schemaVersion = 2` EN DERNIER.
 */
export const runMigrationsIfNeeded = () => {
  const currentSchema = Number(load('schemaVersion', 0, normalizeNumber)) || 0;

  if (currentSchema < SCHEMA_VERSION) {
    // a. Migration MENU_VERSION sur categories
    migrateLegacyMenuIfNeeded();

    // b. Copie brute de categories dans categories__pre_multibars (si absente)
    const rawCategories = loadRaw('categories');
    if (rawCategories !== null && loadRaw('categories__pre_multibars') === null) {
      saveRaw('categories__pre_multibars', rawCategories);
    }

    // c. Construction et écriture de menus et activeMenuId
    const legacyCategories = load('categories', null, normalizeCategories);
    const { menus: migratedMenus, activeMenuId: migratedActiveId } = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });
    save('menus', migratedMenus);
    save('activeMenuId', migratedActiveId);

    // d. Ajout de barId: 'rllhc' aux lignes de orders et orderHistory qui n'en ont pas
    const currentOrders = load('orders', [], normalizeOrders);
    if (currentOrders.length > 0) {
      save('orders', withBarId(currentOrders, BASE_BAR_ID));
    }

    const currentHistory = load('orderHistory', null, normalizeOrderHistory);
    if (Array.isArray(currentHistory) && currentHistory.length > 0) {
      save('orderHistory', withBarId(currentHistory, BASE_BAR_ID));
    }

    // e. Écriture de schemaVersion = 2 EN DERNIER
    save('schemaVersion', SCHEMA_VERSION);
  } else {
    // Déjà en schéma >= 2 : appliquer migrateMenuIfNeeded sur le bar de base dans menus
    migrateMenuIfNeeded();
  }
};

/**
 * Hook de gestion des menus et catégories (modèle multi-bars A-29 / 9.7b).
 * Maintient l'API historique intacte pour DrinkOrderApp tout en exposant menus, activeMenuId et activeMenu.
 */
export const useMenus = () => {
  const [schemaVersion] = useState(() => {
    runMigrationsIfNeeded();
    return load('schemaVersion', SCHEMA_VERSION, normalizeNumber);
  });

  const [menus, setMenus] = useState(() =>
    load('menus', () => [buildBaseBar(mockCategories, MENU_VERSION)], normalizeMenus)
  );

  const [activeMenuId] = useState(() =>
    load('activeMenuId', BASE_BAR_ID, normalizeString)
  );

  useEffect(() => {
    save('menus', menus);
  }, [menus]);

  useEffect(() => {
    save('activeMenuId', activeMenuId);
  }, [activeMenuId]);

  useEffect(() => {
    save('schemaVersion', schemaVersion);
  }, [schemaVersion]);

  // Avertir si des articles ont été retirés lors de la migration
  useEffect(() => {
    if (menuMigrationNotice) {
      toast(menuMigrationNotice);
      menuMigrationNotice = null;
    }
  }, []);

  const activeMenu = getActiveBar(menus, activeMenuId) || buildBaseBar(mockCategories, MENU_VERSION);
  const categories = Array.isArray(activeMenu?.categories) ? activeMenu.categories : [];

  // Met à jour les catégories du bar actif
  const setCategories = useCallback(
    (updater) => {
      setMenus((prevMenus) => {
        const targetBar = getActiveBar(prevMenus, activeMenuId);
        const targetBarId = targetBar ? targetBar.id : BASE_BAR_ID;
        return updateBarCategories(prevMenus, targetBarId, updater);
      });
    },
    [activeMenuId]
  );

  // Déplier / replier une catégorie
  const toggleCategory = (categoryId) => {
    setCategories((prev) =>
      Array.isArray(prev)
        ? prev.map((c) => (c.id === categoryId ? { ...c, isCollapsed: !c.isCollapsed } : c))
        : []
    );
  };

  // Enregistrer (ajouter ou modifier) une catégorie avec modified: true (toast hors updater)
  const saveCategory = (cat) => {
    const exists = Array.isArray(categories) && categories.some((c) => c.id === cat.id);
    setCategories((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((c) => c.id === cat.id)) {
        return list.map((c) => (c.id === cat.id ? { ...cat, modified: true } : c));
      }
      return [
        ...list,
        {
          ...cat,
          id: `cat-${Date.now()}`,
          drinks: [],
          isCollapsed: false,
          modified: true
        }
      ];
    });

    if (exists) {
      toast('Catégorie modifiée', { description: `${cat.name} mise à jour` });
    } else {
      toast('Catégorie ajoutée', { description: `${cat.name} créée` });
    }
  };

  // Supprimer une catégorie et notifier pour synchroniser le panier
  const deleteCategory = (cat, onCategoryDeleted) => {
    const catDrinkIds = new Set(cat?.drinks?.map((d) => d.id) || []);
    setCategories((prev) => (Array.isArray(prev) ? prev.filter((c) => c.id !== cat.id) : []));
    if (onCategoryDeleted) {
      onCategoryDeleted(catDrinkIds);
    }
    toast('Catégorie supprimée', { description: `${cat?.name || 'Catégorie'} supprimée` });
  };

  // Enregistrer (ajouter ou modifier) une boisson avec modified: true
  const saveDrink = (updated, mode, categoryId, onDrinkUpdated) => {
    if (mode === 'add') {
      setCategories((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.id === categoryId
            ? {
                ...c,
                drinks: [
                  ...(c.drinks || []),
                  {
                    ...updated,
                    id: generateDrinkId(updated.name, c.id),
                    modified: true
                  }
                ]
              }
            : c
        )
      );
      toast('Boisson ajoutée', { description: `${updated.name} ajoutée au menu` });
    } else {
      setCategories((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ({
          ...c,
          drinks: (c.drinks || []).map((d) =>
            d.id === updated.id ? { ...updated, modified: true } : d
          )
        }))
      );
      if (onDrinkUpdated) {
        onDrinkUpdated(updated.id, updated.name, updated.price);
      }
      toast('Boisson modifiée', { description: `${updated.name} modifiée` });
    }
  };

  // Supprimer une boisson et notifier pour synchroniser le panier
  const deleteDrink = (item, categoryId, onDrinkDeleted) => {
    setCategories((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) =>
        c.id === categoryId
          ? { ...c, drinks: (c.drinks || []).filter((d) => d.id !== item.id) }
          : c
      )
    );
    if (onDrinkDeleted) {
      onDrinkDeleted(item.id);
    }
    toast('Boisson supprimée', { description: `${item?.name || 'Boisson'} a été retirée du menu` });
  };

  return {
    menus,
    activeMenuId,
    activeMenu,
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
