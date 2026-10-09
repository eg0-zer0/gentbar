import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash, Minus, Plus, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import ShareButtons from './ShareButtons';
import useMediaQuery from '../hooks/useMediaQuery';

const OrderSummary = ({
  orders,
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onConfirmOrder,
  isConfirmModalOpen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const isWide = useMediaQuery('(min-width: 1080px)');
  const hasOrders = orders.length > 0;
  const isFloating = hasOrders && !isWide;

  const totalAmount = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
  const totalItems = orders.reduce((sum, order) => sum + order.quantity, 0);

  // Pagination - 5 articles par page
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, endIndex);

  if (isConfirmModalOpen || !hasOrders) return null;

  if (isFloating) {
    return (
      <div className="floating-cart flex justify-end items-center w-full">
        <Button
          className="btn-primary px-4 py-2 rounded font-semibold text-base"
          onClick={onConfirmOrder}
          aria-label={`Voir la commande (${totalItems} article${totalItems > 1 ? 's' : ''})`}
        >
          {`Voir (${totalItems} article${totalItems > 1 ? 's' : ''})`}
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-card border border-border-color flex flex-col max-w-full">
      {/* HEADER */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Résumé de la commande
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
          {/* Navigation pagination si plus de 5 articles */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-text">
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

          {/* Liste des articles (max 5 visibles) */}
          <div>
            <ul className="space-y-1">
              {currentOrders.map(order => (
                <li className="flex justify-between items-center border-b border-border-color py-1" key={order.drinkId}>
                  <div>
                    <p className="font-medium text-sm mb-0.5 text-card-foreground">{order.drinkName}</p>
                    <p className="text-muted-text text-xs mb-0 text-card-foreground">{order.price.toFixed(2)} € / unité</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                      size="xs"
                      onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1)}
                      aria-label={`Diminuer la quantité de ${order.drinkName}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-5 text-center text-sm">{order.quantity}</span>
                    <Button
                      className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                      size="xs"
                      onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1)}
                      aria-label={`Augmenter la quantité de ${order.drinkName}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      className="btn-destructive min-w-0 w-7 h-5 p-0 flex justify-center items-center"
                      size="xs"
                      onClick={() => onRemoveItem(order.drinkId)}
                      aria-label={`Supprimer ${order.drinkName} du panier`}
                    >
                      <Trash className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-foreground font-semibold text-lg min-w-[120px]">
              Total : {totalAmount.toFixed(2)} €
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button variant="destructive" className="btn-destructive" onClick={onClearAll}>
                Vider le panier
              </Button>
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
            <ShareButtons order={orders} isCurrentOrder={true} />
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
