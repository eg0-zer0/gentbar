// Moteur générique de fusion de cartes (Étape 9.7c / A-29).
// Fonctions 100 % pures : aucun argument n'est jamais muté, aucun accès au stockage.

import { normalizeText } from './search';

const cloneDrink = (drink) => ({ ...drink });

const cloneCategory = (cat) => ({
  ...cat,
  drinks: Array.isArray(cat?.drinks) ? cat.drinks.map(cloneDrink) : []
});

/**
 * Fusionne une carte locale (`local`) avec une carte entrante (`incoming`).
 *
 * Règles :
 *  a. Élément non modifié localement (`!modified` ou `overwriteModified: true`) :
 *     reprend nom, prix et icône de `incoming` et passe à `modified: false`.
 *  b. Élément modifié localement (`modified: true` et `overwriteModified: false`) :
 *     conservé tel quel ; listé dans `report.kept` uniquement si `incoming` diffère.
 *  c. Élément nouveau dans `incoming` :
 *     ajouté en fin de liste (catégorie ou boisson), sauf si son `id` figure dans `local.deletedIds`.
 *  d. Élément présent dans `local` mais absent de `incoming` :
 *     jamais supprimé ; listé dans `report.missing`.
 *
 * @param {Object} local - Bar local
 * @param {Object} incoming - Bar entrant (ou objet contenant `categories` et éventuellement `baseVersion`)
 * @param {Object} [options]
 * @param {'id'|'name'} [options.matchBy='id'] - Mode d'appariement ('id' ou 'name' normalisé)
 * @param {boolean} [options.overwriteModified=false] - Si vrai, écrase aussi les éléments modifiés
 * @returns {{ bar: Object, report: { added: Array, addedCategories: Array, updated: Array, kept: Array, missing: Array } }}
 */
export function mergeMenus(
  local,
  incoming,
  { matchBy = 'id', overwriteModified = false } = {}
) {
  const report = {
    added: [],
    addedCategories: [],
    updated: [],
    kept: [],
    missing: []
  };

  const safeLocal = local && typeof local === 'object' ? local : { categories: [] };
  const safeIncoming = incoming && typeof incoming === 'object' ? incoming : { categories: [] };

  const localCategories = Array.isArray(safeLocal.categories) ? safeLocal.categories : [];
  const incomingCategories = Array.isArray(safeIncoming.categories) ? safeIncoming.categories : [];

  const deletedSet = new Set(Array.isArray(safeLocal.deletedIds) ? safeLocal.deletedIds : []);

  const getCatKey = (cat) => {
    if (!cat) return '';
    return matchBy === 'name' ? normalizeText(cat.name || '') : String(cat.id || '');
  };

  const getDrinkKey = (drink) => {
    if (!drink) return '';
    return matchBy === 'name' ? normalizeText(drink.name || '') : String(drink.id || '');
  };

  // Indexation des catégories entrantes
  const incomingCatByKey = new Map();
  incomingCategories.forEach((incCat) => {
    const key = getCatKey(incCat);
    if (key && !incomingCatByKey.has(key)) {
      incomingCatByKey.set(key, incCat);
    }
  });

  const matchedIncomingCatKeys = new Set();
  const mergedCategories = [];

  // 1. Parcourir les catégories locales (préservation de l'ordre local)
  localCategories.forEach((localCat) => {
    if (!localCat || typeof localCat !== 'object') return;
    const catKey = getCatKey(localCat);
    const incCat = incomingCatByKey.get(catKey);

    if (!incCat) {
      // Catégorie présente en local mais absente de incoming : conservée intégralement
      const preservedCat = cloneCategory(localCat);
      preservedCat.drinks.forEach((d) => {
        report.missing.push({
          categoryId: preservedCat.id,
          categoryName: preservedCat.name,
          id: d.id,
          name: d.name,
          price: d.price
        });
      });
      mergedCategories.push(preservedCat);
      return;
    }

    matchedIncomingCatKeys.add(catKey);

    const catKeepLocal = Boolean(localCat.modified) && !overwriteModified;
    const nextCatName = catKeepLocal ? localCat.name : incCat.name;
    const nextCatIcon = catKeepLocal
      ? localCat.icon
      : incCat.icon !== undefined
        ? incCat.icon
        : localCat.icon;
    const nextCatColor = catKeepLocal
      ? localCat.color
      : incCat.color !== undefined
        ? incCat.color
        : localCat.color;

    // Indexation des boissons de la catégorie entrante
    const incDrinks = Array.isArray(incCat.drinks) ? incCat.drinks : [];
    const incDrinkByKey = new Map();
    incDrinks.forEach((d) => {
      const dKey = getDrinkKey(d);
      if (dKey && !incDrinkByKey.has(dKey)) {
        incDrinkByKey.set(dKey, d);
      }
    });

    const matchedIncDrinkKeys = new Set();
    const mergedDrinks = [];
    const localDrinks = Array.isArray(localCat.drinks) ? localCat.drinks : [];

    // 1a. Parcourir les boissons locales de la catégorie
    localDrinks.forEach((localDrink) => {
      if (!localDrink || typeof localDrink !== 'object') return;
      const dKey = getDrinkKey(localDrink);
      const incDrink = incDrinkByKey.get(dKey);

      if (!incDrink) {
        // Boisson locale absente de incoming : jamais supprimée, ajoutée à missing
        mergedDrinks.push(cloneDrink(localDrink));
        report.missing.push({
          categoryId: localCat.id,
          categoryName: nextCatName,
          id: localDrink.id,
          name: localDrink.name,
          price: localDrink.price
        });
        return;
      }

      matchedIncDrinkKeys.add(dKey);

      const nameDiffers = localDrink.name !== incDrink.name;
      const priceDiffers = localDrink.price !== incDrink.price;
      const iconDiffers = (localDrink.icon || '') !== (incDrink.icon || '');
      const hasDiff = nameDiffers || priceDiffers || iconDiffers;

      const keepLocalDrink = Boolean(localDrink.modified) && !overwriteModified;

      if (keepLocalDrink) {
        // Règle b : modifiée localement → conservée telle quelle
        mergedDrinks.push({
          ...localDrink,
          modified: true
        });

        if (hasDiff) {
          report.kept.push({
            categoryId: localCat.id,
            categoryName: nextCatName,
            id: localDrink.id,
            name: localDrink.name,
            localName: localDrink.name,
            incomingName: incDrink.name,
            oldPrice: localDrink.price,
            newPrice: incDrink.price,
            localPrice: localDrink.price,
            incomingPrice: incDrink.price
          });
        }
      } else {
        // Règle a (ou overwriteModified: true) : reprend les valeurs de incoming
        const updatedDrink = {
          ...localDrink,
          name: incDrink.name,
          price: incDrink.price,
          modified: false
        };
        if (incDrink.icon !== undefined) {
          updatedDrink.icon = incDrink.icon;
        }
        mergedDrinks.push(updatedDrink);

        if (hasDiff) {
          report.updated.push({
            categoryId: localCat.id,
            categoryName: nextCatName,
            id: localDrink.id,
            name: incDrink.name,
            oldName: localDrink.name,
            newName: incDrink.name,
            oldPrice: localDrink.price,
            newPrice: incDrink.price
          });
        }
      }
    });

    // 1b. Ajouter à la fin de la catégorie les nouvelles boissons de incoming (sauf si dans deletedIds)
    incDrinks.forEach((incDrink) => {
      if (!incDrink || typeof incDrink !== 'object') return;
      const dKey = getDrinkKey(incDrink);
      if (matchedIncDrinkKeys.has(dKey)) return;
      if (incDrink.id && deletedSet.has(incDrink.id)) return;

      const addedDrink = {
        ...incDrink,
        modified: false
      };
      mergedDrinks.push(addedDrink);
      report.added.push({
        categoryId: localCat.id,
        categoryName: nextCatName,
        id: incDrink.id,
        name: incDrink.name,
        price: incDrink.price
      });
    });

    const mergedCat = {
      ...localCat,
      name: nextCatName,
      icon: nextCatIcon,
      modified: catKeepLocal,
      drinks: mergedDrinks
    };
    if (nextCatColor !== undefined) {
      mergedCat.color = nextCatColor;
    }

    mergedCategories.push(mergedCat);
  });

  // 2. Ajouter à la fin les nouvelles catégories de incoming (sauf si dans deletedIds)
  incomingCategories.forEach((incCat) => {
    if (!incCat || typeof incCat !== 'object') return;
    const catKey = getCatKey(incCat);
    if (matchedIncomingCatKeys.has(catKey)) return;
    if (incCat.id && deletedSet.has(incCat.id)) return;

    const incDrinks = Array.isArray(incCat.drinks) ? incCat.drinks : [];
    const newCatDrinks = [];

    incDrinks.forEach((incDrink) => {
      if (!incDrink || typeof incDrink !== 'object') return;
      if (incDrink.id && deletedSet.has(incDrink.id)) return;

      const addedDrink = {
        ...incDrink,
        modified: false
      };
      newCatDrinks.push(addedDrink);
      report.added.push({
        categoryId: incCat.id,
        categoryName: incCat.name,
        id: incDrink.id,
        name: incDrink.name,
        price: incDrink.price
      });
    });

    const addedCategory = {
      ...incCat,
      modified: false,
      drinks: newCatDrinks
    };
    mergedCategories.push(addedCategory);
    report.addedCategories.push({
      id: incCat.id,
      name: incCat.name,
      icon: incCat.icon || '🍺'
    });
  });

  const mergedBar = {
    ...safeLocal,
    baseVersion:
      safeIncoming.baseVersion !== undefined
        ? safeIncoming.baseVersion
        : safeLocal.baseVersion ?? null,
    categories: mergedCategories
  };

  if (Array.isArray(safeLocal.deletedIds)) {
    mergedBar.deletedIds = [...safeLocal.deletedIds];
  }

  return {
    bar: mergedBar,
    report
  };
}

/**
 * Synthétise un rapport de fusion en français :
 * ex. « 6 ajoutées · 4 prix mis à jour · 2 conservées »
 */
export function summarizeReport(report = {}) {
  const addedCount = Array.isArray(report?.added) ? report.added.length : 0;
  const updatedCount = Array.isArray(report?.updated) ? report.updated.length : 0;
  const keptCount = Array.isArray(report?.kept) ? report.kept.length : 0;

  const parts = [];
  if (addedCount > 0) {
    parts.push(`${addedCount} ajoutée${addedCount > 1 ? 's' : ''}`);
  }
  if (updatedCount > 0) {
    parts.push(`${updatedCount} prix mis à jour`);
  }
  if (keptCount > 0) {
    parts.push(`${keptCount} conservée${keptCount > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Aucun changement';
  }
  return parts.join(' · ');
}
