import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'category',
  item,
  title,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  description
}) => {
  const dialogTitle =
    title ||
    (type === 'drink'
      ? `Supprimer ${item?.name ? `« ${item.name} »` : 'la boisson'} ?`
      : `Supprimer ${item?.name ? `la catégorie « ${item.name} »` : 'la catégorie'} ?`);

  const dialogDescription =
    description ||
    (type === 'drink'
      ? `Êtes-vous sûr de vouloir supprimer ${item?.name ? `« ${item.name} »` : 'cette boisson'} du menu ? Cette action est irréversible.`
      : "Attention : cette action va supprimer la catégorie ainsi que l’ensemble des boissons qu’elle contient. Cette opération est irréversible.");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-[92vw] max-w-[380px] bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-2xl focus:outline-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-foreground text-lg font-bold">
            {dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm mt-2 leading-relaxed">
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex items-center justify-end gap-3">
          <AlertDialogCancel asChild>
            <button 
              className="h-10 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:text-card-foreground font-semibold text-xs rounded-xl border border-border transition-colors cursor-pointer" 
              type="button"
            >
              {cancelText}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              className="h-10 px-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer border-0"
              type="button"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
