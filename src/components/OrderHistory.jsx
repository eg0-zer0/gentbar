import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash, Trash2, History, Calendar, Receipt } from 'lucide-react';
import ShareButtons from './ShareButtons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

const OrderHistory = ({ orderHistory = [], isOpen = false, onClose, onRemoveOrder }) => {

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
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.date)}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {order.total.toFixed(2)}€
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
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.drinkName}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {(item.quantity * item.price).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Receipt className="w-3 h-3" />
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} articles
                    </div>
                    <span className="font-semibold text-sm dark:text-gray-200">
                      Total: {order.total.toFixed(2)}€
                    </span>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <ShareButtons order={order} isCurrentOrder={false} />
                  <button
                    aria-label="Supprimer cette commande"
                    onClick={() => {
                      if (typeof onRemoveOrder === 'function') {
                        onRemoveOrder(order.id);
                      }
                    }}
                    className="btn-destructive p-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderHistory;
