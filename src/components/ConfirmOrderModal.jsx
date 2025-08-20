import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Receipt } from 'lucide-react';

// Props attendues :
// isOpen (bool) -> ouvrir/fermer
// onClose (func) -> callback fermeture
// orders (array) -> contenu du panier
// onConfirm (func) -> callback confirmation
const ConfirmOrderModal = ({ isOpen, onClose, orders = [], onConfirm }) => {
  const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmer la commande</DialogTitle>
          <DialogDescription>
            Veuillez vérifier les détails de la commande avant de confirmer.
          </DialogDescription>
        </DialogHeader>

        {/* Liste des articles */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 my-4">
          {orders.map((item) => (
            <div
              key={item.drinkId}
              className="flex justify-between py-2 text-sm text-gray-800 dark:text-gray-200"
            >
              <div className="flex-1">
                <span className="font-medium">{item.drinkName}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  x{item.quantity}
                </span>
              </div>
              <div className="text-right font-medium">
                {(item.price * item.quantity).toFixed(2)}€
              </div>
            </div>
          ))}
        </div>

        {/* Total global */}
        <div className="flex justify-between items-center text-lg font-bold mt-4">
          <span>Total :</span>
          <span>{total.toFixed(2)}€</span>
        </div>

        {/* Boutons */}
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="touch-manipulation"
          >
            Annuler
          </Button>
          <Button
            onClick={() => onConfirm()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white touch-manipulation"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderModal;
