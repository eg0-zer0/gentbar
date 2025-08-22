import React, { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { useTheme } from '../contexts/ThemeContext';

const EditCategoryModal = ({ category, isOpen, onClose, onSave }) => {
  const { theme } = useTheme();

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
    } else {
      setFormData({ name: '', icon: '' });
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

  // Suggestions d’émojis
  const emojiSuggestions = ['🥤', '☕', '🍺', '🍸', '🥃', '🍷', '🧃', '🥛', '🍵', '🧋', '🍹', '🥂'];

  const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6`}>
        <DialogHeader>
          <DialogTitle className={`${textClass} text-xl font-semibold mb-4`}>
            {category?.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la catégorie */}
          <div>
            <Label htmlFor="category-name" className={`${textClass} block mb-1`}>
              Nom de la catégorie
            </Label>
            <Input
              id="category-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Boissons chaudes"
              required
              className="w-full"
            />
          </div>

          {/* Icône (emoji) */}
          <div>
            <Label htmlFor="category-icon" className={`${textClass} block mb-1`}>
              Icône (emoji)
            </Label>
            <Input
              id="category-icon"
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Ex: ☕"
              required
              maxLength={2}
              className="w-full"
            />
          </div>

          {/* Suggestions emojis */}
          <div className="flex flex-wrap gap-2">
            {emojiSuggestions.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                aria-label={`Choisir l'émoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button className="btn-primary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="btn-primary">
              {category?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
