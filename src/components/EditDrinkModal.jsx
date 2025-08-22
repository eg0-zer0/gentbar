import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from '../contexts/ThemeContext';

const EditDrinkModal = ({
  drink,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'edit'
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });

  useEffect(() => {
    if (drink) {
      setFormData({
        name: drink.name || '',
        price: typeof drink.price === 'number' ? drink.price.toString() : (drink.price || ''),
      });
    } else {
      setFormData({ name: '', price: '' });
    }
  }, [drink]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.price !== '') {
      onSave({
        ...drink,
        name: formData.name,
        price: parseFloat(formData.price),
      });
      onClose();
    }
  };

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md mx-auto rounded-md p-6`}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la boisson' : 'Ajouter une boisson'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="drink-name">Nom de la boisson</Label>
            <Input
              id="drink-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Red Bull"
              required
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="drink-price">Prix (€)</Label>
            <Input
              id="drink-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ex: 3.50"
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="btn-outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="btn-primary"
            >
              {isEditMode ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
          {isEditMode && onDelete && (
            <Button
              type="button"
              variant="destructive"
              className="btn-destructive w-full mt-4"
              onClick={() => { onDelete(drink); onClose(); }}
            >
              Supprimer cette boisson
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDrinkModal;
