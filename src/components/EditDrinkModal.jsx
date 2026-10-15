import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { findDuplicateDrinkName } from '../lib/search';

const EditDrink = ({
  drink,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'edit',
  categoryId,
  categories = []
}) => {
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

  const categoryDrinks = useMemo(() => {
    if (!categoryId || !categories.length) return [];
    const cat = categories.find(c => c.id === categoryId);
    return cat?.drinks || [];
  }, [categoryId, categories]);

  const duplicateDrink = useMemo(() => {
    return findDuplicateDrinkName(categoryDrinks, formData.name, mode === 'edit' ? drink?.id : null);
  }, [categoryDrinks, formData.name, drink, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Veuillez saisir un nom de boisson.');
      return;
    }
    if (formData.price === '' || formData.price === null || formData.price === undefined) {
      toast.error('Veuillez saisir un prix.');
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Veuillez saisir un prix valide.');
      return;
    }
    onSave({
      ...drink,
      name: trimmedName,
      price: parsedPrice,
    });
    onClose();
  };

  const isEditMode = mode === 'edit';

  const bgClass = "bg-card";
  const textClass = "text-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${bgClass} w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 shadow-lg`}>
        <DialogHeader>
          <DialogTitle className={`${textClass} font-semibold mb-1`}>
            {isEditMode ? 'Modifier la boisson' : 'Ajouter une boisson'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mb-3">
            {isEditMode ? 'Modifiez les informations de cette boisson.' : 'Saisissez les informations pour ajouter une nouvelle boisson au menu.'}
          </DialogDescription>
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
              onBlur={() => setFormData(prev => ({ ...prev, name: prev.name.trim() }))}
              placeholder="Ex: Red Bull"
              required
              className="w-full bg-background text-foreground"
            />
            {duplicateDrink && (
              <p
                role="alert"
                className="mt-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-md p-2"
              >
                <AlertTriangle size={15} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Une boisson nommée « <strong className="font-semibold">{duplicateDrink.name}</strong> » existe déjà dans cette catégorie.
                </span>
              </p>
            )}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border mt-4">
            {isEditMode && onDelete ? (
              <Button
                variant="destructive"
                type="button"
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => {
                  onDelete(drink);
                  onClose();
                }}
              >
                Supprimer la boisson
              </Button>
            ) : <div className="hidden sm:block" />}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
              <Button variant="outline" type="button" className="flex-1 sm:flex-initial" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="btn-primary flex-1 sm:flex-initial">
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
