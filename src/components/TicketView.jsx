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
 * Vue Ticket (Stitch) : Prise de commande au bar en mode compact et haute lisibilité.
 * - Groupement distinct par bar avec sous-totaux.
 * - Checkboxes carrées, multiplicateurs roses (2×, 1×), noms complets et prix unitaires.
 * - En-tête Stitch avec compteur de verres servis, bouton Tout cocher, cadenas et fermeture.
 * - Footer fixé avec TOTAL à gauche et actions empilées à droite (Partager, Recommander, Fermer).
 * - Mémorisation des cases cochées par commande et verrouillage anti-fausses touches.
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
      className={`fixed inset-0 z-[100] flex flex-col bg-[#06122c] text-white selection:bg-rose-600 selection:text-white ${
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
      {/* 1. EN-TÊTE FIXE STITCH */}
      <header className="sticky top-0 z-40 bg-[#06122c]/95 backdrop-blur border-b border-[#142343] px-3.5 sm:px-4 py-3">
        <div className="max-w-[420px] mx-auto flex items-center justify-between gap-2">
          {/* Titre et statut verres servis */}
          <div className="flex items-center gap-2 min-w-0">
            <Ticket className="w-5 h-5 text-[#e11d48] flex-shrink-0" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Ticket
            </h1>
            <span className="text-xs font-semibold text-slate-300 ml-0.5 whitespace-nowrap">
              <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-[#e11d48] font-bold'}>
                {servedDrinksCount}/{totalDrinksCount}
              </span>
              {' '}servis
            </span>
          </div>

          {/* Boutons d'action en-tête : Tout cocher, Cadenas, Fermer */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="px-3 py-1.5 bg-[#172545] hover:bg-[#1e3056] text-slate-200 text-xs font-semibold rounded-lg border border-[#23355b] transition-colors cursor-pointer active:scale-95"
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
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={handleToggleLock}
              aria-label={isLocked ? "Déverrouiller l'écran (ou double-tapez n'importe où)" : "Verrouiller l'écran"}
              title={isLocked ? "Déverrouiller l'écran" : "Verrouiller l'écran contre les appuis accidentels"}
            >
              {isLocked ? (
                <Lock className="w-5 h-5 text-amber-400 stroke-[2.2]" />
              ) : (
                <Unlock className="w-5 h-5 text-slate-400 stroke-[2]" />
              )}
            </button>

            {/* Bouton de fermeture rapide */}
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isLocked}
              aria-label="Fermer le ticket"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CORPS DU TICKET (Groupes de bars, cases à cocher Stitch, note) */}
      <main className="flex-1 max-w-[420px] w-full mx-auto px-3.5 sm:px-4 py-3.5 space-y-3.5 pb-28">
        {/* Emplacement note libre (E-7) */}
        {order?.note ? (
          <div className="p-3 mb-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm">
            <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-amber-300">Note : </span>
              <span className="italic break-words text-slate-200">{order.note}</span>
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Aucun article dans cette commande.
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayGroups.map((group) => (
              <section 
                key={group.barId} 
                className="bg-[#0b162f] rounded-xl border border-[#1b2b4e] overflow-hidden shadow-sm"
              >
                {/* En-tête de bar */}
                <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-[#152341] bg-[#0c1833]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{group.barIcon}</span>
                    <span className="text-sm font-semibold text-white tracking-wide">{group.barName}</span>
                    {group.isDeletedBar && (
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">supprimé</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#e11d48]">{formatPrice(group.subtotal)}</span>
                </div>

                {/* Liste des boissons du bar */}
                <ul className="divide-y divide-[#152341] p-0 m-0 list-none">
                  {group.items.map((item, idx) => {
                    const key = getItemKey(item, idx);
                    const isChecked = isItemChecked(item, idx);
                    const itemName = item.drinkName || item.name;

                    return (
                      <li
                        key={key}
                        onClick={() => toggleItem(key)}
                        className={`px-3.5 py-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-[#0e1c39]/40' : 'hover:bg-[#101e3d]/50'
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
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Case à cocher Stitch */}
                          <div 
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              isChecked 
                                ? 'bg-[#22c55e] border border-[#22c55e] text-white shadow-sm' 
                                : 'border border-[#2e416a] bg-[#0c1936]'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                          </div>

                          {/* Quantité rose : 2× ou 1× */}
                          <span className={`text-sm font-bold shrink-0 ${isChecked ? 'line-through text-slate-500' : 'text-[#e11d48]'}`}>
                            {item.quantity}×
                          </span>

                          {/* Nom complet de la boisson */}
                          <span className={`text-sm font-medium leading-tight break-words ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                            {itemName}
                          </span>
                        </div>

                        {/* Prix de la ligne */}
                        <span className={`text-sm font-medium shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through text-slate-500' : 'text-white'}`}>
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

      {/* 3. BARRE INFÉRIEURE FIXE STITCH (TOTAL + PARTAGER / RECOMMANDER / FERMER) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#06122c]/95 backdrop-blur border-t border-[#142343] px-3.5 sm:px-4 py-3 shadow-[0_-8px_30px_rgba(2,13,39,0.85)]">
        <div className="max-w-[420px] mx-auto flex items-center justify-between gap-3">
          {/* TOTAL à gauche */}
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">TOTAL</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Actions à droite : Partager en haut, Recommander + Fermer en bas */}
          <div className="flex flex-col gap-2 shrink-0 min-w-[170px] sm:min-w-[190px]">
            {/* Ligne 1 : Bouton Partager */}
            <ShareButtons 
              order={order} 
              menus={menus}
              isCurrentOrder={false} 
              className="w-full h-8 px-3 bg-[#172545] hover:bg-[#1e3056] border-[#23355b] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              size="sm"
              disabled={isLocked}
            />

            {/* Ligne 2 : Recommander + Fermer */}
            <div className="flex items-center gap-2">
              {onReorder && (
                <button
                  type="button"
                  className="flex-1 h-8 px-2.5 bg-[#172545] hover:bg-[#1e3056] border border-[#23355b] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  onClick={() => onReorder(order)}
                  disabled={isLocked}
                  aria-label="Recommander cette commande"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Recommander</span>
                </button>
              )}
              <button
                type="button"
                className={`h-8 px-3.5 bg-[#e11d48] hover:bg-[#f43f5e] text-white font-bold text-xs rounded-xl shadow-md shadow-rose-950/30 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${onReorder ? 'min-w-[65px]' : 'w-full'}`}
                onClick={onClose}
                disabled={isLocked}
                aria-label="Fermer la vue ticket"
              >
                Fermer
              </button>
            </div>
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md border transition-all duration-200 ${
            showUnlockHint 
              ? 'bg-amber-600 text-white border-amber-500 scale-105 ring-2 ring-amber-400/50' 
              : 'bg-[#0e1b35] text-white border-[#23355b]'
          }`}>
            <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{showUnlockHint ? "Double-tapez pour déverrouiller" : "Écran verrouillé"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketView;
