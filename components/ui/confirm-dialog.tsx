"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Prevent dialog from closing by default if clicked on backdrop, we handle it custom
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto rounded-2xl w-full max-w-sm"
    >
      <div className="animate-fade-in rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-6 text-left shadow-[var(--shadow-lg)]">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">{title}</h2>
        <p className="text-sm text-[color:var(--muted)] mb-6">{description}</p>
        
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "En cours..." : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
