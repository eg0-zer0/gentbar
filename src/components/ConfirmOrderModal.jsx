import React, { useState } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Minus, Plus, Receipt } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { toast } from 'sonner';
import { formatPrice } from '../lib/format';

const ConfirmOrderModal = ({
  isOpen,
  onClose,
  orders,
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

  const totalAmount = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-md mx-auto rounded-lg p-0 overflow-hidden bg-card text-foreground border border-border shadow-xl">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2 text-foreground font-semibold">
            <Receipt className="w-5 h-5 text-primary" />
            Résumé de la commande
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Vérifiez le contenu de votre commande avant de la valider.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-card text-foreground border-0 shadow-none">
          <CardContent className="p-5 flex flex-col">
            {/* Bouton de toggle d'affichage */}
            <Button
              className="btn-primary mb-4"
              onClick={() => setIsExpanded(e => !e)}
            >
              {isExpanded ? 'Réduire' : 'Voir'} ({totalItems} article{totalItems > 1 ? 's' : ''})
            </Button>

            {isExpanded && (
              <>
                {/* LISTE AVEC SCROLL */}
                <div className="order-summary-list-scroll mb-4" style={{ maxHeight: '308px', overflowY: 'auto' }}>
                  <ul className="space-y-2 p-1 m-0 list-none">
                    {orders.map(order => (
                      <li key={order.drinkId} className="flex justify-between items-center border-b border-border py-2">
                        <div>
                          <p className="font-medium text-foreground">{order.drinkName}</p>
                          <p className="text-xs text-muted-text">{formatPrice(order.price)} / unité</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            className="btn-primary p-1"
                            size="sm"
                            onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center text-foreground">{order.quantity}</span>
                          <Button
                            className="btn-primary p-1"
                            size="sm"
                            onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            className="btn-destructive p-1"
                            size="sm"
                            onClick={() => setItemToDelete(order)}
                            aria-label={`Supprimer ${order.drinkName} du panier`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FOOTER */}
                <div className="border-t border-border pt-4 flex flex-col gap-3">
                  <div className="text-lg font-semibold text-foreground">
                    Total : {formatPrice(totalAmount)}
                  </div>

                  {/* Champ Note libre (E-7) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="order-note-input" className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span>Note pour le barman <span className="text-muted-foreground font-normal">(optionnelle)</span></span>
                      <span className="text-[10px] text-muted-foreground">{note.length}/100</span>
                    </label>
                    <input
                      id="order-note-input"
                      type="text"
                      maxLength={100}
                      value={note}
                      onChange={(e) => onNoteChange?.(e.target.value)}
                      placeholder="Ex. : sans glaçons pour le mojito, bien frais..."
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="btn-primary w-full sm:flex-1 order-1 sm:order-2" onClick={onConfirm}>
                      Confirmer la commande
                    </Button>
                    <Button
                      variant="destructive"
                      className="btn-destructive w-full sm:flex-1 order-2 sm:order-1"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      Vider le panier
                    </Button>
                  </div>
                  <ShareButtons order={orders} isCurrentOrder={true} />
                </div>
              </>
            )}

            {/* Confirmation de suppression d'une boisson */}
            {itemToDelete && (
              <DeleteConfirmDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                  onRemoveItem(itemToDelete.drinkId);
                  const remaining = orders.filter(o => o.drinkId !== itemToDelete.drinkId);
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
              <p className="text-center py-4 text-muted-text">
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
