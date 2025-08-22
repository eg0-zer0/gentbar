import React, { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import { Card, CardContent } from './ui/card';

import { Button } from './ui/button';

import { Trash2, Minus, Plus, Receipt } from 'lucide-react';

import ShareButtons from './ShareButtons';

import { useTheme } from '../contexts/ThemeContext';

import { useViewMode } from '../contexts/ViewModeContext';

const ConfirmOrderModal = ({ isOpen, onClose, orders, onUpdateQuantity, onRemoveItem, onClearAll, onConfirm }) => {
  const { theme } = useTheme();
  const { viewMode } = useViewMode();

  const [isExpanded, setIsExpanded] = useState(true);

  const totalAmount = orders.reduce((sum, order) => sum + order.price * order.quantity, 0);
  const totalItems = orders.reduce((sum, order) => sum + order.quantity, 0);

  const cardBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`
          ${cardBgClass}
          w-full
          max-w-sm
          sm:max-w-md
          md:max-w-lg
          lg:max-w-xl
          xl:max-w-2xl
          mx-auto
          rounded-md
          p-6
        `}
      >
        <DialogHeader>
          <DialogTitle className={`${textPrimaryClass} flex items-center gap-2 text-xl font-bold`}>
            <Receipt className="w-6 h-6" />
            Résumé de la commande
          </DialogTitle>
          <Button className="btn-primary" size="sm" onClick={() => setIsExpanded(e => !e)}>
            {isExpanded ? 'Réduire' : 'Voir'} ({totalItems} article{totalItems > 1 ? 's' : ''})
          </Button>
        </DialogHeader>

        {isExpanded && (
          <CardContent className="confirm-order-content">
  <ul className="confirm-order-list space-y-1">
    {orders.map(order => (
      <li key={order.drinkId} className="flex justify-between items-center border-b border-border-color py-1">
        <div>
          <p className="font-medium text-sm mb-0.5">{order.drinkName}</p>
          <p className="text-muted text-xs mb-0">{order.price.toFixed(2)} € / unité</p>
        </div>
        <div className="flex items-center gap-1">
          <Button className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center" size="xs" onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1)} aria-label={`Diminuer la quantité de ${order.drinkName}`}>
            <Minus className="w-3 h-3" />
          </Button>
                     <span className="w-5 text-center text-sm">{order.quantity}</span>
          <Button className="btn-primary min-w-0 w-7 h-5 p-0 flex justify-center items-center" size="xs" onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1)} aria-label={`Augmenter la quantité de ${order.drinkName}`}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button className="btn-destructive min-w-0 w-7 h-5 p-0 flex justify-center items-center" size="xs" onClick={() => onRemoveItem(order.drinkId)} aria-label={`Supprimer ${order.drinkName} du panier`}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className={`${textPrimaryClass} font-semibold text-lg min-w-[120px]`}>
                Total : {totalAmount.toFixed(2)} €
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 flex-wrap justify-center sm:justify-start">
                <Button variant="destructive" onClick={onClearAll}>
                  Vider le panier
                </Button>
                <Button className="btn-primary" onClick={onConfirm}>
                  Confirmer la commande
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <ShareButtons />
            </div>
          </CardContent>
        )}
        {!isExpanded && (
          <CardContent className={`${textSecondaryClass} text-center py-4`}>
            Cliquez sur "Voir" pour afficher le détail des commandes ({totalItems} article{totalItems > 1 ? 's' : ''})
          </CardContent>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderModal;
