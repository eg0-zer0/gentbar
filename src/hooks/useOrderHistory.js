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
import { BASE_BAR_ID, withBarId } from '../lib/menus';

/**
 * Hook de gestion de l'historique des commandes et du score de popularité des boissons.
 * Prépare également le rattachement aux sessions du mode Soirée (sessionId, paidFromPot).
 */
export const useOrderHistory = (categories = [], activeBarId = BASE_BAR_ID) => {
  const [orderHistory, setOrderHistory] = useStoredState(
    'orderHistory',
    () => withBarId(mockOrderHistory, BASE_BAR_ID),
    normalizeOrderHistory
  );

  // Nettoyage des coches de tickets orphelines au montage
  useEffect(() => {
    purgeOrphanTicketCheckmarks(orderHistory);
  }, []);

  // Calcul mémoïsé de la popularité des boissons
  const drinkPopularity = useMemo(() => {
    const nameToId = new Map();
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        if (Array.isArray(c?.drinks)) {
          c.drinks.forEach(d => {
            if (d && d.name && !nameToId.has(d.name)) {
              nameToId.set(d.name, d.id);
            }
          });
        }
      });
    }

    const byId = {};
    if (Array.isArray(orderHistory)) {
      orderHistory.forEach(order => {
        if (Array.isArray(order?.items)) {
          order.items.forEach(item => {
            const id = item?.drinkId || (item?.drinkName && nameToId.get(item.drinkName));
            if (id) {
              byId[id] = (byId[id] || 0) + (item.quantity || 0);
            }
          });
        }
      });
    }
    return byId;
  }, [orderHistory, categories]);

  // Créer et enregistrer une nouvelle commande
  const createOrder = ({
    items = [],
    total = 0,
    note = '',
    barId = activeBarId,
    sessionId = null,
    paidFromPot = false,
    menus = []
  }) => {
    const trimmedNote = typeof note === 'string' ? note.trim() : '';
    const safeItems = Array.isArray(items) ? items : [];
    const resolvedBarId = barId || BASE_BAR_ID;
    const menusMap = new Map();
    if (Array.isArray(menus)) {
      menus.forEach(m => {
        if (m && m.id) menusMap.set(m.id, m);
      });
    }

    const newOrder = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      barId: resolvedBarId,
      items: safeItems.map(o => {
        const itemBarId = o.barId || resolvedBarId;
        const currentBar = menusMap.get(itemBarId);
        const barName =
          (typeof o.barName === 'string' && o.barName.trim()) ||
          currentBar?.name ||
          '';
        const barIcon =
          (typeof o.barIcon === 'string' && o.barIcon.trim()) ||
          currentBar?.icon ||
          '';

        return {
          drinkId: o.drinkId,
          drinkName: o.drinkName,
          quantity: o.quantity,
          price: o.price,
          barId: itemBarId,
          ...(barName ? { barName } : {}),
          ...(barIcon ? { barIcon } : {})
        };
      }),
      total,
      note: trimmedNote,
      ...(sessionId ? { sessionId, paidFromPot } : {})
    };

    setOrderHistory(prev => [newOrder, ...(Array.isArray(prev) ? prev : [])]);
    toast("Commande confirmée", { description: `Total : ${formatPrice(total)}` });
    return newOrder;
  };

  // Supprimer une commande de l'historique
  const removeOrder = (orderId) => {
    removeTicketCheckmarks(orderId);
    setOrderHistory(prev => (Array.isArray(prev) ? prev.filter(order => order.id !== orderId) : []));
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
