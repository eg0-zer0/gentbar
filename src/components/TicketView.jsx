import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { 
  X, 
  Check, 
  RotateCcw, 
  Receipt,
  Lock,
  Unlock,
  StickyNote
} from 'lucide-react';
import { formatPrice } from '../lib/format';
import { load, save, remove } from '../lib/storage';
import ShareButtons from './ShareButtons';
import useTicketLock from '../hooks/useTicketLock';
import { groupOrderItemsByBar, getOrderItemKey } from '../lib/menus';

/**
 * Vue Ticket (E-4) : Prise de commande au bar en mode compact et lisible.
 * - Groupement distinct par catégorie de boissons (ou par bar si commande multi-bars).
 * - Noms de boissons complets sans coupure.
 * - Mémorisation des cases cochées par commande.
 * - Fermeture explicite ramenant à l'écran d'origine (historique ou menu).
 */
const TicketView = ({
  order,
  categories = [],
  menus = [],
  onClose,
  onReorder
}) => {
  // Clé de persistance des coches par commande
  const storageKey = useMemo(() => {
    return order?.id ? `gentbar_ticket_checked_${order.id}` : null;
  }, [order?.id]);

  // Initialisation des coches depuis le stockage ou ensemble vide
  const [checkedIds, setCheckedIds] = useState(() => {
    if (storageKey) {
      const saved = load(storageKey, null);
      if (Array.isArray(saved)) return new Set(saved);
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

  // Regroupement par bar (multi-bars § 4.6)
  const grouped = useMemo(() => groupOrderItemsByBar(items, menus), [items, menus]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    if (order && typeof order.total === 'number') return order.total;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [order, items]);

  // Helper pour la clé unique d'une boisson et la vérification des coches
  const getItemKey = (item, idx) => getOrderItemKey(item) || item.drinkId || `${item.drinkName || item.name}-${idx}`;
  const isItemChecked = (item, idx) => {
    const key = getItemKey(item, idx);
    return checkedIds.has(key) || (item?.drinkId ? checkedIds.has(item.drinkId) : false);
  };

  // Nombre total de verres
  const totalDrinksCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  // Nombre de verres servis
  const servedDrinksCount = useMemo(() => {
    return items.reduce((sum, item, idx) => {
      return isItemChecked(item, idx) ? sum + (item.quantity || 1) : sum;
    }, 0);
  }, [items, checkedIds]);

  // État et interactions de verrouillage de l'écran (E-9)
  const { isLocked, setIsLocked, showUnlockHint, toggleLock: handleToggleLock, handleLockTap } = useTicketLock();

  // Bascule coche d'une boisson et sauvegarde
  const toggleItem = (key) => {
    if (isLocked) return;
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (storageKey) {
        save(storageKey, [...next]);
      }
      return next;
    });
  };

  // Cocher / Décocher tout et sauvegarde
  const handleToggleAll = () => {
    if (isLocked) return;
    const allChecked = items.length > 0 && items.every((item, idx) => isItemChecked(item, idx));
    if (allChecked) {
      const emptySet = new Set();
      setCheckedIds(emptySet);
      if (storageKey) {
        remove(storageKey);
      }
    } else {
      const allKeys = items.map((item, idx) => getItemKey(item, idx));
      const fullSet = new Set(allKeys);
      setCheckedIds(fullSet);
      if (storageKey) {
        save(storageKey, [...fullSet]);
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
      className={`fixed inset-0 z-[100] flex flex-col bg-background text-foreground ${
        isLocked 
          ? 'overflow-hidden overscroll-none touch-none select-none' 
          : 'overflow-y-auto'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        touchAction: isLocked ? 'none' : 'auto',
        overscrollBehavior: isLocked ? 'none' : 'auto'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticket de commande"
    >
      {/* En-tête compact avec bouton de verrouillage (E-9) */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-sm px-3 sm:px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Titre */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-foreground">
              Ticket
            </h1>
          </div>

          {/* Compteur et boutons d'action rapide */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
              disabled={isLocked}
              aria-label={checkedIds.size === items.length ? "Tout décocher" : "Tout cocher"}
            >
              {checkedIds.size === items.length ? "Décocher" : "Tout cocher"}
            </Button>

            {/* Bouton Cadenas (E-9 Verrouillage écran) */}
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                isLocked 
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 ring-1 ring-amber-500/50' 
                  : 'text-foreground hover:bg-accent'
              }`}
              onClick={handleToggleLock}
              aria-label={isLocked ? "Déverrouiller l'écran (ou double-tapez n'importe où)" : "Verrouiller l'écran"}
              title={isLocked ? "Déverrouiller l'écran" : "Verrouiller l'écran contre les appuis accidentels"}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Unlock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"
              onClick={onClose}
              disabled={isLocked}
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
          <div className="p-2.5 mb-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-foreground text-xs sm:text-sm flex items-start gap-2 shadow-sm">
            <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-amber-700 dark:text-amber-300">Note barman : </span>
              <span className="italic break-words">{order.note}</span>
            </div>
          </div>
        ) : null}

        {/* Avertissement bar supprimé en commande mono-bar */}
        {!grouped.isMultiBar && grouped.groups[0]?.isDeletedBar && (
          <div className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-1.5">
            <span>{grouped.groups[0].barIcon}</span>
            <span className="font-semibold">{grouped.groups[0].barName}</span>
            <span className="text-[10px] bg-destructive/20 px-1.5 py-0.5 rounded font-medium">bar supprimé</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun article dans cette commande.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.isMultiBar ? (
              grouped.groups.map((group) => (
                <div 
                  key={group.barId} 
                  className="bg-card border-2 border-border/80 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/70 text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span>{group.barIcon}</span>
                      <span>{group.barName}</span>
                      {group.isDeletedBar && (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">supprimé</span>
                      )}
                    </span>
                    <span className="text-primary font-bold">{formatPrice(group.subtotal)}</span>
                  </div>

                  <ul className="divide-y divide-border/60 p-0 m-0 list-none">
                    {group.items.map((item, originalIndex) => {
                      const key = getItemKey(item, originalIndex);
                      const isChecked = isItemChecked(item, originalIndex);
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
                            <div 
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked 
                                  ? 'bg-green-600 border-green-600 text-white' 
                                  : 'border-muted-foreground/60 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <span className={`text-lg font-bold min-w-[2rem] flex-shrink-0 ${isChecked ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                              {item.quantity}×
                            </span>

                            <span className={`text-base font-semibold leading-tight break-words ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {itemName}
                            </span>
                          </div>

                          <span className={`text-sm font-semibold flex-shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through opacity-70' : 'text-foreground'}`}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            ) : (
              categoryGroups.map((group) => (
              <div 
                key={group.id} 
                className="bg-card border-2 border-border/80 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Liste des verres de cette catégorie avec démarcation nette entre blocs */}
                <ul className="divide-y divide-border/60 p-0 m-0 list-none">
                    {group.items.map(({ item, originalIndex }) => {
                      const key = getItemKey(item, originalIndex);
                      const isChecked = isItemChecked(item, originalIndex);
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
              ))
            )}
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
              menus={menus}
              isCurrentOrder={false} 
              className="w-auto h-8 px-2.5 text-xs"
              size="sm"
              disabled={isLocked}
            />

            {onReorder && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline flex items-center gap-1 text-xs h-8 px-2.5"
                onClick={() => onReorder(order)}
                disabled={isLocked}
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
              disabled={isLocked}
              aria-label="Fermer la vue ticket"
            >
              Fermer
            </Button>
          </div>
        </div>
      </footer>

      {/* Calque protecteur couvrant l'écran quand verrouillé (E-9) */}
      {isLocked && (
        <div 
          onClick={handleLockTap}
          className="fixed inset-0 z-35 bg-black/[0.06] dark:bg-black/25 cursor-pointer select-none transition-colors touch-none overscroll-none"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'none'
          }}
          role="button"
          tabIndex={0}
          aria-label="Écran verrouillé. Double-tapez n'importe où pour déverrouiller"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsLocked(false);
            }
          }}
        />
      )}

      {/* Badge flottant discret rappelant l'état verrouillé (E-9) */}
      {isLocked && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md border transition-all duration-200 ${
            showUnlockHint 
              ? 'bg-amber-600 text-white border-amber-500 scale-105 ring-2 ring-amber-400/50' 
              : 'bg-background/95 text-foreground border-border/80'
          }`}>
            <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{showUnlockHint ? "Double-tapez pour déverrouiller" : "Écran verrouillé"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketView;
