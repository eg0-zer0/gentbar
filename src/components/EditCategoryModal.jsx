import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from '../contexts/ThemeContext';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const EditCategoryModal = ({ category, isOpen, onClose, onSave, onDelete }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
  });

  // Etat pour contrôle de la modale de confirmation suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const trimmedName = formData.name.trim();
    const trimmedIcon = formData.icon.trim();
    if (!trimmedName) {
      toast.error('Veuillez saisir un nom de catégorie.');
      return;
    }
    if (!trimmedIcon) {
      toast.error('Veuillez saisir une icône pour la catégorie.');
      return;
    }
    onSave({
      ...category,
      name: trimmedName,
      icon: trimmedIcon,
    });
    onClose();
    setShowDeleteConfirm(false); // Assurer que confirmation est fermée à la sauvegarde aussi
  };

  const bgClass = "bg-card";
  const textClass = "text-foreground";

  const deleteConfirmationMessage =
    'Attention : cette action va supprimer la catégorie ainsi que l’ensemble des boissons qu’elle contient. Cette opération est irréversible.';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6 shadow-lg`}>
          <DialogHeader>
            <DialogTitle className={`${textClass} text-xl font-semibold mb-4`}>
              {category?.id ? 'Modifier la catégorie' : 'Ajouter'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category-name" className={`${textClass} block mb-1`}>Nom de la catégorie</Label>
              <Input
                id="category-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => setFormData(prev => ({ ...prev, name: prev.name.trim() }))}
                placeholder="Ex: Boissons chaudes"
                required
                className="w-full bg-background text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="category-icon" className={`${textClass} block mb-1`}>Icône (emoji)</Label>
              <Input
                id="category-icon"
                type="text"
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                onBlur={() => setFormData(prev => ({ ...prev, icon: prev.icon.trim() }))}
                placeholder="Ex: ☕"
                required
                maxLength={2}
                className="w-full bg-background text-foreground"
              />
            </div>

            {/* Place pour les emojis ici */}

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
              {category?.id ? (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer la catégorie
                </Button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <Button variant="outline" type="button" onClick={() => { onClose(); setShowDeleteConfirm(false); }}>
                  Annuler
                </Button>
                <Button type="submit" className="btn-primary">
                  {category?.id ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(category);
          setShowDeleteConfirm(false);
          onClose();
        }}
        title="Supprimer la catégorie"
        description={deleteConfirmationMessage}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </>
  );
};

export default EditCategoryModal;
