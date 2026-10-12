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
 * - Conçu pour tenir entièrement sur un seul écran de smartphone (montrer au barman dans le bruit).
 * - Noms de boissons complets sans coupure (...).
 * - Groupement ordonné par famille (ordre du menu) sans bandeaux de catégories superflus.
 * - Mémorisation des cases cochées par commande.
 * - Fermeture explicite ramenant à l'écran d'origine.
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

  // Liste ordonnée selon les familles du menu (bières fût, bouteilles, vins, softs...)
  // sans nommer expressément les catégories (évite les gros cadres et le gaspillage d'espace)
  const orderedItems = useMemo(() => {
    const list = [];
    const assignedIndices = new Set();

    categories.forEach(category => {
      const categoryDrinks = category.drinks || [];
      items.forEach((item, index) => {
        const itemName = item.drinkName || item.name;
        const matches = categoryDrinks.some(
          d => d.id === item.drinkId || d.name.toLowerCase() === (itemName || '').toLowerCase()
        );

        if (matches && !assignedIndices.has(index)) {
          list.push({ item, originalIndex: index, categoryId: category.id });
          assignedIndices.add(index);
        }
      });
    });

    // Boissons personnalisées ou orphelines
    items.forEach((item, index) => {
      if (!assignedIndices.has(index)) {
        list.push({ item, originalIndex: index, categoryId: 'other' });
      }
    });

    return list;
  }, [categories, items]);

  const isComplete = totalDrinksCount > 0 && servedDrinksCount === totalDrinksCount;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      {/* En-tête compact sans coupure de titre */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border shadow-sm px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Titre et date */}
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
              Ticket
            </h1>
            {order?.date && (
              <span className="text-xs text-muted-foreground whitespace-nowrap truncate">
                • {formatDate(order.date)}
              </span>
            )}
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

      {/* Corps du ticket : liste épurée type ticket de caisse, condensée pour tenir sur un écran */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 sm:px-4 py-3 space-y-1.5 pb-24">
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
          <ul className="divide-y divide-border/60 bg-card border border-border rounded-xl shadow-sm overflow-hidden p-0 m-0 list-none">
            {orderedItems.map(({ item, originalIndex, categoryId }, idx) => {
              const key = item.drinkId || `${item.drinkName || item.name}-${originalIndex}`;
              const isChecked = checkedIds.has(key);
              const itemName = item.drinkName || item.name;
              
              // Séparation discrète entre deux familles de boissons différentes
              const prevItem = orderedItems[idx - 1];
              const isNewGroup = prevItem && prevItem.categoryId !== categoryId;

              return (
                <React.Fragment key={key}>
                  {isNewGroup && (
                    <li className="h-[1px] bg-border/80 border-t border-border/80 my-0 list-none" aria-hidden="true" />
                  )}
                  <li
                    onClick={() => toggleItem(key)}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${
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

                      {/* Nom de la boisson EN ENTIER (sans troncature ni '...') */}
                      <span className={`text-base font-semibold leading-tight break-words ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {itemName}
                      </span>
                    </div>

                    {/* Prix unitaire ou total de la ligne */}
                    <span className={`text-sm font-semibold flex-shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through opacity-70' : 'text-foreground'}`}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
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
