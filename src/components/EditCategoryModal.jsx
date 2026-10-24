import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CATEGORY_ICONS = [
  '🍺', '🍻', '🍷', '🥂', '🍾',
  '🍹', '🍸', '🥃', '🥤', '💧',
  '🧃', '☕', '🫖', '🚫', '🥨',
  '🍟', '🍔', '🍕', '🌭', '🥪',
  '🧀', '🍰', '🍦', '🍽️',
];

const EditCategoryModal = ({ category, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍺',
  });

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
    setShowDeleteConfirm(false);
  };

  const isEditMode = Boolean(category?.id);

  const deleteConfirmationMessage =
    'Attention : cette action va supprimer la catégorie ainsi que l’ensemble des boissons qu’elle contient. Cette opération est irréversible.';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[92vw] max-w-[360px] bg-card border border-border rounded-3xl shadow-2xl p-5 text-card-foreground focus:outline-none [&>button.absolute]:hidden">
          {/* Bouton de fermeture 'x' en haut à droite Stitch */}
          <button
            type="button"
            onClick={() => {
              onClose();
              setShowDeleteConfirm(false);
            }}
            aria-label="Fermer"
            className="absolute top-5 right-5 text-muted-foreground hover:text-card-foreground transition-colors p-1 rounded-lg hover:bg-secondary/50 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* En-tête centré Stitch */}
          <header className="mb-5 text-center">
            <DialogTitle className="text-lg font-bold text-card-foreground tracking-wide">
              {isEditMode ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {isEditMode
                ? 'Modifiez le nom et l’icône de la catégorie.'
                : 'Saisissez les informations de la nouvelle catégorie.'}
            </DialogDescription>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ 1 : Nom de la catégorie */}
            <div className="text-left">
              <label htmlFor="category-name" className="block text-xs font-semibold text-card-foreground mb-2">
                Nom de la catégorie
              </label>
              <input
                id="category-name"
                name="category-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => setFormData(prev => ({ ...prev, name: prev.name.trim() }))}
                placeholder="Ex: Bières au fût"
                required
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Champ 2 : Icône (emoji) */}
            <div className="pt-1 text-left">
              {/* Label & Aperçu de l'icône active alignés */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-card-foreground">
                  Icône (emoji)
                </label>
                <div 
                  className="w-12 h-10 bg-background border border-border rounded-xl flex items-center justify-center text-lg shadow-inner"
                  title="Icône actuelle"
                >
                  {formData.icon}
                </div>
              </div>

              {/* Grille des 24 emojis en 5 colonnes Stitch */}
              <div 
                className="grid grid-cols-5 gap-2" 
                role="radiogroup" 
                aria-label="Sélectionnez un emoji"
              >
                {CATEGORY_ICONS.map((emoji) => {
                  const isSelected = formData.icon === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                      className={`h-10 w-full flex items-center justify-center text-base rounded-xl transition-all active:scale-95 cursor-pointer focus:outline-none ${
                        isSelected
                          ? 'border-2 border-primary bg-primary/15 shadow-sm'
                          : 'bg-background border border-border/60 hover:border-border hover:bg-secondary/60 text-foreground'
                      }`}
                      aria-label={`Choisir l'icône ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions principales Stitch : Annuler / Modifier puis Supprimer la catégorie */}
            <div className="pt-3 space-y-2.5">
              {/* Rangée Annuler & Modifier */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setShowDeleteConfirm(false);
                  }}
                  className="w-full py-2.5 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold rounded-xl border border-border transition-all active:scale-[0.98] cursor-pointer focus:outline-none"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 px-3 text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 focus:outline-none"
                >
                  {isEditMode ? 'Modifier' : 'Ajouter'}
                </button>
              </div>

              {/* Bouton Supprimer pleine largeur Stitch */}
              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 px-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-0 focus:outline-none"
                >
                  Supprimer la catégorie
                </button>
              )}
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
