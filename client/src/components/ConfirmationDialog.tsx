import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading: externalLoading = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isControlledLoading = externalLoading !== undefined;
  const showLoading = isControlledLoading ? externalLoading : isLoading;
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus the dialog when it opens
      dialogRef.current.focus();
      
      // Focus the cancel button by default (for better accessibility when loading)
      if (showLoading) {
        cancelButtonRef.current?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }
  }, [isOpen, showLoading]);
  
  const handleConfirm = async () => {
    if (showLoading) return;
    
    try {
      if (!isControlledLoading) {
        setIsLoading(true);
      }
      
      const result = onConfirm();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      if (!isControlledLoading) {
        setIsLoading(false);
      }
    }
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onCancel();
        break;
      case 'Tab':
        // Trap focus within the dialog
        if (e.shiftKey) {
          if (document.activeElement === cancelButtonRef.current) {
            e.preventDefault();
            confirmButtonRef.current?.focus();
          }
        } else {
          if (document.activeElement === confirmButtonRef.current) {
            e.preventDefault();
            cancelButtonRef.current?.focus();
          }
        }
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div 
        className="confirmation-dialog" 
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id="dialog-title" className="dialog-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={showLoading}
            autoFocus={!showLoading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`btn-primary ${showLoading ? 'opacity-75' : ''}`}
            disabled={showLoading}
            aria-busy={showLoading}
          >
            {showLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="small" color="currentColor" />
                <span>{confirmText}</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
