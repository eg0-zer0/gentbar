import { useMemo } from 'react';
import { toast } from 'sonner';
import { useStoredState } from './useStoredState';
import { normalizeOrders, normalizeString } from '../lib/storage';

/**
 * Hook de gestion du panier de commande et de sa note libre.
 * Persiste automatiquement l'état dans localStorage.
 */
export const useCart = () => {
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

  // Ajouter une boisson ou incrémenter sa quantité
  const addDrink = (drink) => {
    if (!drink || !drink.id) return;
    setOrders(prevOrders => {
      const list = Array.isArray(prevOrders) ? prevOrders : [];
      const idx = list.findIndex(order => order.drinkId === drink.id);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          drinkName: drink.name,
          price: drink.price,
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
          addedAt: new Date().toISOString()
        }
      ];
    });
  };

  // Modifier la quantité d'une boisson
  const updateQuantity = (drinkId, qty) => {
    if (qty <= 0) {
      removeItem(drinkId);
    } else {
      setOrders(prev => (Array.isArray(prev) ? prev : []).map(item => item.drinkId === drinkId ? { ...item, quantity: qty } : item));
    }
  };

  // Retirer un article du panier (avec notification)
  const removeItem = (drinkId) => {
    setOrders(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(item => item.drinkId === drinkId);
      if (exists) {
        toast("Article supprimé", { description: "L'article a été retiré du panier" });
      }
      return list.filter(item => item.drinkId !== drinkId);
    });
  };

  // Retirer silencieusement une boisson du panier (ex: suppression de boisson au menu)
  const removeDrinkFromCart = (drinkId) => {
    setOrders(prev => (Array.isArray(prev) ? prev.filter(item => item.drinkId !== drinkId) : []));
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
