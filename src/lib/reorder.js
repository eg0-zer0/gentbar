import { toast } from 'sonner';
import { normalizeText } from './search';
import { BASE_BAR_ID, getOrderItemKey } from './menus';

/**
 * Ajoute les boissons d'une commande passée dans le panier en cours (E-8, § 4.6).
 * Règles strictes :
 * 1. Cumul avec le panier existant par couple (drinkId, barId) — jamais de remplacement.
 * 2. Nom et prix repris du menu ACTUEL du bar concerné.
 * 3. Si un bar a été supprimé, avertissement clair : « X n'est plus disponible (bar supprimé) ».
 * 4. Boisson introuvable au menu du bar ignorée et signalée : « X n'est plus au menu, non ajoutée ».
 * 5. Notifications séquencées sans superposition pour que l'avertissement et la confirmation soient lisibles successivement.
 *
 * @param {Object} options
 * @param {Object} options.order - La commande source (depuis l'historique, ticket ou modal succès).
 * @param {Array} options.currentOrders - Le panier actuel.
 * @param {Array} [options.categories] - Les catégories du menu actuel (repli mono-bar).
 * @param {Array} [options.menus] - La liste complète des bars enregistrés (multi-bars § 4.6).
 * @param {Function} options.onOrdersUpdated - Callback recevant le nouveau panier.
 * @param {string} [options.currentNote] - La note actuelle du panier.
 * @param {Function} [options.onNoteUpdated] - Callback pour mettre à jour la note.
 * @returns {Array} Le nouveau panier.
 */
export function reorderIntoCart({
  order,
  currentOrders = [],
  categories = [],
  menus = [],
  onOrdersUpdated,
  currentNote = '',
  onNoteUpdated
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

  const hasMenus = Array.isArray(menus) && menus.length > 0;
  // Fallback liste plate des boissons du menu actif si menus non fourni
  const fallbackDrinks = (categories || []).flatMap(c => c.drinks || []);

  const addedItems = [];
  const missingDrinks = [];

  items.forEach(item => {
    const rawName = item.drinkName || item.name || 'Boisson';
    const targetBarId = item.barId || order?.barId || BASE_BAR_ID;
    let matchedDrink = null;

    if (hasMenus) {
      const targetBar = menus.find(m => m.id === targetBarId);
      if (!targetBar) {
        // Le bar d'origine a été supprimé
        missingDrinks.push({ name: rawName, reason: 'bar_deleted' });
        return;
      }

      const barDrinks = (targetBar.categories || []).flatMap(c => c.drinks || []);

      // 1. Recherche par drinkId dans ce bar
      if (item.drinkId) {
        matchedDrink = barDrinks.find(d => d.id === item.drinkId);
      }
      // 2. Repli par nom normalisé dans ce bar
      if (!matchedDrink && rawName) {
        const normalizedTarget = normalizeText(rawName);
        matchedDrink = barDrinks.find(d => normalizeText(d.name) === normalizedTarget);
      }

      if (matchedDrink) {
        addedItems.push({
          drinkId: matchedDrink.id,
          drinkName: matchedDrink.name,
          price: matchedDrink.price,
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          barId: targetBar.id
        });
      } else {
        missingDrinks.push({ name: rawName, reason: 'not_on_menu' });
      }
    } else {
      // Repli mono-bar avec catégories fournies
      if (item.drinkId) {
        matchedDrink = fallbackDrinks.find(d => d.id === item.drinkId);
      }
      if (!matchedDrink && rawName) {
        const normalizedTarget = normalizeText(rawName);
        matchedDrink = fallbackDrinks.find(d => normalizeText(d.name) === normalizedTarget);
      }

      if (matchedDrink) {
        addedItems.push({
          drinkId: matchedDrink.id,
          drinkName: matchedDrink.name,
          price: matchedDrink.price,
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          barId: targetBarId
        });
      } else {
        missingDrinks.push({ name: rawName, reason: 'not_on_menu' });
      }
    }
  });

  // Si aucune boisson n'est disponible
  if (!addedItems.length) {
    missingDrinks.forEach(missing => {
      const msg = missing.reason === 'bar_deleted'
        ? `« ${missing.name} » n'est plus disponible (bar supprimé)`
        : `« ${missing.name} » n'est plus au menu, non ajoutée`;
      toast.warning(msg);
    });
    toast.error("Aucune boisson n'a pu être ajoutée", {
      description: "Les boissons de cette commande ne figurent plus au menu actuel."
    });
    return currentOrders;
  }

  // Fusion cumulative dans le panier existant (recherche par clé barId:drinkId)
  const newOrders = [...currentOrders];

  addedItems.forEach(itemToAdd => {
    const itemKeyToAdd = getOrderItemKey(itemToAdd);
    const existingIndex = newOrders.findIndex(o => getOrderItemKey(o) === itemKeyToAdd);
    if (existingIndex !== -1) {
      newOrders[existingIndex] = {
        ...newOrders[existingIndex],
        drinkName: itemToAdd.drinkName,
        price: itemToAdd.price,
        barId: itemToAdd.barId,
        quantity: newOrders[existingIndex].quantity + itemToAdd.quantity
      };
    } else {
      newOrders.push({
        drinkId: itemToAdd.drinkId,
        drinkName: itemToAdd.drinkName,
        price: itemToAdd.price,
        quantity: itemToAdd.quantity,
        barId: itemToAdd.barId,
        addedAt: new Date().toISOString()
      });
    }
  });

  if (typeof onOrdersUpdated === 'function') {
    onOrdersUpdated(newOrders);
  }

  // Gestion de la note lors de la recommandation
  const orderNoteTrimmed = typeof order?.note === 'string' ? order.note.trim() : '';
  const currentNoteTrimmed = typeof currentNote === 'string' ? currentNote.trim() : '';

  let noteReimported = false;
  let noteConflict = false;

  if (orderNoteTrimmed) {
    if (!currentNoteTrimmed) {
      // Panier sans note : réimport automatique
      if (typeof onNoteUpdated === 'function') {
        onNoteUpdated(orderNoteTrimmed);
      }
      noteReimported = true;
    } else {
      // Panier avec note déjà présente : conservation et notification
      noteConflict = true;
    }
  }

  // Notifications séquentielles pour éviter la superposition
  const totalDrinksAdded = addedItems.reduce((sum, i) => sum + i.quantity, 0);

  const showSuccessToast = () => {
    const desc = noteReimported
      ? `${totalDrinksAdded} boisson${totalDrinksAdded > 1 ? 's' : ''} ajoutée${totalDrinksAdded > 1 ? 's' : ''} • Note reprise : « ${orderNoteTrimmed} »`
      : `${totalDrinksAdded} boisson${totalDrinksAdded > 1 ? 's' : ''} (${addedItems.length} référence${addedItems.length > 1 ? 's' : ''}) ajoutée${totalDrinksAdded > 1 ? 's' : ''} au panier.`;

    toast.success("Commande ajoutée au panier", {
      description: desc,
      duration: 2000
    });

    if (noteConflict) {
      setTimeout(() => {
        toast.info("Note précédente non importée", {
          description: `Note de la tournée précédente : « ${orderNoteTrimmed} » non importée car une note existe déjà.`,
          duration: 2500
        });
      }, 2000);
    }
  };

  if (missingDrinks.length > 0) {
    // 1. Affichage prioritaire de la première notification d'avertissement
    missingDrinks.forEach((missing, idx) => {
      const msg = missing?.reason === 'bar_deleted'
        ? `« ${missing.name} » n'est plus disponible (bar supprimé)`
        : `« ${missing?.name || missing} » n'est plus au menu, non ajoutée`;
      setTimeout(() => {
        toast.warning(msg, { duration: 2000 });
      }, idx * 2000);
    });

    // 2. Déclenchement de la confirmation après disparition de l'avertissement
    setTimeout(showSuccessToast, missingDrinks.length * 2000);
  } else {
    showSuccessToast();
  }

  return newOrders;
}
