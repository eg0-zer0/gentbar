import React, { useState, useEffect, useMemo } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash, Minus, Plus, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import ShareButtons from './ShareButtons';
import useMediaQuery from '../hooks/useMediaQuery';
import { toast } from 'sonner';
import { formatPrice } from '../lib/format';

import { groupOrderItemsByBar, getOrderItemKey } from '../lib/menus';

const OrderSummary = ({
  orders,
  menus = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onConfirmOrder,
  isConfirmModalOpen,
  isTicketOpen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const isWide = useMediaQuery('(min-width: 1080px)');
  const [itemToDelete, setItemToDelete] = useState(null);
  const hasOrders = orders.length > 0;
  const isFloating = hasOrders && !isWide;

  const grouped = useMemo(() => groupOrderItemsByBar(orders, menus), [orders, menus]);
  const totalAmount = grouped.totalAmount;
  const totalItems = grouped.totalItems;

  // Pagination pour le mode mono-bar classique (5 articles par page)
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, endIndex);

  // A-38 : Recaler currentPage après suppression pour ne pas rester sur une page vide
  useEffect(() => {
    if (totalPages > 0 && currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [orders.length, totalPages, currentPage]);

  if (isConfirmModalOpen || !hasOrders || isTicketOpen) return null;

  if (isFloating) {
    return (
      <div className="floating-cart flex justify-end items-center w-full">
        <Button
          className="btn-primary px-4 py-2 rounded font-semibold text-base shadow-lg flex items-center gap-2"
          onClick={onConfirmOrder}
          aria-label={`Voir la commande (${totalItems} article${totalItems > 1 ? 's' : ''})`}
        >
          {grouped.isMultiBar && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
              {grouped.barsCount} bars
            </span>
          )}
          <span>{`Voir (${totalItems} article${totalItems > 1 ? 's' : ''})`}</span>
        </Button>
        {/* Confirmation dialog for clearing cart in floating mode */}
        {showClearConfirm && (
          <DeleteConfirmDialog
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            onConfirm={() => {
              onClearAll();
              setShowClearConfirm(false);
            }}
            title="Vider le panier"
            description="Êtes‑vous sûr de vouloir vider le panier ? Cette action est irréversible."
            confirmText="Vider"
            cancelText="Annuler"
          />
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card border border-border-color flex flex-col max-w-full">
      {/* HEADER */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span>Résumé de la commande</span>
            {grouped.isMultiBar && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                {grouped.barsCount} bars
              </span>
            )}
          </span>
          <Button
            className="btn-primary"
            size="sm"
            onClick={() => setIsExpanded(expanded => !expanded)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Réduire' : 'Voir'} la commande`}
          >
            {isExpanded ? 'Réduire' : 'Voir'} ({totalItems} article{totalItems > 1 ? 's' : ''})
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="flex flex-col gap-4">
          {/* Alerte commande multi-bars (§ 4.6) */}
          {grouped.isMultiBar && (
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center justify-between">
              <span>🏪 Commande sur {grouped.barsCount} bars</span>
              <span className="font-normal text-muted-foreground">{totalItems} boissons</span>
            </div>
          )}

          {/* Affichage des articles : groupé par bar si multi-bars, classique paginé si mono-bar */}
          {grouped.isMultiBar ? (
            <div className="space-y-4">
              {grouped.groups.map((group) => (
                <div key={group.barId} className="rounded-xl border border-border/70 bg-background/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/70 text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span>{group.barIcon}</span>
                      <span>{group.barName}</span>
                      {group.isDeletedBar && (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">supprimé</span>
                      )}
                    </span>
                    <span className="text-primary font-bold">{formatPrice(group.subtotal)}</span>
                  </div>
                  <ul className="divide-y divide-border/40 px-3 py-1">
                    {group.items.map((order) => {
                      const itemKey = getOrderItemKey(order);
                      return (
                        <li className="flex justify-between items-center py-2 text-xs" key={itemKey}>
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-medium truncate text-foreground">{order.drinkName}</p>
                            <p className="text-muted-foreground text-[11px]">{formatPrice(order.price)} / unité</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              className="btn-primary min-w-0 w-7 h-6 p-0 flex justify-center items-center"
                              size="sm"
                              onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                              aria-label={`Diminuer la quantité de ${order.drinkName}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-5 text-center font-semibold text-foreground">{order.quantity}</span>
                            <Button
                              className="btn-primary min-w-0 w-7 h-6 p-0 flex justify-center items-center"
                              size="sm"
                              onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                              aria-label={`Augmenter la quantité de ${order.drinkName}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              className="btn-destructive min-w-0 w-7 h-6 p-0 flex justify-center items-center"
                              size="sm"
                              onClick={() => setItemToDelete(order)}
                              aria-label={`Supprimer ${order.drinkName} du panier`}
                            >
                              <Trash className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Navigation pagination si mono-bar et plus de 5 articles */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-text mb-2">
                  <Button
                    className="btn-primary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>
                    Page {currentPage + 1} sur {totalPages} • Articles {startIndex + 1}-{Math.min(endIndex, orders.length)} / {orders.length}
                  </span>
                  <Button
                    className="btn-primary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <ul className="space-y-1">
                {currentOrders.map((order) => {
                  const itemKey = getOrderItemKey(order);
                  return (
                    <li className="flex justify-between items-center border-b border-border-color py-1" key={itemKey}>
                      <div>
                        <p className="font-medium text-sm mb-0.5 text-card-foreground">{order.drinkName}</p>
                        <p className="text-muted-text text-xs mb-0 text-card-foreground">{formatPrice(order.price)} / unité</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                          size="sm"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1, order.barId)}
                          aria-label={`Diminuer la quantité de ${order.drinkName}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center text-sm">{order.quantity}</span>
                        <Button
                          className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                          size="sm"
                          onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1, order.barId)}
                          aria-label={`Augmenter la quantité de ${order.drinkName}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          className="btn-destructive min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                          size="sm"
                          onClick={() => setItemToDelete(order)}
                          aria-label={`Supprimer ${order.drinkName} du panier`}
                        >
                          <Trash className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-foreground font-semibold text-lg min-w-[120px]">
              Total : {formatPrice(totalAmount)}
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button variant="destructive" className="btn-destructive" onClick={() => setShowClearConfirm(true)}>
                Vider le panier
              </Button>

              {itemToDelete && (
                <DeleteConfirmDialog
                  isOpen={!!itemToDelete}
                  onClose={() => setItemToDelete(null)}
                  onConfirm={() => {
                    onRemoveItem(itemToDelete.drinkId, itemToDelete.barId);
                    setItemToDelete(null);
                    toast('Boisson retirée', { description: `${itemToDelete.drinkName} a été retirée du panier.` });
                  }}
                  type="drink"
                  item={itemToDelete}
                  title={`Supprimer ${itemToDelete?.drinkName ? `« ${itemToDelete.drinkName} »` : 'la boisson'} ?`}
                  description={`Êtes‑vous sûr de vouloir supprimer ${itemToDelete?.drinkName ? `« ${itemToDelete.drinkName} »` : 'cette boisson'} du panier ?`}
                  confirmText="Supprimer"
                  cancelText="Annuler"
                />
              )}

              {showClearConfirm && (
                <DeleteConfirmDialog
                  isOpen={showClearConfirm}
                  onClose={() => setShowClearConfirm(false)}
                  onConfirm={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                  }}
                  title="Vider le panier"
                  description="Êtes‑vous sûr de vouloir vider le panier ? Cette action est irréversible."
                  confirmText="Vider"
                  cancelText="Annuler"
                />
              )}

              <Button
                className="btn-primary"
                onClick={() => {
                  setIsExpanded(false);
                  onConfirmOrder();
                }}
              >
                Visualiser la commande
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <ShareButtons order={orders} menus={menus} isCurrentOrder={true} />
          </div>
        </CardContent>
      ) : (
        <CardContent className="text-center text-muted-text py-4">
          Cliquez sur "Voir" pour afficher le détail des commandes ({totalItems} article{totalItems > 1 ? 's' : ''})
        </CardContent>
      )}
    </Card>
  );
};

export default OrderSummary;
