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
  title,
  description,
  confirmText = "Supprimer",
  cancelText = "Annuler"
}) => {
  const { theme } = useTheme();

  const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-700';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`${textPrimaryClass} text-lg font-semibold`}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className={`${textSecondaryClass} mt-2`}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex justify-end gap-4">
          <AlertDialogCancel asChild>
            <button className="btn btn-outline">
              {cancelText}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              className="btn btn-destructive"
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
