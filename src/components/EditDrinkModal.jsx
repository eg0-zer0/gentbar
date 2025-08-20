import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const EditDrinkModal = ({ drink, isOpen, onClose, onSave, mode = 'edit' }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });

  useEffect(() => {
    if (drink) {
      setFormData({
        name: drink.name || '',
        price: drink.price?.toString() || '',
      });
    }
  }, [drink]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.price) {
      onSave({
        ...drink,
        name: formData.name,
        price: parseFloat(formData.price),
      });
      onClose();
    }
  };

  const isAddMode = mode === 'add' || (drink && drink.id && drink.id.startsWith('custom-'));
  const title = isAddMode ? 'Ajouter une boisson' : 'Modifier la boisson';
  const buttonText = isAddMode ? 'Ajouter' : 'Modifier';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la boisson */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la boisson</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Red Bull"
              required
            />
          </div>

          {/* Prix */}
          <div className="space-y-2">
            <Label htmlFor="price">Prix (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ex: 3.50"
              required
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">{buttonText}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDrinkModal;
