import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Minus, Plus, Receipt } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { useTheme } from '../contexts/ThemeContext';

const ConfirmOrderModal = ({ isOpen, onClose, orders, onUpdateQuantity, onRemoveItem, onClearAll, onConfirm }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAmount = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto rounded-md p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-10" />
            Résumé de la commande
          </DialogTitle>
        </DialogHeader>

        <Card className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
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
                  <ul className="space-y-2 p-5 m-0 list-none">
                    {orders.map(order => (
                      <li key={order.drinkId} className="flex justify-between items-center border-b py-1">
                        <div>
                          <p className="font-medium">{order.drinkName}</p>
                          <p className="text-xs text-muted-text">{order.price.toFixed(2)} € / unité</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            className="btn-primary p-1"
                            size="xs"
                            onClick={() => onUpdateQuantity(order.drinkId, order.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center">{order.quantity}</span>
                          <Button
                            className="btn-primary p-1"
                            size="xs"
                            onClick={() => onUpdateQuantity(order.drinkId, order.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            className="btn-destructive p-1"
                            size="xs"
                            onClick={() => onRemoveItem(order.drinkId)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FOOTER */}
                <div className="border-t pt-4 flex flex-col gap-3">
                  <div className="text-lg font-semibold">
                    Total : {totalAmount.toFixed(2)} €
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={onClearAll}>
                      Vider le panier
                    </Button>
                    <Button className="btn-primary" onClick={onConfirm}>
                      Confirmer la commande
                    </Button>
                  </div>
                  <ShareButtons />
                </div>
              </>
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
