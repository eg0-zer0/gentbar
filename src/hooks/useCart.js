import { useMemo } from 'react';
import { toast } from 'sonner';
import { useStoredState } from './useStoredState';
import { normalizeOrders, normalizeString } from '../lib/storage';
import { BASE_BAR_ID } from '../lib/menus';

/**
 * Hook de gestion du panier de commande et de sa note libre.
 * Persiste automatiquement l'état dans localStorage.
 */
export const useCart = (activeBarId = BASE_BAR_ID) => {
  const [orders, setOrders] = useStoredState('orders', [], normalizeOrders);
  const [orderNote, setOrderNote] = useStoredState('orderNote', '', normalizeString);

  // Montant total du panier en cours
  const totalAmount = useMemo(() => {
    if (!Array.isArray(orders)) return 0;
    return orders.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  }, [orders]);

  // Nombre total de boissons dans le panier
  const totalItems = useMemo(() => {
    if (!Array.isArray(orders)) return 0;
    return orders.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [orders]);

  // Bars distincts présents dans le panier en cours (§ 4.6)
  const barsInCart = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return Array.from(new Set(orders.map((o) => o.barId || BASE_BAR_ID)));
  }, [orders]);

  const isMultiBarCart = barsInCart.length > 1;

  // Obtenir la quantité d'une boisson (optionnellement restreinte à un bar spécifique)
  const getItemQuantity = (drinkId, barId = activeBarId) => {
    if (!Array.isArray(orders) || !drinkId) return 0;
    const targetBarId = barId || BASE_BAR_ID;
    const item = orders.find(
      (o) => o.drinkId === drinkId && (o.barId || BASE_BAR_ID) === targetBarId
    );
    return item ? item.quantity : 0;
  };

  // Ajouter une boisson ou incrémenter sa quantité
  const addDrink = (drink, barId = activeBarId) => {
    if (!drink || !drink.id) return;
    const resolvedBarId = drink.barId || barId || BASE_BAR_ID;
    setOrders(prevOrders => {
      const list = Array.isArray(prevOrders) ? prevOrders : [];
      // Match strict par couple (drinkId, barId) pour isoler les articles de chaque bar (§ 4.6)
      const idx = list.findIndex(
        order => order.drinkId === drink.id && (order.barId || BASE_BAR_ID) === resolvedBarId
      );
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          drinkName: drink.name,
          price: drink.price,
          barId: updated[idx].barId || resolvedBarId,
          quantity: updated[idx].quantity + 1
        };
        return updated;
      }
      return [
        ...list,
        {
          drinkId: drink.id,
          drinkName: drink.name,
          price: drink.price,
          quantity: 1,
          barId: resolvedBarId,
          addedAt: new Date().toISOString()
        }
      ];
    });
  };

  // Modifier la quantité d'une boisson (avec barId optionnel pour ciblage exact)
  const updateQuantity = (drinkId, qty, barId = null) => {
    if (qty <= 0) {
      removeItem(drinkId, barId);
    } else {
      setOrders(prev =>
        (Array.isArray(prev) ? prev : []).map(item => {
          const matchBar = barId ? (item.barId || BASE_BAR_ID) === barId : true;
          return item.drinkId === drinkId && matchBar ? { ...item, quantity: qty } : item;
        })
      );
    }
  };

  // Retirer un article du panier (avec notification et ciblage barId)
  const removeItem = (drinkId, barId = null) => {
    setOrders(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const matchPredicate = item =>
        item.drinkId === drinkId && (barId ? (item.barId || BASE_BAR_ID) === barId : true);
      const exists = list.some(matchPredicate);
      if (exists) {
        toast("Article supprimé", { description: "L'article a été retiré du panier" });
      }
      return list.filter(item => !matchPredicate(item));
    });
  };

  // Retirer silencieusement une boisson du panier (ex: suppression de boisson au menu)
  const removeDrinkFromCart = (drinkId, barId = null) => {
    setOrders(prev =>
      (Array.isArray(prev)
        ? prev.filter(item => !(item.drinkId === drinkId && (barId ? (item.barId || BASE_BAR_ID) === barId : true)))
        : [])
    );
  };

  // Vider le panier et réinitialiser la note libre
  const clearCart = (notify = true) => {
    setOrders([]);
    setOrderNote('');
    if (notify) {
      toast("Panier vidé", { description: "Toutes les boissons ont été retirées du panier." });
    }
  };

  // Retirer les articles dont les identifiants ont été supprimés de la carte
  const removeItemsByDrinkIds = (drinkIdsSet) => {
    if (!drinkIdsSet || !(drinkIdsSet instanceof Set)) return;
    setOrders(prev => (Array.isArray(prev) ? prev.filter(item => !drinkIdsSet.has(item.drinkId)) : []));
  };

  // Mettre à jour le nom et le prix d'un article dans le panier suite à modification du menu
  const updateItemDetails = (drinkId, updatedName, updatedPrice) => {
    setOrders(prev => (Array.isArray(prev) ? prev : []).map(item =>
      item.drinkId === drinkId
        ? { ...item, drinkName: updatedName, price: updatedPrice }
        : item
    ));
  };

  return {
    orders,
    setOrders,
    orderNote,
    setOrderNote,
    totalAmount,
    totalItems,
    barsInCart,
    isMultiBarCart,
    getItemQuantity,
    addDrink,
    updateQuantity,
    removeItem,
    removeDrinkFromCart,
    clearCart,
    removeItemsByDrinkIds,
    updateItemDetails
  };
};

export default useCart;
