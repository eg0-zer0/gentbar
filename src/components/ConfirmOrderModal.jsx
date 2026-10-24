import React, { useState, useMemo } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Minus, Plus, Receipt } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const grouped = useMemo(() => groupOrderItemsByBar(orders, menus), [orders, menus]);
  const totalAmount = grouped.totalAmount;
  const totalItems = grouped.totalItems;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-md mx-auto rounded-2xl p-0 overflow-hidden bg-[#0e1b35] text-[#d9e2ff] border border-slate-700/60 shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-700/60 bg-[#0e1b35]">
          <DialogTitle className="flex items-center text-white font-semibold">
            <span className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#ff4897]" />
              <span>Résumé de la commande</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Vérifiez le contenu de votre commande avant de la valider.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-[#0e1b35] text-[#d9e2ff] border-0 shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col">
            {/* Bouton de toggle d'affichage style Stitch */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-[#16274a] hover:bg-[#1e345e] border border-slate-700/50 mb-3 cursor-pointer transition-colors self-start"
              onClick={() => setIsExpanded(e => !e)}
            >
              <span>{isExpanded ? 'Réduire' : 'Voir'}</span>
              <span className="text-slate-400">({totalItems} article{totalItems > 1 ? 's' : ''})</span>
            </button>

            {isExpanded && (
              <>
                {/* LISTE AVEC SCROLL */}
                <div className="order-summary-list-scroll mb-4" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {grouped.isMultiBar ? (
                    <div className="space-y-3 p-1">
                      {grouped.groups.map((group) => (
                        <div key={group.barId} className="rounded-xl border border-slate-700/60 bg-[#06122c]/60 overflow-hidden">
                          <div className="flex items-center justify-between px-3.5 py-2 bg-[#16274a]/60 border-b border-slate-700/60 text-xs font-semibold text-white">
                            <span className="flex items-center gap-1.5">
                              <span>{group.barIcon}</span>
                              <span>{group.barName}</span>
                              {group.isDeletedBar && (
                                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">supprimé</span>
                              )}
                            </span>
                            <span className="text-[#f59e0b] font-bold">{formatPrice(group.subtotal)}</span>
                          </div>
                          <ul className="divide-y divide-slate-700/40 px-3 py-0.5 m-0 list-none">
                            {group.items.map((order) => {
                              const itemKey = getOrderItemKey(order);
                              const lineTotal = order.price * order.quantity;
                              return (
                                <li key={itemKey} className="flex justify-between items-center py-2.5 text-xs">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-medium truncate text-white text-sm">{order.drinkName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] text-slate-400">{formatPrice(order.price)} / unité</span>
                                      <span className="text-[11px] font-bold text-[#f59e0b]">· {formatPrice(lineTotal)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <div className="flex items-center bg-[#06122c] border border-slate-700/60 rounded-xl p-0.5 shadow-inner">
                                      <button
                                        type="button"
                                        className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#1e345e] text-[#d9e2ff] flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                        onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                                        aria-label="Diminuer la quantité"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-bold text-white">{order.quantity}</span>
                                      <button
                                        type="button"
                                        className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#e11d48] hover:text-white text-[#d9e2ff] flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                        onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                                        aria-label="Augmenter la quantité"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center transition-colors active:scale-90 ml-1 cursor-pointer"
                                      onClick={() => setItemToDelete(order)}
                                      aria-label={`Supprimer ${order.drinkName} du panier`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-700/40 p-1 m-0 list-none">
                      {orders.map(order => {
                        const itemKey = getOrderItemKey(order);
                        const lineTotal = order.price * order.quantity;
                        return (
                          <li key={itemKey} className="flex justify-between items-center py-2.5">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-medium text-white truncate text-sm">{order.drinkName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400">{formatPrice(order.price)} / unité</span>
                                <span className="text-xs font-bold text-[#f59e0b]">· {formatPrice(lineTotal)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="flex items-center bg-[#06122c] border border-slate-700/60 rounded-xl p-0.5 shadow-inner">
                                <button
                                  type="button"
                                  className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#1e345e] text-[#d9e2ff] flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                  onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                                  aria-label="Diminuer la quantité"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-white">{order.quantity}</span>
                                <button
                                  type="button"
                                  className="w-7 h-7 rounded-lg bg-[#16274a] hover:bg-[#e11d48] hover:text-white text-[#d9e2ff] flex items-center justify-center font-bold text-sm transition-colors active:scale-90 cursor-pointer"
                                  onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                                  aria-label="Augmenter la quantité"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center transition-colors active:scale-90 ml-1 cursor-pointer"
                                onClick={() => setItemToDelete(order)}
                                aria-label={`Supprimer ${order.drinkName} du panier`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* FOOTER TOTAL, NOTE & ACTIONS */}
                <div className="border-t border-slate-700/60 pt-4 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-300">Total à régler</span>
                    <span className="text-2xl font-extrabold text-[#f59e0b] drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  {/* Champ Note libre (E-7) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="order-note-input" className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>Note pour le barman <span className="text-slate-400 font-normal">(optionnelle)</span></span>
                      <span className="text-[10px] text-slate-400">{note.length}/100</span>
                    </label>
                    <input
                      id="order-note-input"
                      type="text"
                      maxLength={100}
                      value={note}
                      onChange={(e) => onNoteChange?.(e.target.value)}
                      placeholder="Ex. : sans glaçons pour le mojito, bien frais..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#06122c] border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ff4897] focus:ring-1 focus:ring-[#ff4897] transition-all"
                    />
                  </div>

                  {/* Bouton de confirmation principal Stitch */}
                  <Button
                    className="w-full h-12 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#e11d48] to-[#ff4897] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(225,29,72,0.45)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-0"
                    onClick={onConfirm}
                  >
                    Confirmer la commande
                  </Button>

                  {/* Bouton secondaire Partager */}
                  <ShareButtons
                    order={orders}
                    menus={menus}
                    isCurrentOrder={true}
                    className="w-full bg-[#16274a] hover:bg-[#1e345e] text-slate-200 hover:text-white border border-slate-700/60 rounded-xl h-10 text-xs font-semibold transition-all"
                  />

                  {/* Bouton discret Vider le panier */}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-slate-400 hover:text-rose-400 text-xs font-medium py-1 px-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-center mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider le panier</span>
                  </button>
                </div>
              </>
            )}

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

            {!isExpanded && (
              <p className="text-center py-4 text-xs text-slate-400">
                Cliquez sur "Voir" pour afficher le détail des commandes ({totalItems} article{totalItems > 1 ? 's' : ''})
              </p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
export default ConfirmOrderModal;
