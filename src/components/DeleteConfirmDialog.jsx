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
  title = "Supprimer la catégorie",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  description
}) => {
  // Classes dynamiques pour les thèmes
  const bgClass = "bg-card";
  const textPrimaryClass = "text-foreground";
  
  // Texte explicatif par défaut si non fourni
  const defaultDescription =
    "Attention : cette action va supprimer la catégorie ainsi que l’ensemble des boissons qu’elle contient. Cette opération est irréversible.";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6 shadow-lg`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`${textPrimaryClass} text-lg font-semibold`}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-text mt-2">
            {description || defaultDescription}
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
