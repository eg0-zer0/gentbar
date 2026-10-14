import { toast } from 'sonner';

/**
 * Normalise une chaîne pour comparaison insensible aux accents, à la casse et aux espaces superflus.
 * @param {string} str
 * @returns {string}
 */
const normalizeName = (str) =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/**
 * Ajoute les boissons d'une commande passée dans le panier en cours (E-8).
 * Règles strictes :
 * 1. Cumul avec le panier existant (incrémente les quantités si déjà présent, ajoute sinon) - jamais de remplacement.
 * 2. Nom et prix repris du menu ACTUEL.
 * 3. Boisson introuvable (par drinkId puis nom normalisé) ignorée et signalée : « X n'est plus au menu, non ajoutée ».
 * 4. Plus aucun crash / appel à generateDrinkId() sans argument.
 *
 * @param {Object} options
 * @param {Object} options.order - La commande source (depuis l'historique, ticket ou modal succès).
 * @param {Array} options.currentOrders - Le panier actuel.
 * @param {Array} options.categories - Les catégories du menu actuel.
 * @param {Function} options.onOrdersUpdated - Callback recevant le nouveau panier.
 * @returns {Array} Le nouveau panier.
 */
export function reorderIntoCart({
  order,
  currentOrders = [],
  categories = [],
  onOrdersUpdated
}) {
  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.orders)
      ? order.orders
      : Array.isArray(order)
        ? order
        : [];

  if (!items.length) {
    toast.error("Aucun article à recommander dans cette commande.");
    return currentOrders;
  }

  // Liste plate de toutes les boissons actuelles du menu
  const allCurrentDrinks = (categories || []).flatMap(c => c.drinks || []);

  const addedItems = [];
  const missingDrinks = [];

  items.forEach(item => {
    const rawName = item.drinkName || item.name || 'Boisson';
    let matchedDrink = null;

    // 1. Recherche prioritaire par identifiant
    if (item.drinkId) {
      matchedDrink = allCurrentDrinks.find(d => d.id === item.drinkId);
    }

    // 2. Repli par nom normalisé (anciennes commandes ou commandes migrées)
    if (!matchedDrink && rawName) {
      const normalizedTarget = normalizeName(rawName);
      matchedDrink = allCurrentDrinks.find(d => normalizeName(d.name) === normalizedTarget);
    }

    if (matchedDrink) {
      addedItems.push({
        drinkId: matchedDrink.id,
        drinkName: matchedDrink.name,
        price: matchedDrink.price,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
      });
    } else {
      missingDrinks.push(rawName);
    }
  });

  // Avertissement pour les boissons supprimées du menu
  missingDrinks.forEach(name => {
    toast.warning(`« ${name} » n'est plus au menu, non ajoutée`);
  });

  if (!addedItems.length) {
    toast.error("Aucune boisson n'a pu être ajoutée", {
      description: "Les boissons de cette commande ne figurent plus au menu actuel."
    });
    return currentOrders;
  }

  // Fusion cumulative dans le panier existant
  const newOrders = [...currentOrders];

  addedItems.forEach(itemToAdd => {
    const existingIndex = newOrders.findIndex(o => o.drinkId === itemToAdd.drinkId);
    if (existingIndex !== -1) {
      newOrders[existingIndex] = {
        ...newOrders[existingIndex],
        drinkName: itemToAdd.drinkName,
        price: itemToAdd.price,
        quantity: newOrders[existingIndex].quantity + itemToAdd.quantity
      };
    } else {
      newOrders.push({
        drinkId: itemToAdd.drinkId,
        drinkName: itemToAdd.drinkName,
        price: itemToAdd.price,
        quantity: itemToAdd.quantity,
        addedAt: new Date().toISOString()
      });
    }
  });

  if (typeof onOrdersUpdated === 'function') {
    onOrdersUpdated(newOrders);
  }

  const totalDrinksAdded = addedItems.reduce((sum, i) => sum + i.quantity, 0);
  toast.success("Commande ajoutée au panier", {
    description: `${totalDrinksAdded} boisson${totalDrinksAdded > 1 ? 's' : ''} (${addedItems.length} référence${addedItems.length > 1 ? 's' : ''}) ajoutée${totalDrinksAdded > 1 ? 's' : ''} au panier.`
  });

  return newOrders;
}
