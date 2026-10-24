import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, X } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-[360px] bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-2xl [&>button.absolute]:hidden">
        {/* Bouton de fermeture 'x' en haut à droite (Stitch) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 text-muted-foreground hover:text-card-foreground transition-colors p-1 rounded-lg hover:bg-secondary/50 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* En-tête centré Stitch */}
        <header className="text-center pt-1 pb-5">
          <DialogTitle className="text-[19px] font-bold text-card-foreground tracking-tight leading-snug">
            {isEditMode ? 'Modifier la boisson' : 'Ajouter une boisson'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed px-1">
            {isEditMode
              ? 'Modifiez les informations de cette boisson.'
              : 'Saisissez les informations pour ajouter une nouvelle boisson au menu.'}
          </DialogDescription>
        </header>

        {/* Formulaire Stitch */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ 1 : Nom de la boisson */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[13px] font-semibold text-card-foreground" htmlFor="drink-name">
              Nom de la boisson
            </label>
            <input
              id="drink-name"
              name="drink-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => setFormData(prev => ({ ...prev, name: prev.name.trim() }))}
              placeholder="Ex: Red Bull"
              required
              className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {duplicateDrink && (
              <p
                role="alert"
                className="mt-2 text-xs text-price flex items-center gap-1.5 bg-price/15 border border-price/30 rounded-lg p-2"
              >
                <AlertTriangle size={15} className="shrink-0 text-price" />
                <span>
                  Une boisson nommée « <strong className="font-semibold">{duplicateDrink.name}</strong> » existe déjà dans cette catégorie.
                </span>
              </p>
            )}
          </div>

          {/* Champ 2 : Prix (€) */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[13px] font-semibold text-card-foreground" htmlFor="drink-price">
              Prix (€)
            </label>
            <input
              id="drink-price"
              name="drink-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ex: 3.50"
              required
              className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Séparateur discret */}
          <div className="pt-2 border-t border-border/60"></div>

          {/* Boutons d'action Stitch */}
          <div className="flex items-center gap-3 pt-0.5">
            {/* Bouton secondaire : Annuler */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:text-card-foreground font-semibold text-[14px] rounded-xl border border-border transition-colors flex items-center justify-center cursor-pointer"
            >
              Annuler
            </button>
            {/* Bouton primaire : Ajouter / Modifier */}
            <button
              type="submit"
              className="flex-1 h-11 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-primary-foreground font-semibold text-[14px] rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
            >
              {isEditMode ? 'Modifier' : 'Ajouter'}
            </button>
          </div>

          {/* Bouton suppression en mode modification si présent */}
          {isEditMode && onDelete && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onDelete(drink);
                  onClose();
                }}
                className="text-xs text-destructive hover:bg-destructive/10 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                Supprimer cette boisson
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDrink;
