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

import { useTheme } from '../contexts/ThemeContext';

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
  // Classes dynamiques pour les thèmes
  const bgClass = "bg-card";
  const textPrimaryClass = "text-foreground";

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
      <AlertDialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6 shadow-lg`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`${textPrimaryClass} text-lg font-semibold`}>
            {dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-text mt-2">
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex justify-end gap-4">
          <AlertDialogCancel asChild>
            <button className="btn btn-outline" type="button">
              {cancelText}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              className="btn btn-destructive"
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
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
