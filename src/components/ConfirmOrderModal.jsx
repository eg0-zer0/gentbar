import React, { useState, useMemo } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2, Minus, Plus, StickyNote, Check, X } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { toast } from 'sonner';
import { formatPrice } from '../lib/format';
import { groupOrderItemsByBar, getOrderItemKey } from '../lib/menus';

const ConfirmOrderModal = ({
  isOpen,
  onClose,
  orders,
  menus = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onConfirm,
  note = '',
  onNoteChange
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const grouped = useMemo(() => groupOrderItemsByBar(orders, menus), [orders, menus]);
  const totalAmount = grouped.totalAmount;
  const totalItems = grouped.totalItems;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] mx-auto rounded-2xl p-0 overflow-hidden bg-[#0e1b35] text-[#d9e2ff] border border-white/10 shadow-[0_12px_40px_rgba(2,13,39,0.85)] flex flex-col [&>button.absolute]:hidden">
        {/* EN-TÊTE FIXE STITCH AVEC CROIX BIEN PLACÉE */}
        <div className="shrink-0 pt-3 pb-2.5 px-4 sm:px-5 flex flex-col border-b border-white/10 bg-[#0e1b35]">
          <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto mb-2.5"></div>
          <div className="w-full flex items-start justify-between">
            <div className="flex flex-col text-left">
              <DialogTitle className="font-bold text-base sm:text-lg text-white leading-tight">
                Vérifiez votre commande
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                <span>{totalItems} article{totalItems > 1 ? 's' : ''} dans votre commande</span>
              </DialogDescription>
            </div>
            {/* Bouton de fermeture stylisé Stitch */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#16274a] text-slate-400 hover:text-white hover:bg-[#1e345e] transition-colors flex items-center justify-center active:scale-95 border border-white/10 cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* CORPS DÉFILABLE INTERNE (ne dépasse jamais de l'écran) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-3.5">
          {/* LISTE DES BOISSONS */}
          {grouped.isMultiBar ? (
            <div className="space-y-3">
              {grouped.groups.map((group) => (
                <div key={group.barId} className="rounded-xl border border-white/10 bg-[#06122c]/60 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#16274a]/80 border-b border-white/10 text-xs font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      <span>{group.barIcon}</span>
                      <span>{group.barName}</span>
                      {group.isDeletedBar && (
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">supprimé</span>
                      )}
                    </span>
                    <span className="text-[#f59e0b] font-bold">{formatPrice(group.subtotal)}</span>
                  </div>
                  <div className="divide-y divide-white/5 p-1.5 space-y-1">
                    {group.items.map((order) => {
                      const itemKey = getOrderItemKey(order);
                      const lineTotal = order.price * order.quantity;
                      return (
                        <article key={itemKey} className="p-2.5 rounded-xl bg-[#16274a]/40 border border-white/5 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0 pr-1 text-left">
                            <h3 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">{order.drinkName}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">{formatPrice(order.price)} / unité</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-[#06122c] border border-white/10 rounded-xl p-0.5 shadow-inner">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                                className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#1e345e] text-slate-200 flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                aria-label="Diminuer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs sm:text-sm font-bold text-white">{order.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                                className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#e11d48] hover:text-white text-slate-200 flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                aria-label="Augmenter"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-right min-w-[50px]">
                              <span className="text-xs sm:text-sm font-bold text-[#f59e0b] tracking-tight block">{formatPrice(lineTotal)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(order)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors flex items-center justify-center active:scale-90 cursor-pointer"
                              aria-label={`Supprimer ${order.drinkName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {orders.map((order) => {
                const itemKey = getOrderItemKey(order);
                const lineTotal = order.price * order.quantity;
                return (
                  <article key={itemKey} className="p-2.5 rounded-xl bg-[#16274a]/60 border border-white/10 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1 text-left">
                      <h3 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">{order.drinkName}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatPrice(order.price)} / unité</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-[#06122c] border border-white/10 rounded-xl p-0.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                          className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#1e345e] text-slate-200 flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs sm:text-sm font-bold text-white">{order.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                          className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#e11d48] hover:text-white text-slate-200 flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right min-w-[50px]">
                        <span className="text-xs sm:text-sm font-bold text-[#f59e0b] tracking-tight block">{formatPrice(lineTotal)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(order)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors flex items-center justify-center active:scale-90 cursor-pointer"
                        aria-label={`Supprimer ${order.drinkName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* NOTE POUR LE BARMAN (Positionnée avant le total selon Stitch) */}
          <div className="p-3 rounded-xl bg-[#16274a]/60 border border-white/10 space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="barman-note" className="text-xs font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <StickyNote className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Note pour le barman (optionnel)</span>
              </label>
              <span className="text-[10px] text-slate-400">{note.length}/100</span>
            </div>
            <input
              id="barman-note"
              type="text"
              maxLength={100}
              value={note}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder="Ex : Sans glaçons, Dans un verre..."
              className="w-full bg-[#06122c] text-white placeholder-slate-500 text-xs px-3.5 py-2 rounded-lg border border-white/10 focus:border-[#ff4897] focus:ring-1 focus:ring-[#ff4897] outline-none transition-all"
            />
          </div>

          {/* TOTAL ENCAPSULÉ DANS UNE CARTE DÉDIÉE STITCH */}
          <div className="px-5 py-3.5 rounded-xl bg-[#06122c]/90 border border-white/10 flex items-center justify-between shadow-inner">
            <span className="font-extrabold text-white text-base">Total à régler</span>
            <span className="font-extrabold text-[#f59e0b] text-2xl tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* BOUTONS D'ACTION STITCH */}
          <div className="space-y-2 pt-1">
            {/* CTA principal dégradé magenta */}
            <Button
              type="button"
              onClick={onConfirm}
              className="w-full h-12 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e11d48] to-[#ff4897] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(225,29,72,0.45)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-0"
            >
              <Check className="w-5 h-5" />
              <span>Confirmer la commande</span>
            </Button>

            {/* Bouton Partager Stitch */}
            <ShareButtons
              order={orders}
              menus={menus}
              isCurrentOrder={true}
              className="w-full h-10 py-3 px-6 rounded-2xl bg-[#16274a]/60 hover:bg-[#16274a] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            />

            {/* Action discrète Vider le panier */}
            <div className="flex items-center justify-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-slate-400 hover:text-rose-400 text-xs font-medium py-1 px-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider le panier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation de suppression d'une boisson */}
        {itemToDelete && (
          <DeleteConfirmDialog
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => {
              onRemoveItem(itemToDelete.drinkId, itemToDelete.barId);
              const remaining = orders.filter(o => getOrderItemKey(o) !== getOrderItemKey(itemToDelete));
              setItemToDelete(null);
              if (remaining.length === 0) {
                onClose();
              }
              toast('Boisson retirée', { description: `${itemToDelete.drinkName} a été retirée du panier.` });
            }}
            type="drink"
            item={itemToDelete}
            title={`Supprimer ${itemToDelete?.drinkName ? `« ${itemToDelete.drinkName} »` : 'la boisson'} ?`}
            description={`Êtes-vous sûr de vouloir supprimer ${itemToDelete?.drinkName ? `« ${itemToDelete.drinkName} »` : 'cette boisson'} du panier ?`}
            confirmText="Supprimer"
            cancelText="Annuler"
          />
        )}

        {/* Confirmation pour vider le panier */}
        {showClearConfirm && (
          <DeleteConfirmDialog
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            onConfirm={() => {
              onClearAll();
              setShowClearConfirm(false);
              onClose();
            }}
            title="Vider le panier"
            description="Êtes-vous sûr de vouloir vider le panier ? Cette action est irréversible."
            confirmText="Vider"
            cancelText="Annuler"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderModal;
