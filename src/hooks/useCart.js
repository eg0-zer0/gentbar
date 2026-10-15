import { useMemo } from 'react';
import { toast } from 'sonner';
import { useStoredState } from './useStoredState';
import { normalizeOrders } from '../lib/storage';

/**
 * Hook de gestion du panier de commande et de sa note libre.
 * Persiste automatiquement l'état dans localStorage.
 */
export const useCart = () => {
  const [orders, setOrders] = useStoredState('orders', [], normalizeOrders);
  const [orderNote, setOrderNote] = useStoredState('orderNote', '', (val) => typeof val === 'string' ? val : '');

  // Montant total du panier en cours
  const totalAmount = useMemo(() => {
    return orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [orders]);

  // Nombre total de boissons dans le panier
  const totalItems = useMemo(() => {
    return orders.reduce((sum, item) => sum + item.quantity, 0);
  }, [orders]);

  // Ajouter une boisson ou incrémenter sa quantité
  const addDrink = (drink) => {
    setOrders(prevOrders => {
      const idx = prevOrders.findIndex(order => order.drinkId === drink.id);
      if (idx >= 0) {
        const updated = [...prevOrders];
        updated[idx] = {
          ...updated[idx],
          drinkName: drink.name,
          price: drink.price,
          quantity: updated[idx].quantity + 1
        };
        return updated;
      }
      return [
        ...prevOrders,
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
      setOrders(prev => prev.map(item => item.drinkId === drinkId ? { ...item, quantity: qty } : item));
    }
  };

  // Retirer un article du panier
  const removeItem = (drinkId) => {
    setOrders(prev => prev.filter(item => item.drinkId !== drinkId));
    toast("Article supprimé", { description: "L'article a été retiré du panier" });
  };

  // Vider complètement le panier et réinitialiser la note
  const clearCart = () => {
    setOrders([]);
    setOrderNote('');
    toast("Panier vidé", { description: "Toutes les boissons ont été retirées du panier." });
  };

  // Retirer les articles dont les identifiants ont été supprimés de la carte
  const removeItemsByDrinkIds = (drinkIdsSet) => {
    setOrders(prev => prev.filter(item => !drinkIdsSet.has(item.drinkId)));
  };

  // Mettre à jour le nom et le prix d'un article dans le panier suite à modification du menu
  const updateItemDetails = (drinkId, updatedName, updatedPrice) => {
    setOrders(prev => prev.map(item =>
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
    clearCart,
    removeItemsByDrinkIds,
    updateItemDetails
  };
};

export default useCart;
