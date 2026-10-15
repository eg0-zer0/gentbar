import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useStoredState } from './useStoredState';
import { mockOrderHistory } from '../mock';
import {
  normalizeOrderHistory,
  removeTicketCheckmarks,
  purgeOrphanTicketCheckmarks
} from '../lib/storage';
import { formatPrice } from '../lib/format';

/**
 * Hook de gestion de l'historique des commandes et du score de popularité des boissons.
 * Prépare également le rattachement aux sessions du mode Soirée (sessionId, paidFromPot).
 */
export const useOrderHistory = (categories = []) => {
  const [orderHistory, setOrderHistory] = useStoredState(
    'orderHistory',
    mockOrderHistory,
    normalizeOrderHistory
  );

  // Nettoyage des coches de tickets orphelines au montage
  useEffect(() => {
    purgeOrphanTicketCheckmarks(orderHistory);
  }, []);

  // Calcul mémoïsé de la popularité des boissons
  const drinkPopularity = useMemo(() => {
    const nameToId = new Map();
    categories.forEach(c => {
      c.drinks.forEach(d => {
        if (!nameToId.has(d.name)) {
          nameToId.set(d.name, d.id);
        }
      });
    });

    const byId = {};
    orderHistory.forEach(order => {
      order.items?.forEach(item => {
        const id = item.drinkId || nameToId.get(item.drinkName);
        if (id) {
          byId[id] = (byId[id] || 0) + item.quantity;
        }
      });
    });
    return byId;
  }, [orderHistory, categories]);

  // Créer et enregistrer une nouvelle commande
  const createOrder = ({ items, total, note = '', sessionId = null, paidFromPot = false }) => {
    const trimmedNote = typeof note === 'string' ? note.trim() : '';
    const newOrder = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: items.map(o => ({
        drinkId: o.drinkId,
        drinkName: o.drinkName,
        quantity: o.quantity,
        price: o.price
      })),
      total,
      note: trimmedNote,
      ...(sessionId ? { sessionId, paidFromPot } : {})
    };

    setOrderHistory(prev => [newOrder, ...prev]);
    toast("Commande confirmée", { description: `Total : ${formatPrice(total)}` });
    return newOrder;
  };

  // Supprimer une commande de l'historique
  const removeOrder = (orderId) => {
    removeTicketCheckmarks(orderId);
    setOrderHistory(prev => prev.filter(order => order.id !== orderId));
  };

  return {
    orderHistory,
    setOrderHistory,
    drinkPopularity,
    createOrder,
    removeOrder
  };
};

export default useOrderHistory;
