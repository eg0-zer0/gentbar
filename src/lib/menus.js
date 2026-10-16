// Modèle de données et fonctions pures pour la gestion multi-bars (A-29 / Étapes 9.7b & 9.7c).
// Aucun accès direct au stockage (localStorage) dans ce module.

export const BASE_BAR_ID = 'rllhc';
export const BASE_SOURCE_ID = 'gentbar-rllhc';
export const GENTBAR_BAR_ID = 'gentbar';
export const GENTBAR_SOURCE_ID = 'gentbar-base';
export const BASE_BAR_IDS = [BASE_BAR_ID, GENTBAR_BAR_ID];
export const SCHEMA_VERSION = 2;
export const MAX_DELETED_IDS = 500;

const isFiniteNumber = (n) => typeof n === 'number' && Number.isFinite(n);
const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;

/**
 * Normalise et plafonne une liste d'identifiants supprimés (sans doublon, max 500).
 */
export function normalizeDeletedIds(ids) {
  if (!Array.isArray(ids)) return [];
  const unique = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (isNonEmptyString(id) && !seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  if (unique.length > MAX_DELETED_IDS) {
    return unique.slice(unique.length - MAX_DELETED_IDS);
  }
  return unique;
}

/**
 * Ajoute un ou plusieurs identifiants à la liste `deletedIds` d'un bar (sans doublon, plafonné à 500).
 */
export function appendDeletedIds(existingIds = [], newIds = []) {
  const incoming = Array.isArray(newIds) ? newIds : [newIds];
  return normalizeDeletedIds([...(Array.isArray(existingIds) ? existingIds : []), ...incoming]);
}

/**
 * Crée un objet Bar normalisé.
 */
export function createBar({
  id = BASE_BAR_ID,
  sourceId,
  name = 'Club de hockey',
  icon = '🏒',
  origin = 'custom',
  baseVersion = null,
  deletedIds,
  categories = []
} = {}) {
  const safeId = isNonEmptyString(id) ? id : BASE_BAR_ID;
  const safeSourceId = isNonEmptyString(sourceId)
    ? sourceId
    : safeId === BASE_BAR_ID
      ? BASE_SOURCE_ID
      : safeId === GENTBAR_BAR_ID
        ? GENTBAR_SOURCE_ID
        : `gentbar-${safeId}`;

  const bar = {
    id: safeId,
    sourceId: safeSourceId,
    name: isNonEmptyString(name) ? name : 'Bar',
    icon: typeof icon === 'string' && icon.length > 0 ? icon : '🍺',
    origin: origin === 'base' ? 'base' : 'custom',
    baseVersion: baseVersion ?? null,
    categories: Array.isArray(categories) ? categories : []
  };

  if (Array.isArray(deletedIds)) {
    bar.deletedIds = normalizeDeletedIds(deletedIds);
  }

  return bar;
}

const sanitizeBaseCategories = (categories = []) =>
  Array.isArray(categories)
    ? categories
        .filter((cat) => cat && isNonEmptyString(cat.id) && isNonEmptyString(cat.name))
        .map((cat) => ({
          ...cat,
          modified: false,
          drinks: Array.isArray(cat.drinks)
            ? cat.drinks
                .filter((d) => d && isNonEmptyString(d.id) && isNonEmptyString(d.name) && isFiniteNumber(d.price))
                .map((d) => ({
                  ...d,
                  modified: false
                }))
            : []
        }))
    : [];

/**
 * Construit le bar de base principal « Club de hockey » à partir de mockCategories et MENU_VERSION.
 * Toutes les catégories et boissons portent `modified: false`.
 */
export function buildBaseBar(mockCategories = [], menuVersion = null) {
  return createBar({
    id: BASE_BAR_ID,
    sourceId: BASE_SOURCE_ID,
    name: 'Club de hockey',
    icon: '🏒',
    origin: 'base',
    baseVersion: menuVersion,
    categories: sanitizeBaseCategories(mockCategories)
  });
}

/**
 * Construit le second bar de base officiel « GentBar » à partir de mockGentBarCategories et MENU_VERSION.
 * Toutes les catégories et boissons portent `modified: false`.
 */
export function buildGentBar(gentBarCategories = [], menuVersion = null) {
  return createBar({
    id: GENTBAR_BAR_ID,
    sourceId: GENTBAR_SOURCE_ID,
    name: 'GentBar',
    icon: '🍹',
    origin: 'base',
    baseVersion: menuVersion,
    categories: sanitizeBaseCategories(gentBarCategories)
  });
}

/**
 * Construit les deux bars de base officiels de l'application (« Club de hockey » et « GentBar »).
 */
export function buildDefaultBaseBars(hockeyCategories = [], gentBarCategories = [], menuVersion = null) {
  return [
    buildBaseBar(hockeyCategories, menuVersion),
    buildGentBar(gentBarCategories, menuVersion)
  ];
}

/**
 * Migre les anciennes catégories mono-bar (`categories`) vers la structure `{ menus: [bar], activeMenuId }`.
 * - Pose `modified: true` sur toute catégorie ou boisson dont le nom, le prix ou l'icône
 *   diffère de la carte de base de même id, ou qui n'existe pas dans la carte de base.
 * - Si `legacyCategories` est absent, vide ou illisible, replie sur la carte de base.
 * - Fonction pure et idempotente.
 */
export function migrateLegacyToMenus({
  legacyCategories,
  baseCategories = [],
  baseVersion = null
} = {}) {
  const baseBar = buildBaseBar(baseCategories, baseVersion);

  if (!Array.isArray(legacyCategories) || legacyCategories.length === 0) {
    return {
      menus: [baseBar],
      activeMenuId: BASE_BAR_ID
    };
  }

  // Filtrage des catégories valides
  const validLegacyCategories = legacyCategories.filter(
    (cat) => cat && isNonEmptyString(cat.id) && isNonEmptyString(cat.name) && Array.isArray(cat.drinks)
  );

  if (validLegacyCategories.length === 0) {
    return {
      menus: [baseBar],
      activeMenuId: BASE_BAR_ID
    };
  }

  // Indexation de la carte de base par identifiant
  const baseCategoryById = new Map();
  const baseDrinkById = new Map();

  if (Array.isArray(baseCategories)) {
    baseCategories.forEach((cat) => {
      if (cat && isNonEmptyString(cat.id)) {
        baseCategoryById.set(cat.id, cat);
        if (Array.isArray(cat.drinks)) {
          cat.drinks.forEach((drink) => {
            if (drink && isNonEmptyString(drink.id)) {
              baseDrinkById.set(drink.id, drink);
            }
          });
        }
      }
    });
  }

  const migratedCategories = validLegacyCategories.map((cat) => {
    const baseCat = baseCategoryById.get(cat.id);
    const catModified =
      !baseCat ||
      cat.name !== baseCat.name ||
      (cat.icon || '') !== (baseCat.icon || '');

    const validDrinks = cat.drinks.filter(
      (d) => d && isNonEmptyString(d.id) && isNonEmptyString(d.name) && isFiniteNumber(d.price)
    );

    const migratedDrinks = validDrinks.map((drink) => {
      const baseDrink = baseDrinkById.get(drink.id);
      const drinkModified =
        !baseDrink ||
        drink.name !== baseDrink.name ||
        drink.price !== baseDrink.price ||
        (drink.icon || '') !== (baseDrink.icon || '');

      return {
        ...drink,
        modified: Boolean(drinkModified)
      };
    });

    return {
      ...cat,
      modified: Boolean(catModified),
      drinks: migratedDrinks
    };
  });

  // Si toutes les boissons de toutes les catégories étaient invalides alors que la base en contient
  const totalMigratedDrinks = migratedCategories.reduce((sum, c) => sum + c.drinks.length, 0);
  if (totalMigratedDrinks === 0 && baseDrinkById.size > 0) {
    return {
      menus: [baseBar],
      activeMenuId: BASE_BAR_ID
    };
  }

  const migratedBar = createBar({
    id: BASE_BAR_ID,
    sourceId: BASE_SOURCE_ID,
    name: 'Club de hockey',
    icon: '🏒',
    origin: 'base',
    baseVersion,
    categories: migratedCategories
  });

  return {
    menus: [migratedBar],
    activeMenuId: BASE_BAR_ID
  };
}

/**
 * Renvoie le bar actif correspondant à `activeMenuId`, avec repli sur le premier bar disponible.
 */
export function getActiveBar(menus, activeMenuId) {
  if (!Array.isArray(menus) || menus.length === 0) return null;
  const found = menus.find((bar) => bar && bar.id === activeMenuId);
  return found || menus[0] || null;
}

/**
 * Met à jour les catégories d'un bar donné dans la liste `menus`.
 * `updater` peut être un tableau de catégories ou une fonction `(prevCategories) => nextCategories`.
 */
export function updateBarCategories(menus, barId, updater) {
  if (!Array.isArray(menus)) return [];
  return menus.map((bar) => {
    if (!bar || bar.id !== barId) return bar;
    const prevCategories = Array.isArray(bar.categories) ? bar.categories : [];
    const nextCategories = typeof updater === 'function' ? updater(prevCategories) : updater;
    return {
      ...bar,
      categories: Array.isArray(nextCategories) ? nextCategories : []
    };
  });
}

/**
 * Ajoute `barId` aux lignes (ou commandes d'historique) qui n'en ont pas,
 * sans jamais écraser un `barId` existant.
 */
export function withBarId(lines, barId = BASE_BAR_ID) {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => {
    if (!line || typeof line !== 'object') return line;
    const hasExistingBarId = isNonEmptyString(line.barId);
    const nextLine = hasExistingBarId ? { ...line } : { ...line, barId };

    if (Array.isArray(line.items)) {
      nextLine.items = withBarId(line.items, barId);
    }

    return nextLine;
  });
}

/**
 * Rafraîchit le nom et le prix des lignes du panier dont le `drinkId` existe dans `bar`,
 * sans modifier les lignes inconnues ni toucher à leur `barId`.
 * Fonction pure qui ne mute aucun de ses arguments.
 */
export function syncOrdersWithBar(orders, bar) {
  if (!Array.isArray(orders)) return [];
  const categories = Array.isArray(bar?.categories)
    ? bar.categories
    : Array.isArray(bar)
      ? bar
      : [];

  const drinkById = new Map();
  categories.forEach((cat) => {
    if (cat && Array.isArray(cat.drinks)) {
      cat.drinks.forEach((drink) => {
        if (drink && isNonEmptyString(drink.id) && isNonEmptyString(drink.name) && isFiniteNumber(drink.price)) {
          drinkById.set(drink.id, drink);
        }
      });
    }
  });

  return orders.map((line) => {
    if (!line || typeof line !== 'object') return line;
    const matched = drinkById.get(line.drinkId);
    if (!matched) {
      return { ...line };
    }
    return {
      ...line,
      drinkName: matched.name,
      price: matched.price
    };
  });
}
