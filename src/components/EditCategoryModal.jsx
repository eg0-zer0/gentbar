import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const EditCategoryModal = ({ category, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        icon: category.icon || '',
      });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.icon) {
      onSave({
        ...category,
        name: formData.name,
        icon: formData.icon,
      });
      onClose();
    }
  };

  const emojiSuggestions = ['🥤', '☕', '🍺', '🍸', '🥃', '🍷', '🧃', '🥛', '🍵', '🧋', '🍹', '🥂'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category?.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Boissons chaudes"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icône (emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Ex: ☕"
              required
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <p className="text-sm text-gray-600 w-full">Suggestions:</p>
              {emojiSuggestions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {category?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;