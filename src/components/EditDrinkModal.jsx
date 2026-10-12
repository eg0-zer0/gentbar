import React, { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { useTheme } from '../contexts/ThemeContext';

const EditDrink = ({ drink, isOpen, onClose, onSave, onDelete, mode = 'edit' }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });

  useEffect(() => {
    if (drink && mode === 'edit') {
      setFormData({
        name: drink.name || '',
        price: typeof drink.price === 'number' ? drink.price.toString() : (drink.price || ''),
      });
    } else {
      setFormData({ name: '', price: '' });
    }
  }, [drink, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const parsedPrice = parseFloat(formData.price);
    if (trimmedName && !isNaN(parsedPrice) && parsedPrice >= 0) {
      onSave({
        ...drink,
        name: trimmedName,
        price: parsedPrice,
      });
      onClose();
    }
  };

  const isEditMode = mode === 'edit';

  const bgClass = "bg-card";
  const textClass = "text-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6 shadow-lg`}>
        <DialogHeader>
          <DialogTitle className={`${textClass} font-semibold mb-4`}>
            {isEditMode ? 'Modifier la boisson' : 'Ajouter une boisson'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="drink-name" className={`${textClass} block mb-1`}>
              Nom de la boisson
            </Label>
            <Input
              id="drink-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Red Bull"
              required
              className="w-full bg-background text-foreground"
            />
          </div>
          <div>
            <Label htmlFor="drink-price" className={`${textClass} block mb-1`}>
              Prix (€)
            </Label>
            <Input
              id="drink-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ex: 3.50"
              required
              className="w-full bg-background text-foreground"
            />
          </div>
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
            {isEditMode && onDelete ? (
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  onDelete(drink);
                  onClose();
                }}
              >
                Supprimer la boisson
              </Button>
            ) : <div />}
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditMode ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDrink;
