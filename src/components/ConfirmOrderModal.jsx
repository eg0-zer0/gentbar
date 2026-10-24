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
      <DialogContent className="w-[94vw] max-w-lg max-h-[92vh] sm:max-h-[88vh] mx-auto rounded-2xl p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl flex flex-col [&>button.absolute]:hidden">
        {/* 1. EN-TÊTE FIXE STITCH */}
        <div className="shrink-0 pt-3 pb-2.5 px-4 sm:px-5 flex flex-col border-b border-border bg-card">
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-2.5"></div>
          <div className="w-full flex items-start justify-between">
            <div className="flex flex-col text-left">
              <DialogTitle className="font-bold text-base sm:text-lg text-card-foreground leading-tight">
                Vérifiez votre commande
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-price"></span>
                <span>{totalItems} article{totalItems > 1 ? 's' : ''} dans votre commande</span>
              </DialogDescription>
            </div>
            {/* Bouton de fermeture stylisé Stitch */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-xl bg-secondary text-muted-foreground hover:text-card-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center active:scale-95 border border-border cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. ZONE CENTRALE DÉFILANTE (UNIQUEMENT LA LISTE DES ARTICLES) */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 py-3 space-y-2.5">
          {grouped.isMultiBar ? (
            <div className="space-y-2.5">
              {grouped.groups.map((group) => (
                <div key={group.barId} className="rounded-xl border border-border bg-background/60 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/80 border-b border-border text-xs font-semibold text-card-foreground">
                    <span className="flex items-center gap-1.5">
                      <span>{group.barIcon}</span>
                      <span>{group.barName}</span>
                      {group.isDeletedBar && (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">supprimé</span>
                      )}
                    </span>
                    <span className="text-price font-bold">{formatPrice(group.subtotal)}</span>
                  </div>
                  <div className="divide-y divide-border/50 p-1 space-y-1">
                    {group.items.map((order) => {
                      const itemKey = getOrderItemKey(order);
                      const lineTotal = order.price * order.quantity;
                      return (
                        <article key={itemKey} className="p-2 sm:p-2.5 rounded-lg bg-secondary/40 border border-border/50 flex items-center justify-between gap-2">
                          {/* Nom et prix unitaire à gauche : large espace sans troncature agressive */}
                          <div className="flex-1 min-w-0 pr-1 text-left">
                            <h3 className="text-xs sm:text-sm font-semibold text-card-foreground leading-tight break-words line-clamp-2">
                              {order.drinkName}
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {formatPrice(order.price)} / unité
                            </p>
                          </div>
                          {/* Stepper compact + sous-total + corbeille */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-inner">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                                className="order-stepper-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center justify-center font-bold text-xs transition-colors active:scale-90 cursor-pointer"
                                aria-label="Diminuer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs sm:text-sm font-bold text-foreground">{order.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                                className="order-stepper-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground flex items-center justify-center font-bold text-xs transition-colors active:scale-90 cursor-pointer"
                                aria-label="Augmenter"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-right min-w-[46px] sm:min-w-[52px]">
                              <span className="text-xs sm:text-sm font-bold text-price tracking-tight block">
                                {formatPrice(lineTotal)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(order)}
                              className="order-delete-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center active:scale-90 cursor-pointer"
                              aria-label={`Supprimer ${order.drinkName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                  <article key={itemKey} className="p-2 sm:p-2.5 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-2">
                    {/* Nom et prix unitaire à gauche : large espace sans troncature agressive */}
                    <div className="flex-1 min-w-0 pr-1 text-left">
                      <h3 className="text-xs sm:text-sm font-semibold text-card-foreground leading-tight break-words line-clamp-2">
                        {order.drinkName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatPrice(order.price)} / unité
                      </p>
                    </div>
                    {/* Stepper compact + sous-total + corbeille */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                          className="order-stepper-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center justify-center font-bold text-xs transition-colors active:scale-90 cursor-pointer"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs sm:text-sm font-bold text-foreground">{order.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                          className="order-stepper-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground flex items-center justify-center font-bold text-xs transition-colors active:scale-90 cursor-pointer"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right min-w-[46px] sm:min-w-[52px]">
                        <span className="text-xs sm:text-sm font-bold text-price tracking-tight block">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(order)}
                        className="order-delete-btn w-[26px] h-[26px] min-w-0 min-h-0 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center active:scale-90 cursor-pointer"
                        aria-label={`Supprimer ${order.drinkName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PIED DE MODALE FIXE EN BAS : NOTE, TOTAL ENCAPSULÉ, ACTIONS (TOUJOURS VISIBLES) */}
        <div className="shrink-0 p-3 sm:p-4 bg-card border-t border-border space-y-2">
          {/* Note pour le barman (compacte) */}
          <div className="px-3 py-1.5 rounded-xl bg-secondary/60 border border-border space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="barman-note" className="text-xs font-medium text-card-foreground flex items-center gap-1.5 cursor-pointer">
                <StickyNote className="w-3.5 h-3.5 text-price" />
                <span>Note pour le barman (optionnel)</span>
              </label>
              <span className="text-[10px] text-muted-foreground">{note.length}/100</span>
            </div>
            <input
              id="barman-note"
              type="text"
              maxLength={100}
              value={note}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder="Ex : Sans glaçons, Dans un verre..."
              className="w-full bg-background text-foreground placeholder:text-muted-foreground text-xs px-3 py-1.5 rounded-lg border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          {/* Total à régler encapsulé */}
          <div className="px-4 py-2.5 rounded-xl bg-background/90 border border-border flex items-center justify-between shadow-inner">
            <span className="font-extrabold text-card-foreground text-sm sm:text-base">Total à régler</span>
            <span className="font-extrabold text-price text-xl sm:text-2xl tracking-tight">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Actions : Confirmer, Partager, Vider le panier */}
          <div className="space-y-1.5 pt-0.5">
            <Button
              type="button"
              onClick={onConfirm}
              className="btn-primary w-full h-11 py-2 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer border-0"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Confirmer la commande</span>
            </Button>

            <ShareButtons
              order={orders}
              menus={menus}
              isCurrentOrder={true}
              className="w-full h-9 py-1.5 px-6 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-secondary-foreground hover:text-card-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            />

            <div className="flex items-center justify-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-muted-foreground hover:text-destructive text-xs font-medium py-0.5 px-3 rounded-lg hover:bg-destructive/10 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
