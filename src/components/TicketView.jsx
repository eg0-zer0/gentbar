import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { 
  X, 
  Check, 
  RotateCcw, 
  Receipt
} from 'lucide-react';
import { formatPrice } from '../lib/format';
import ShareButtons from './ShareButtons';

/**
 * Vue Ticket (E-4) : Prise de commande au bar en mode compact et lisible.
 * - Groupement distinct par catégorie de boissons (démarcation claire pour le barman).
 * - Noms de boissons complets sans coupure.
 * - Mémorisation des cases cochées par commande.
 * - Fermeture explicite ramenant à l'écran d'origine (historique ou menu).
 */
const TicketView = ({
  order,
  categories = [],
  onClose,
  onReorder
}) => {
  // Clé de persistance des coches par commande
  const storageKey = useMemo(() => {
    return order?.id ? `gentbar_ticket_checked_${order.id}` : null;
  }, [order?.id]);

  // Initialisation des coches depuis le stockage ou ensemble vide
  const [checkedIds, setCheckedIds] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // En cas d'erreur de lecture localStorage, repli sur ensemble vide
      }
    }
    return new Set();
  });

  // Normalisation des articles
  const items = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order)) return order;
    if (Array.isArray(order.orders)) return order.orders;
    return [];
  }, [order]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    if (order && typeof order.total === 'number') return order.total;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [order, items]);

  // Nombre total de verres
  const totalDrinksCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  // Nombre de verres servis
  const servedDrinksCount = useMemo(() => {
    return items.reduce((sum, item, idx) => {
      const key = item.drinkId || `${item.drinkName || item.name}-${idx}`;
      return checkedIds.has(key) ? sum + (item.quantity || 1) : sum;
    }, 0);
  }, [items, checkedIds]);

  // Bascule coche d'une boisson et sauvegarde
  const toggleItem = (key) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {}
      }
      return next;
    });
  };

  // Cocher / Décocher tout et sauvegarde
  const handleToggleAll = () => {
    if (checkedIds.size === items.length) {
      const emptySet = new Set();
      setCheckedIds(emptySet);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
    } else {
      const allKeys = items.map((item, idx) => item.drinkId || `${item.drinkName || item.name}-${idx}`);
      const fullSet = new Set(allKeys);
      setCheckedIds(fullSet);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...fullSet]));
        } catch {}
      }
    }
  };

  // Groupement par catégorie avec ordre du menu officiel (démarcation nette et compacte)
  const categoryGroups = useMemo(() => {
    const groups = [];
    const assignedIndices = new Set();

    categories.forEach(category => {
      const categoryDrinks = category.drinks || [];
      const matchingItems = [];

      items.forEach((item, index) => {
        const itemName = item.drinkName || item.name;
        const matches = categoryDrinks.some(
          d => d.id === item.drinkId || d.name.toLowerCase() === (itemName || '').toLowerCase()
        );

        if (matches && !assignedIndices.has(index)) {
          matchingItems.push({ item, originalIndex: index });
          assignedIndices.add(index);
        }
      });

      if (matchingItems.length > 0) {
        groups.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          items: matchingItems
        });
      }
    });

    // Boissons personnalisées ou orphelines
    const orphanItems = items
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(({ originalIndex }) => !assignedIndices.has(originalIndex));

    if (orphanItems.length > 0) {
      groups.push({
        id: 'other',
        name: 'Autres boissons',
        icon: '🍹',
        items: orphanItems
      });
    }

    return groups;
  }, [categories, items]);

  const isComplete = totalDrinksCount > 0 && servedDrinksCount === totalDrinksCount;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticket de commande"
    >
      {/* En-tête compact sans date/heure superflue */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border shadow-sm px-3 sm:px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Titre */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-foreground">
              Ticket
            </h1>
          </div>

          {/* Compteur et boutons d'action rapide */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
              <span className={isComplete ? 'text-green-500 font-bold' : 'text-primary font-bold'}>
                {servedDrinksCount}/{totalDrinksCount}
              </span>
              {' '}servis
            </span>

            <Button
              variant="outline"
              size="sm"
              className="btn-outline text-xs h-7 px-2"
              onClick={handleToggleAll}
              aria-label={checkedIds.size === items.length ? "Tout décocher" : "Tout cocher"}
            >
              {checkedIds.size === items.length ? "Décocher" : "Tout cocher"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"
              onClick={onClose}
              aria-label="Fermer le ticket"
            >
              <X className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Corps du ticket : groupement net par catégorie de boissons */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 sm:px-4 py-3 space-y-3 pb-24">
        {/* Emplacement note libre (E-7) */}
        {order?.note ? (
          <div className="p-2.5 mb-2 rounded-lg bg-accent/15 border border-accent/30 text-foreground text-xs sm:text-sm">
            <span className="font-semibold text-accent">Note : </span>
            <span>{order.note}</span>
          </div>
        ) : (
          <div id="ticket-note-container" className="hidden" aria-hidden="true" />
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun article dans cette commande.
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryGroups.map((group) => (
              <div 
                key={group.id} 
                className="bg-card border-2 border-border/80 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Liste des verres de cette catégorie avec démarcation nette entre blocs */}
                <ul className="divide-y divide-border/60 p-0 m-0 list-none">
                    {group.items.map(({ item, originalIndex }) => {
                      const key = item.drinkId || `${item.drinkName || item.name}-${originalIndex}`;
                      const isChecked = checkedIds.has(key);
                      const itemName = item.drinkName || item.name;

                      return (
                        <li
                          key={key}
                          onClick={() => toggleItem(key)}
                          className={`flex items-center justify-between gap-2.5 px-3 py-2 cursor-pointer select-none transition-colors ${
                            isChecked 
                              ? 'bg-muted/40 text-muted-foreground' 
                              : 'bg-card hover:bg-accent/10 text-foreground'
                          }`}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleItem(key);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Case à cocher carrée */}
                            <div 
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked 
                                  ? 'bg-green-600 border-green-600 text-white' 
                                  : 'border-muted-foreground/60 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {/* Quantité bien lisible */}
                            <span className={`text-lg font-bold min-w-[2rem] flex-shrink-0 ${isChecked ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                              {item.quantity}×
                            </span>

                            {/* Nom de la boisson EN ENTIER (sans coupure) */}
                            <span className={`text-base font-semibold leading-tight break-words ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {itemName}
                            </span>
                          </div>

                          {/* Prix */}
                          <span className={`text-sm font-semibold flex-shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through opacity-70' : 'text-foreground'}`}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Barre inférieure fixe (Total + Actions responsives sans chevauchement) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border shadow-lg px-3 sm:px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Total bien visible */}
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">TOTAL</span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Actions : Partager, Recommander, Fermer sans chevauchement */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <ShareButtons 
              order={order} 
              isCurrentOrder={false} 
              className="w-auto h-8 px-2.5 text-xs"
              size="sm"
            />

            {onReorder && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline flex items-center gap-1 text-xs h-8 px-2.5"
                onClick={() => onReorder(order)}
                aria-label="Recommander cette commande"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommander</span>
              </Button>
            )}

            <Button
              size="sm"
              className="btn-primary font-semibold text-xs h-8 px-3"
              onClick={onClose}
              aria-label="Fermer la vue ticket"
            >
              Fermer
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TicketView;
