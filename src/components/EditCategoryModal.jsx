import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CATEGORY_ICONS = [
  '🍺', '🍻', '🍷', '🥂', '🍾', '🍹', '🍸', '🥃',
  '🥤', '💧', '🧃', '☕', '🫖', '🚫',
  '🥨', '🍟', '🍔', '🍕', '🌭', '🥪', '🧀', '🍰',
];

const EditCategoryModal = ({ category, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍺',
  });

  // Etat pour contrôle de la modale de confirmation suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        icon: category.icon || '🍺',
      });
    } else {
      setFormData({ name: '', icon: '🍺' });
    }
  }, [category, isOpen]);

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
        <DialogContent className={`${bgClass} w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 shadow-lg`}>
          <DialogHeader>
            <DialogTitle className={`${textClass} text-xl font-semibold mb-1`}>
              {category?.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-3">
              {category?.id ? 'Modifiez le nom et l’icône de la catégorie.' : 'Saisissez les informations de la nouvelle catégorie.'}
            </DialogDescription>
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
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="category-icon" className={textClass}>Icône (emoji)</Label>
                <Input
                  id="category-icon"
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  onBlur={() => setFormData(prev => ({ ...prev, icon: prev.icon.trim() }))}
                  placeholder="🍺"
                  required
                  maxLength={4}
                  aria-label="Saisir un emoji personnalisé"
                  className="w-16 h-9 text-center text-lg bg-background text-foreground px-2"
                />
              </div>
              <div className="grid grid-cols-8 gap-1.5 pt-1">
                {CATEGORY_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                    className={`h-9 rounded-md text-lg flex items-center justify-center border transition-colors ${
                      formData.icon === emoji
                        ? 'border-primary bg-primary/15 ring-1 ring-primary'
                        : 'border-border bg-background hover:bg-accent'
                    }`}
                    aria-label={`Choisir l'icône ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border mt-4">
              {category?.id ? (
                <Button
                  variant="destructive"
                  type="button"
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer la catégorie
                </Button>
              ) : <div className="hidden sm:block" />}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <Button variant="outline" type="button" className="flex-1 sm:flex-initial" onClick={() => { onClose(); setShowDeleteConfirm(false); }}>
                  Annuler
                </Button>
                <Button type="submit" className="btn-primary flex-1 sm:flex-initial">
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
