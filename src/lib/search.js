/**
 * Module partagé de normalisation textuelle, de recherche dans le menu (E-3)
 * et de détection des doublons de noms de boissons (E-10).
 */

/**
 * Normalise une chaîne de caractères pour les comparaisons textuelles :
 * - Décomposition NFD et suppression des accents / diacritiques
 * - Conversion en minuscules
 * - Nettoyage des espaces superflus (début, fin, multiples)
 *
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Recherche des boissons à travers toutes les catégories (E-3).
 * Renvoie une liste à plat avec les métadonnées de la catégorie d'origine pour chaque résultat.
 *
 * @param {Array} categories - Liste des catégories avec leurs boissons
 * @param {string} query - Requête de recherche
 * @returns {Array|null} Liste des boissons trouvées avec categoryName/categoryIcon/categoryId, ou null si requête vide.
 */
export function searchDrinks(categories, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return null;

  const results = [];
  (categories || []).forEach(category => {
    (category.drinks || []).forEach(drink => {
      const normalizedDrinkName = normalizeText(drink.name);
      if (normalizedDrinkName.includes(normalizedQuery)) {
        results.push({
          ...drink,
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon
        });
      }
    });
  });

  return results;
}

/**
 * Détecte si un nom de boisson existe déjà dans une liste de boissons (E-10).
 * Ignore la casse, les accents et les espaces superflus.
 *
 * @param {Array} drinks - Boissons de la catégorie
 * @param {string} nameToTest - Nom saisi
 * @param {string} [excludeDrinkId] - Identifiant de la boisson en cours d'édition (si renommage)
 * @returns {Object|null} La boisson en doublon trouvée, ou null.
 */
export function findDuplicateDrinkName(drinks, nameToTest, excludeDrinkId = null) {
  const normalizedTarget = normalizeText(nameToTest);
  if (!normalizedTarget) return null;

  return (drinks || []).find(drink => {
    if (excludeDrinkId && drink.id === excludeDrinkId) return false;
    return normalizeText(drink.name) === normalizedTarget;
  }) || null;
}
