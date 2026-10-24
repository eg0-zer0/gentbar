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
      <AlertDialogContent className="w-[92vw] max-w-[380px] bg-[#0e1b35] text-white rounded-2xl border border-[#23355b] p-6 shadow-2xl focus:outline-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-lg font-bold">
            {dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-sm mt-2 leading-relaxed">
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex items-center justify-end gap-3">
          <AlertDialogCancel asChild>
            <button 
              className="h-10 px-4 bg-[#152547] hover:bg-[#1a2d54] text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-[#23355b] transition-colors cursor-pointer" 
              type="button"
            >
              {cancelText}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-950/20 transition-colors cursor-pointer border-0"
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
