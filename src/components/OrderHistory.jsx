import React, { useState } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';
import { 
  Trash2, 
  History, 
  Calendar, 
  Receipt, 
  RotateCcw, 
  StickyNote, 
  FileText,
  X 
} from 'lucide-react';
import ShareButtons from './ShareButtons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { formatPrice } from '../lib/format';
import { groupOrderItemsByBar, getOrderItemKey } from '../lib/menus';

const OrderHistory = ({
  orderHistory = [],
  isOpen = false,
  onClose,
  onRemoveOrder,
  onOpenTicket,
  onReorder,
  categories = [],
  menus = []
}) => {
  const [orderToDelete, setOrderToDelete] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-[420px] sm:max-w-[440px] max-h-[90vh] flex flex-col p-5 bg-card text-card-foreground rounded-2xl border border-border shadow-2xl focus:outline-none [&>button.absolute]:hidden">
        {/* En-tête Stitch avec icône Historique et croix de fermeture */}
        <header className="shrink-0 flex items-start justify-between pb-3 border-b border-border">
          <div className="flex flex-col text-left">
            <DialogTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground shrink-0" />
              <span>Historique des commandes</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Consultez et partagez vos commandes passées.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted-foreground hover:text-card-foreground transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-secondary/50 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </header>

        {orderHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-10 text-sm">
            Aucun historique de commande pour l'instant.
          </p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 pr-0.5 scrollbar-thin">
            {orderHistory.map((order) => {
              const grouped = groupOrderItemsByBar(order.items, menus);
              const totalItemsCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

              return (
                <article
                  key={order.id}
                  className="bg-background/60 border border-border rounded-2xl p-4 space-y-3 shadow-sm text-left"
                >
                  {/* Ligne 1 : Date & Heure à gauche + Badge Total vert à droite */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-card-foreground tracking-wide">
                        {formatDate(order.date)}
                      </span>
                    </div>
                    {/* Badge total vert Stitch */}
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Ligne 2 : Mention du bar si mono-bar */}
                  {!grouped.isMultiBar && grouped.groups[0] && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-1">
                      <span className="text-muted-foreground/70">•</span>
                      <span>{grouped.groups[0].barIcon}</span>
                      <span className="font-medium text-card-foreground/85">{grouped.groups[0].barName}</span>
                      {grouped.groups[0].isDeletedBar && (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.2 rounded border border-destructive/20 font-medium">
                          supprimé
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ligne 3 : Liste des articles */}
                  {grouped.isMultiBar ? (
                    <div className="space-y-2 pt-1">
                      {grouped.groups.map((group) => (
                        <div key={group.barId} className="rounded-xl border border-border bg-background overflow-hidden text-xs">
                          {/* En-tête de bar multi-bars avec sous-total primaire */}
                          <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/50 font-semibold border-b border-border">
                            <span className="flex items-center gap-1.5">
                              <span>{group.barIcon}</span>
                              <span className="text-card-foreground">{group.barName}</span>
                              {group.isDeletedBar && (
                                <span className="text-[10px] text-destructive bg-destructive/10 px-1 py-0.2 rounded">supprimé</span>
                              )}
                            </span>
                            <span className="text-primary font-bold">{formatPrice(group.subtotal)}</span>
                          </div>
                          {/* Articles de ce bar */}
                          <div className="px-3 py-1.5 space-y-1">
                            {group.items.map((item, index) => (
                              <div key={getOrderItemKey(item) || index} className="flex justify-between items-center text-xs py-0.5">
                                <span className="text-card-foreground font-medium">{item.quantity}× {item.drinkName || item.name}</span>
                                <span className="text-muted-foreground">{formatPrice(item.quantity * item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {(order.items || []).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-card-foreground font-medium">
                            {item.quantity}x {item.drinkName || item.name}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {formatPrice(item.quantity * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note de la commande (E-7) */}
                  {order.note && (
                    <div className="p-2.5 rounded-xl bg-price/10 border border-price/25 text-xs text-foreground flex items-start gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-price shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-price">Note : </span>
                        <span className="italic break-words text-card-foreground">{order.note}</span>
                      </div>
                    </div>
                  )}

                  {/* Ligne 4 : Séparateur et récapitulatif (X articles + Total) */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}</span>
                    </div>
                    <span className="font-bold text-sm text-card-foreground">
                      Total : {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Ligne 5 : Actions Stitch en 2 rangées */}
                  <div className="space-y-2 pt-1">
                    {/* Rangée 1 : Recommander et Ticket */}
                    <div className="grid grid-cols-2 gap-2">
                      {onReorder ? (
                        <button
                          type="button"
                          className="w-full h-9 px-3 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground hover:text-card-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          onClick={() => onReorder(order)}
                          aria-label="Recommander cette commande"
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>Recommander</span>
                        </button>
                      ) : <div />}

                      {onOpenTicket ? (
                        <button
                          type="button"
                          className="w-full h-9 px-3 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground hover:text-card-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          onClick={() => onOpenTicket(order)}
                          aria-label="Voir le ticket de cette commande"
                        >
                          <Receipt className="w-3.5 h-3.5 shrink-0" />
                          <span>Ticket</span>
                        </button>
                      ) : <div />}
                    </div>

                    {/* Rangée 2 : Partager à gauche + Corbeille rouge à droite */}
                    <div className="flex items-center gap-2">
                      <ShareButtons 
                        order={order} 
                        menus={menus}
                        isCurrentOrder={false} 
                        className="flex-1 h-9 px-3 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground hover:text-card-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        size="sm"
                      />
                      <button
                        type="button"
                        aria-label="Supprimer cette commande"
                        onClick={() => setOrderToDelete(order)}
                        className="w-10 h-9 rounded-xl bg-destructive/15 hover:bg-destructive/25 border border-destructive/30 text-destructive flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Dialogue de confirmation de suppression d'une commande */}
        {orderToDelete && (
          <DeleteConfirmDialog
            isOpen={!!orderToDelete}
            onClose={() => setOrderToDelete(null)}
            onConfirm={() => {
              if (typeof onRemoveOrder === 'function') {
                onRemoveOrder(orderToDelete.id);
              }
              setOrderToDelete(null);
              toast('Commande supprimée', { description: 'La commande a été retirée de l\'historique.' });
            }}
            title="Supprimer la commande ?"
            description="Êtes-vous sûr de vouloir supprimer cette commande de l'historique ? Cette action est irréversible."
            confirmText="Supprimer"
            cancelText="Annuler"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderHistory;
