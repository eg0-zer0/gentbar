import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Ticket,
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
 * Vue Ticket (Stitch Officiel) : Prise de commande au bar en mode compact et haute lisibilité.
 * - Code couleur Stitch : jeton sémantique text-price pour prix, totaux et multiplicateurs.
 * - Groupement distinct par bar avec sous-totaux en text-price.
 * - Cases à cocher carrées Stitch, état barré en text-muted-foreground quand servi.
 * - En-tête Stitch : icône text-price, compteur 'X/Y servis' en text-price, Tout cocher, Cadenas, Fermer.
 * - Bas de page Stitch fidèle : 
 *     1) 'Total à régler' + montant en grand text-price,
 *     2) Grille 2 colonnes [Partager] [Recommander],
 *     3) Bouton pleine largeur [Fermer].
 */
const TicketView = ({
  order,
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

  // Regroupement par bar (multi-bars § 4.6 / modèle Stitch)
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

  const isComplete = totalDrinksCount > 0 && servedDrinksCount === totalDrinksCount;

  // Groupes de bars à afficher
  const displayGroups = useMemo(() => {
    if (grouped.groups && grouped.groups.length > 0) {
      return grouped.groups;
    }
    if (items.length > 0) {
      return [{
        barId: 'default',
        barName: 'GentBar',
        barIcon: '🍹',
        subtotal: totalAmount,
        items: items
      }];
    }
    return [];
  }, [grouped.groups, totalAmount, items]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground ${
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
      {/* 1. EN-TÊTE STITCH : Icône text-price, Ticket, X/Y servis en text-price, boutons d'action */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 pt-4 pb-3">
        <div className="max-w-[420px] mx-auto flex items-center justify-between gap-2">
          {/* Titre et statut verres servis (code couleur text-price) */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <Ticket className="w-5 h-5 text-price fill-price/20 flex-shrink-0" />
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Ticket
            </h1>
            <span className="text-xs font-semibold text-muted-foreground ml-1 whitespace-nowrap">
              <span className={isComplete ? 'text-emerald-500 font-bold' : 'text-price font-bold'}>
                {servedDrinksCount}/{totalDrinksCount}
              </span>
              {' '}servis
            </span>
          </div>

          {/* Actions : Tout cocher, Cadenas, Fermer */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button
              type="button"
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-lg border border-border transition-colors cursor-pointer active:scale-95"
              onClick={handleToggleAll}
              disabled={isLocked}
              aria-label={checkedIds.size === items.length && items.length > 0 ? "Tout décocher" : "Tout cocher"}
            >
              {checkedIds.size === items.length && items.length > 0 ? "Tout décocher" : "Tout cocher"}
            </button>

            {/* Bouton Cadenas (Verrouillage écran E-9) */}
            <button
              type="button"
              className={`p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLocked 
                  ? 'bg-price/20 text-price ring-1 ring-price/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
              onClick={handleToggleLock}
              aria-label={isLocked ? "Déverrouiller l'écran (ou double-tapez n'importe où)" : "Verrouiller l'écran"}
              title={isLocked ? "Déverrouiller l'écran" : "Verrouiller l'écran contre les appuis accidentels"}
            >
              {isLocked ? (
                <Lock className="w-5 h-5 text-price stroke-[2.2]" />
              ) : (
                <Unlock className="w-5 h-5 text-muted-foreground stroke-[2]" />
              )}
            </button>

            {/* Bouton Fermer croix */}
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isLocked}
              aria-label="Fermer le ticket"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CORPS DU TICKET (Groupes de bars, cases Stitch, textes text-price) */}
      <main className="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-w-[420px] w-full mx-auto pb-48">
        {/* Emplacement note libre (E-7) */}
        {order?.note ? (
          <div className="p-3 mb-1 rounded-xl bg-price/10 border border-price/25 text-foreground text-xs sm:text-sm flex items-start gap-2.5 shadow-sm">
            <StickyNote className="w-4 h-4 text-price flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-price">Note : </span>
              <span className="italic break-words text-card-foreground">{order.note}</span>
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucun article dans cette commande.
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayGroups.map((group) => (
              <section 
                key={group.barId} 
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
              >
                {/* En-tête de bar Stitch : nom à gauche, sous-total en text-price à droite */}
                <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-border">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{group.barIcon}</span>
                    <span className="text-sm font-semibold text-card-foreground tracking-wide">{group.barName}</span>
                    {group.isDeletedBar && (
                      <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">supprimé</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-price">{formatPrice(group.subtotal)}</span>
                </div>

                {/* Liste des boissons du bar */}
                <ul className="divide-y divide-border p-0 m-0 list-none">
                  {group.items.map((item, idx) => {
                    const key = getItemKey(item, idx);
                    const isChecked = isItemChecked(item, idx);
                    const itemName = item.drinkName || item.name;

                    return (
                      <li
                        key={key}
                        onClick={() => toggleItem(key)}
                        className={`px-3.5 py-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-secondary/30' : 'hover:bg-secondary/40'
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
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Case à cocher Stitch : carrée ou verte avec Check */}
                          <div 
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked 
                                ? 'bg-emerald-500 text-primary-foreground shadow-sm' 
                                : 'border border-border bg-background'
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>

                          {/* Multiplicateur : text-price, barré quand coché */}
                          <span className={`font-bold text-sm shrink-0 ${isChecked ? 'line-through text-muted-foreground' : 'text-price'}`}>
                            {item.quantity}×
                          </span>

                          {/* Nom de la boisson */}
                          <span className={`text-sm font-medium leading-tight break-words ${isChecked ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                            {itemName}
                          </span>
                        </div>

                        {/* Prix de la ligne */}
                        <span className={`text-sm font-medium shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* 3. BAS DE PAGE FIXE STITCH FIDÈLE : Total à régler en text-price + grille [Partager][Recommander] + [Fermer] */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border p-4 shadow-2xl" data-purpose="ticket-footer">
        <div className="max-w-[420px] mx-auto space-y-3">
          {/* Ligne 1 : 'Total à régler' à gauche + montant en grand text-price à droite */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-muted-foreground">Total à régler</span>
            <span className="text-2xl font-bold text-price tracking-tight">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Ligne 2 : Grille 2 colonnes [Partager] [Recommander] */}
          <div className={`grid ${onReorder ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <ShareButtons 
              order={order} 
              menus={menus}
              className="w-full py-2.5 px-3 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-secondary-foreground text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
              size="sm"
              disabled={isLocked}
            />

            {onReorder && (
              <button
                type="button"
                className="w-full py-2.5 px-3 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95"
                onClick={() => onReorder(order)}
                disabled={isLocked}
                aria-label="Recommander cette commande"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Recommander</span>
              </button>
            )}
          </div>

          {/* Ligne 3 : Bouton [Fermer] pleine largeur Stitch */}
          <button
            type="button"
            className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg flex items-center justify-center cursor-pointer border-0"
            onClick={onClose}
            disabled={isLocked}
            aria-label="Fermer le ticket"
          >
            Fermer
          </button>
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

      {/* Badge flottant discret placé au-dessus du bas de page à 3 étages (E-9) */}
      {isLocked && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md border transition-all duration-200 ${
            showUnlockHint 
              ? 'bg-price text-primary-foreground border-price scale-105 ring-2 ring-price/50' 
              : 'bg-card text-card-foreground border-border'
          }`}>
            <Lock className="w-3.5 h-3.5 text-price flex-shrink-0" />
            <span>{showUnlockHint ? "Double-tapez pour déverrouiller" : "Écran verrouillé"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketView;
