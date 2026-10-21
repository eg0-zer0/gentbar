import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mockCategories, mockGentBarCategories, MENU_VERSION } from '../mock';
import { generateDrinkId } from '../utils/id';
import {
  BASE_BAR_ID,
  GENTBAR_BAR_ID,
  SCHEMA_VERSION,
  buildBaseBar,
  buildGentBar,
  buildDefaultBaseBars,
  migrateLegacyToMenus,
  getActiveBar,
  updateBarCategories,
  withBarId,
  appendDeletedIds,
  syncOrdersWithBar,
  isBaseBar,
  createCustomBar,
  duplicateBar,
  renameBar,
  removeBar,
  prepareImportedBar,
  applyMergedBarToMenus,
  appendDrinksToCategory,
  createBarFromParsedCategories,
  appendParsedCategoriesToCategories
} from '../lib/menus';
import { mergeMenus, summarizeReport } from '../lib/menuMerge';
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

// Message à afficher une fois après une mise à jour automatique des cartes de base.
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
 * Met à jour les 2 cartes de base officielles ('rllhc' et 'gentbar') quand MENU_VERSION change :
 *  1. sauvegarde `menus` brut dans `menus__backup` avant remplacement ;
 *  2. écrase les 2 cartes de base officielles avec les nouvelles données de `src/mock.js`,
 *     sans jamais toucher aux cartes personnalisées (`origin: 'custom'`) ;
 *  3. écrit `menus` en une seule écriture ;
 *  4. rafraîchit le nom et le prix des lignes du panier (`orders`) via `syncOrdersWithBar` ;
 *  5. met à jour `menuVersion` en dernier.
 * Si `MENU_VERSION` n'a pas changé mais que la 2e carte de base ('gentbar') est absente
 * (transition depuis 9.7b), elle est ajoutée sans écraser 'rllhc'.
 */
export const updateBaseBarIfNeeded = () => {
  const freshHockeyBar = buildBaseBar(mockCategories, MENU_VERSION);
  const freshGentBar = buildGentBar(mockGentBarCategories, MENU_VERSION);
  const existingMenus = load(
    'menus',
    () => [freshHockeyBar, freshGentBar],
    normalizeMenus
  );

  const hockeyBar = existingMenus.find((b) => b && b.id === BASE_BAR_ID);
  const gentBar = existingMenus.find((b) => b && b.id === GENTBAR_BAR_ID);
  const storedMenuVersion = loadRaw('menuVersion');

  const needsVersionUpdate =
    storedMenuVersion !== MENU_VERSION ||
    !hockeyBar ||
    hockeyBar.baseVersion !== MENU_VERSION ||
    (gentBar && gentBar.baseVersion !== MENU_VERSION);

  if (!needsVersionUpdate) {
    // Simple ajout de la 2e carte de base si absente (sans toucher à 'rllhc')
    if (!gentBar) {
      const nextMenus = [];
      let insertedGentBar = false;
      existingMenus.forEach((b) => {
        nextMenus.push(b);
        if (b && b.id === BASE_BAR_ID && !insertedGentBar) {
          nextMenus.push(freshGentBar);
          insertedGentBar = true;
        }
      });
      if (!insertedGentBar) {
        nextMenus.push(freshGentBar);
      }
      save('menus', nextMenus);
    }
    return;
  }

  // 1. Sauvegarde brute dans menus__backup
  const previousMenusRaw = loadRaw('menus');
  if (previousMenusRaw !== null) {
    saveRaw('menus__backup', previousMenusRaw);
  }

  // 2. Remplacement des 2 cartes de base officielles, conservation des cartes custom
  const customBars = existingMenus.filter(
    (b) => b && b.id !== BASE_BAR_ID && b.id !== GENTBAR_BAR_ID
  );
  const nextMenus = [freshHockeyBar, freshGentBar, ...customBars];

  // 3. Écriture de menus en une seule opération
  save('menus', nextMenus);

  // 4. Synchronisation des lignes du panier avec les nouvelles cartes de base
  const currentOrders = load('orders', [], normalizeOrders);
  if (currentOrders.length > 0) {
    const syncedWithHockey = syncOrdersWithBar(currentOrders, freshHockeyBar);
    const syncedAll = syncOrdersWithBar(syncedWithHockey, freshGentBar);
    save('orders', syncedAll);
  }

  // 5. Mise à jour de menuVersion en dernier
  saveRaw('menuVersion', MENU_VERSION);
  if (previousMenusRaw !== null) {
    menuMigrationNotice = 'Cartes de base mises à jour';
  }
};

// Alias conservé pour compatibilité
export const migrateMenuIfNeeded = updateBaseBarIfNeeded;

/**
 * Exécute la migration vers le modèle multi-bars (schéma 2) une seule fois,
 * dans l'ordre strict, interruptible et relançable sans doublon :
 *  a. appliquer d'abord l'actuelle migration MENU_VERSION ;
 *  b. copier la valeur brute de `categories` dans `categories__pre_multibars` (sans supprimer `categories`) ;
 *  c. écrire `menus` (avec 'rllhc' migré et 'gentbar' officiel) et `activeMenuId` ;
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

    // c. Construction et écriture de menus (les 2 bars de base) et activeMenuId
    const legacyCategories = load('categories', null, normalizeCategories);
    const { menus: migratedMenus, activeMenuId: migratedActiveId } = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });
    const gentBar = buildGentBar(mockGentBarCategories, MENU_VERSION);
    const initialMenus = migratedMenus.some((b) => b && b.id === GENTBAR_BAR_ID)
      ? migratedMenus
      : [...migratedMenus, gentBar];

    save('menus', initialMenus);
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
    // Déjà en schéma >= 2 : mettre à jour les cartes de base si MENU_VERSION a changé
    updateBaseBarIfNeeded();
  }
};

/**
 * Hook de gestion des menus et catégories (modèle multi-bars A-29 / 9.7b, 9.7c & 9.7d).
 * Maintient l'API historique intacte pour DrinkOrderApp tout en exposant menus, activeMenuId, activeMenu et les actions de gestion des bars.
 */
export const useMenus = () => {
  const [schemaVersion] = useState(() => {
    runMigrationsIfNeeded();
    return load('schemaVersion', SCHEMA_VERSION, normalizeNumber);
  });

  const [menus, setMenus] = useState(() =>
    load(
      'menus',
      () => buildDefaultBaseBars(mockCategories, mockGentBarCategories, MENU_VERSION),
      normalizeMenus
    )
  );

  const [activeMenuId, setActiveMenuId] = useState(() =>
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

  // Avertir une fois après une mise à jour automatique des cartes de base (léger délai pour que Toaster soit monté)
  useEffect(() => {
    if (menuMigrationNotice) {
      const notice = menuMigrationNotice;
      menuMigrationNotice = null;
      const timer = setTimeout(() => {
        toast(notice, {
          description: 'Les cartes officielles ont été synchronisées.'
        });
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const activeMenu =
    getActiveBar(menus, activeMenuId) || buildBaseBar(mockCategories, MENU_VERSION);
  const categories = Array.isArray(activeMenu?.categories) ? activeMenu.categories : [];

  // Sélectionner un bar actif
  const selectBar = useCallback(
    (barId, { silent = false } = {}) => {
      if (!barId) return;
      const target = Array.isArray(menus) ? menus.find((b) => b && b.id === barId) : null;
      if (!target) return;
      setActiveMenuId(barId);
      if (!silent) {
        toast(`Carte active : ${target.name}`, {
          description: `${target.icon} ${target.name}`
        });
      }
    },
    [menus]
  );

  // Créer une nouvelle carte vide
  const addEmptyBar = useCallback(
    ({ name, icon, activate = true } = {}) => {
      const newBar = createCustomBar({ name, icon, categories: [] });
      setMenus((prev) => [...(Array.isArray(prev) ? prev : []), newBar]);
      if (activate) {
        setActiveMenuId(newBar.id);
      }
      toast('Carte créée', {
        description: `${newBar.icon} ${newBar.name} est prête.`
      });
      return newBar;
    },
    []
  );

  // Dupliquer une carte existante en une copie indépendante
  const duplicateExistingBar = useCallback(
    (sourceBarId, { name, icon, activate = true } = {}) => {
      const sourceBar = Array.isArray(menus)
        ? menus.find((b) => b && b.id === sourceBarId)
        : null;
      if (!sourceBar) return null;

      const copiedBar = duplicateBar(sourceBar, { name, icon });
      setMenus((prev) => [...(Array.isArray(prev) ? prev : []), copiedBar]);
      if (activate) {
        setActiveMenuId(copiedBar.id);
      }
      toast('Carte dupliquée', {
        description: `${copiedBar.icon} ${copiedBar.name} a été créée à partir de ${sourceBar.name}.`
      });
      return copiedBar;
    },
    [menus]
  );

  // Renommer un bar et/ou changer son icône
  const renameExistingBar = useCallback((barId, { name, icon } = {}) => {
    if (!barId) return;
    setMenus((prev) => renameBar(prev, barId, { name, icon }));
    toast('Carte modifiée', {
      description: 'Le nom et l’icône ont été mis à jour.'
    });
  }, []);

  // Supprimer un bar personnalisé (refusé sur les 2 cartes de base officielles)
  const deleteExistingBar = useCallback(
    (barId) => {
      const target = Array.isArray(menus) ? menus.find((b) => b && b.id === barId) : null;
      if (!target || isBaseBar(target) || isBaseBar(barId)) {
        toast.error('Suppression impossible', {
          description: 'Les cartes de base officielles ne peuvent pas être supprimées.'
        });
        return false;
      }

      const previousMenusRaw = loadRaw('menus');
      if (previousMenusRaw !== null) {
        saveRaw('menus__backup', previousMenusRaw);
      }

      const result = removeBar(menus, barId, activeMenuId);
      if (!result.removed) return false;

      setMenus(result.menus);
      setActiveMenuId(result.activeMenuId);
      toast('Carte supprimée', {
        description: `${target.name} a été retirée de vos bars.`
      });
      return true;
    },
    [menus, activeMenuId]
  );

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

  // Supprimer une catégorie, enregistrer ses identifiants dans deletedIds (max 500) et notifier le panier
  const deleteCategory = (cat, onCategoryDeleted) => {
    const drinkIds = Array.isArray(cat?.drinks)
      ? cat.drinks.map((d) => d?.id).filter(Boolean)
      : [];
    const catDrinkIds = new Set(drinkIds);
    const idsToRecord = [cat?.id, ...drinkIds].filter(Boolean);

    setMenus((prevMenus) => {
      const targetBar = getActiveBar(prevMenus, activeMenuId);
      const targetBarId = targetBar ? targetBar.id : BASE_BAR_ID;
      return (Array.isArray(prevMenus) ? prevMenus : []).map((bar) => {
        if (!bar || bar.id !== targetBarId) return bar;
        const prevCategories = Array.isArray(bar.categories) ? bar.categories : [];
        return {
          ...bar,
          categories: prevCategories.filter((c) => c.id !== cat?.id),
          deletedIds: appendDeletedIds(bar.deletedIds, idsToRecord)
        };
      });
    });

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

  // Supprimer une boisson, enregistrer son id dans deletedIds (max 500) et notifier le panier
  const deleteDrink = (item, categoryId, onDrinkDeleted) => {
    const idsToRecord = item?.id ? [item.id] : [];

    setMenus((prevMenus) => {
      const targetBar = getActiveBar(prevMenus, activeMenuId);
      const targetBarId = targetBar ? targetBar.id : BASE_BAR_ID;
      return (Array.isArray(prevMenus) ? prevMenus : []).map((bar) => {
        if (!bar || bar.id !== targetBarId) return bar;
        const prevCategories = Array.isArray(bar.categories) ? bar.categories : [];
        return {
          ...bar,
          categories: prevCategories.map((c) =>
            c.id === categoryId
              ? { ...c, drinks: (c.drinks || []).filter((d) => d.id !== item?.id) }
              : c
          ),
          deletedIds: appendDeletedIds(bar.deletedIds, idsToRecord)
        };
      });
    });

    if (onDrinkDeleted) {
      onDrinkDeleted(item.id);
    }
    toast('Boisson supprimée', { description: `${item?.name || 'Boisson'} a été retirée du menu` });
  };

  // Restaurer manuellement l'une des 2 cartes de base officielles ('rllhc' ou 'gentbar')
  const restoreBaseBar = useCallback(
    (barId = activeMenuId) => {
      if (barId !== BASE_BAR_ID && barId !== GENTBAR_BAR_ID) return null;

      const previousMenusRaw = loadRaw('menus');
      if (previousMenusRaw !== null) {
        saveRaw('menus__backup', previousMenusRaw);
      }

      const freshBar =
        barId === GENTBAR_BAR_ID
          ? buildGentBar(mockGentBarCategories, MENU_VERSION)
          : buildBaseBar(mockCategories, MENU_VERSION);

      setMenus((prevMenus) => {
        const list = Array.isArray(prevMenus) ? prevMenus : [];
        const exists = list.some((b) => b && b.id === barId);
        return exists
          ? list.map((b) => (b && b.id === barId ? freshBar : b))
          : [...list, freshBar];
      });

      const currentOrders = load('orders', [], normalizeOrders);
      if (currentOrders.length > 0) {
        save('orders', syncOrdersWithBar(currentOrders, freshBar));
      }

      toast('Carte officielle restaurée', {
        description: `La carte ${freshBar.name} a été réinitialisée.`
      });
      return freshBar;
    },
    [activeMenuId]
  );

  // Importer une nouvelle carte (reçue par lien ou fichier) en retenant son sourceId (§ 4.4)
  const importNewBar = useCallback(
    (incomingBar, { activate = true } = {}) => {
      if (!incomingBar) return null;
      const newBar = prepareImportedBar(incomingBar);
      setMenus((prev) => [...(Array.isArray(prev) ? prev : []), newBar]);
      if (activate) {
        setActiveMenuId(newBar.id);
      }
      toast('Carte ajoutée', {
        description: `${newBar.icon} ${newBar.name} a été enregistrée.`
      });
      return newBar;
    },
    []
  );

  // Fusionner une carte reçue dans un bar cible existant (§ 4.4, § 4.5)
  const mergeIncomingBar = useCallback(
    (targetBarId, incomingBar, { activate = true, overwriteModified = false } = {}) => {
      const targetBar = Array.isArray(menus) ? menus.find((b) => b && b.id === targetBarId) : null;
      if (!targetBar || !incomingBar) return null;

      // 1. Sauvegarde préalable de précaution (§ 2.2)
      const previousMenusRaw = loadRaw('menus');
      if (previousMenusRaw !== null) {
        saveRaw('menus__backup', previousMenusRaw);
      }

      // 2. Fusion par couple nom/catégorie (mode 'name')
      const { bar: merged, report } = mergeMenus(targetBar, incomingBar, {
        matchBy: 'name',
        overwriteModified
      });

      // 3. Application en préservant id, nom, icône locaux et en retenant sourceId entrant
      const nextMenus = applyMergedBarToMenus(menus, targetBarId, incomingBar, merged);
      setMenus(nextMenus);

      if (activate) {
        setActiveMenuId(targetBarId);
      }

      // 4. Synchronisation des lignes du panier
      const currentOrders = load('orders', [], normalizeOrders);
      if (currentOrders.length > 0) {
        save('orders', syncOrdersWithBar(currentOrders, merged));
      }

      toast('Carte mise à jour', {
        description: `${targetBar.name} : ${summarizeReport(report)}`
      });

      return { bar: merged, report };
    },
    [menus]
  );

  // Ajouter plusieurs boissons à une catégorie en une seule mise à jour (E-11 / Étape 9.8)
  const addDrinksToCategory = useCallback(
    (categoryId, drinksToAdd) => {
      if (!categoryId || !Array.isArray(drinksToAdd) || drinksToAdd.length === 0) return;
      const nextCategories = appendDrinksToCategory(categories, categoryId, drinksToAdd);
      setCategories(nextCategories);
      const targetCat = categories.find((c) => c && c.id === categoryId);
      const catName = targetCat?.name ? ` à « ${targetCat.name} »` : '';
      toast.success(
        `${drinksToAdd.length} boisson${drinksToAdd.length > 1 ? 's' : ''} ajoutée${drinksToAdd.length > 1 ? 's' : ''}${catName}`
      );
    },
    [categories, setCategories]
  );

  // Créer un bar complet à partir de catégories analysées (E-11 / Étape 9.8)
  const createBarFromCategories = useCallback(
    ({ name, icon, parsedCategories, activate = true } = {}) => {
      const newBar = createBarFromParsedCategories({ name, icon, parsedCategories });
      setMenus((prev) => [...(Array.isArray(prev) ? prev : []), newBar]);
      if (activate) {
        setActiveMenuId(newBar.id);
      }
      const totalDrinks = Array.isArray(newBar.categories)
        ? newBar.categories.reduce(
            (sum, c) => sum + (Array.isArray(c.drinks) ? c.drinks.length : 0),
            0
          )
        : 0;
      toast.success(
        `Bar « ${newBar.name} » créé : ${totalDrinks} boisson${totalDrinks > 1 ? 's' : ''}`
      );
      return newBar;
    },
    [setMenus, setActiveMenuId]
  );


  // Ajouter plusieurs catégories parsées au bar actif (E-11 / Étape 9.8)
  const addCategoriesToActiveBar = useCallback(
    (parsedCategories) => {
      if (!Array.isArray(parsedCategories) || parsedCategories.length === 0) return;
      const nextCategories = appendParsedCategoriesToCategories(categories, parsedCategories);
      setCategories(nextCategories);
      const addedDrinksCount = parsedCategories.reduce(
        (acc, c) => acc + (Array.isArray(c?.drinks) ? c.drinks.length : 0),
        0
      );
      toast.success(
        `${addedDrinksCount} boisson${addedDrinksCount > 1 ? 's' : ''} ajoutée${addedDrinksCount > 1 ? 's' : ''} à « ${activeMenu?.name || 'la carte'} »`
      );
    },
    [categories, setCategories, activeMenu]
  );

  return {
    menus,
    activeMenuId,
    activeMenu,
    selectBar,
    addEmptyBar,
    duplicateExistingBar,
    renameExistingBar,
    deleteExistingBar,
    categories,
    setCategories,
    toggleCategory,
    saveCategory,
    deleteCategory,
    saveDrink,
    deleteDrink,
    restoreBaseBar,
    importNewBar,
    mergeIncomingBar,
    addDrinksToCategory,
    createBarFromCategories,
    addCategoriesToActiveBar
  };
};

export default useMenus;
