import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CATEGORY_ICONS = [
  '🍺', '🍻', '🍷', '🥂', '🍾', '🍹',
  '🍸', '🥃', '🥤', '💧', '🧃', '☕',
  '🫖', '🚫', '🥨', '🍟', '🍔', '🍕',
  '🌭', '🥪', '🧀', '🍰', '🍦', '🍽️',
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
        <DialogContent className="w-[92vw] max-w-[380px] bg-[#0e1b35] text-white rounded-2xl border border-[#23355b] p-6 shadow-2xl focus:outline-none [&>button.absolute]:hidden">
          {/* Bouton de fermeture 'x' en haut à droite Stitch */}
          <button
            type="button"
            onClick={() => {
              onClose();
              setShowDeleteConfirm(false);
            }}
            aria-label="Fermer"
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* En-tête centré Stitch */}
          <header className="text-center pt-1 pb-4">
            <DialogTitle className="text-[19px] font-bold text-white tracking-tight leading-snug">
              {isEditMode ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#94a3b8] mt-1.5 leading-relaxed px-1">
              {isEditMode
                ? 'Modifiez le nom et l’icône de la catégorie.'
                : 'Saisissez les informations de la nouvelle catégorie.'}
            </DialogDescription>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ 1 : Nom de la catégorie */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="category-name" className="block text-[13px] font-semibold text-slate-200">
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
                className="w-full h-11 px-3.5 bg-[#08142c] border border-[#23355b] rounded-xl text-white text-[14px] placeholder-[#64748b] focus:outline-none focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] transition-colors"
              />
            </div>

            {/* Champ 2 : Icône (emoji) */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="category-icon" className="block text-[13px] font-semibold text-slate-200">
                  Icône (emoji)
                </label>
                <input
                  id="category-icon"
                  name="category-icon"
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  onBlur={() => setFormData(prev => ({ ...prev, icon: prev.icon.trim() }))}
                  placeholder="🍺"
                  required
                  maxLength={4}
                  aria-label="Saisir un emoji personnalisé"
                  className="w-14 h-9 text-center text-lg bg-[#08142c] border border-[#23355b] rounded-xl text-white focus:outline-none focus:border-[#e11d48] transition-colors"
                />
              </div>

              {/* Palette d'emojis Stitch */}
              <div className="grid grid-cols-6 gap-1.5 pt-1 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                {CATEGORY_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                    className={`h-9 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                      formData.icon === emoji
                        ? 'border-[#e11d48] bg-[#e11d48]/15 ring-1 ring-[#e11d48] shadow-sm'
                        : 'border-[#23355b] bg-[#08142c] hover:bg-[#132244] hover:border-slate-500'
                    }`}
                    aria-label={`Choisir l'icône ${emoji}`}
                    aria-pressed={formData.icon === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Séparateur discret */}
            <div className="pt-2 border-t border-[#23355b]/60"></div>

            {/* Boutons d'action Stitch */}
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 h-11 bg-[#152547] hover:bg-[#1a2d54] text-slate-200 hover:text-white font-semibold text-[14px] rounded-xl border border-[#23355b] transition-colors flex items-center justify-center cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-[#e11d48] to-[#f43f5e] hover:from-[#d0143f] hover:to-[#e11d48] text-white font-semibold text-[14px] rounded-xl shadow-md shadow-rose-950/20 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
              >
                {isEditMode ? 'Modifier' : 'Ajouter'}
              </button>
            </div>

            {/* Bouton suppression en mode modification si onDelete présent */}
            {isEditMode && onDelete && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  Supprimer cette catégorie
                </button>
              </div>
            )}
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
