import React, { useState } from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trash, Trash2, History, Calendar, Receipt } from 'lucide-react';
import ShareButtons from './ShareButtons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { formatPrice } from '../lib/format';

const OrderHistory = ({ orderHistory = [], isOpen = false, onClose, onRemoveOrder, onOpenTicket }) => {
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
      <DialogContent className="max-w-md mx-auto rounded-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des commandes
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Consultez et partagez vos commandes passées.
          </DialogDescription>
        </DialogHeader>

        {orderHistory.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Aucun historique
          </p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {orderHistory.map((order) => (
              <Card
                key={order.id}
                className="border border-border rounded-lg p-3 bg-card text-foreground"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.date)}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    >
                      {formatPrice(order.total)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-foreground">
                          {item.quantity}x {item.drinkName}
                        </span>
                        <span className="text-muted-foreground">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Receipt className="w-3 h-3" />
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} articles
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      Total : {formatPrice(order.total)}
                    </span>
                  </div>
                </CardContent>
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-border">
                  {onOpenTicket && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-outline flex items-center gap-1.5 text-xs h-8 px-2.5"
                      onClick={() => onOpenTicket(order)}
                      aria-label="Voir le ticket de cette commande"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Ticket
                    </Button>
                  )}
                  <ShareButtons 
                    order={order} 
                    isCurrentOrder={false} 
                    className="w-auto h-8 px-2.5 text-xs"
                    size="sm"
                  />
                  <button
                    aria-label="Supprimer cette commande"
                    onClick={() => setOrderToDelete(order)}
                    className="btn-destructive p-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

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
