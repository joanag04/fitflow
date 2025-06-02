import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import ConfirmationDialog from './ConfirmationDialog';
import './NutritionLogOptionsMenu.css';

interface NutritionLogOptionsMenuProps {
  logId: string;
  onDelete: () => void;
}

const NutritionLogOptionsMenu: React.FC<NutritionLogOptionsMenuProps> = ({ logId, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Store the last focused element to return focus after dialog closes
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  // Close menu when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape as EventListener);
    return () => document.removeEventListener('keydown', handleEscape as EventListener);
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
    };
  }, [isOpen]);

  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    setTimeout(() => {
      navigate(`/nutrition/logs/${logId}/edit`);
      setIsOpen(false);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    lastFocusedElement.current = document.activeElement as HTMLElement;
    setTimeout(() => {
      setShowConfirmDialog(true);
      setIsOpen(false);
    }, 300);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Call the onDelete function and wait for it to complete
      await onDelete();
      
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error deleting nutrition log:', error);
    } finally {
      setIsDeleting(false);
      // Return focus to the last focused element after a short delay
      setTimeout(() => {
        lastFocusedElement.current?.focus();
      }, 0);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    // Return focus to the last focused element after a short delay
    setTimeout(() => {
      lastFocusedElement.current?.focus();
    }, 0);
  };

  return (
    <div className="nutrition-log-options" ref={menuRef}>
      <button 
        className="options-button" 
        onClick={(e) => {
          e.stopPropagation();
          createRipple(e as any);
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Options menu"
      >
        <FaEllipsisV aria-hidden="true" />
      </button>
      
      <div 
        className="options-menu" 
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-button"
        aria-hidden={!isOpen}
        style={{
          display: isOpen ? 'block' : 'none',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-10px)'
        }}
      >
          <button
            className="options-item"
            onClick={handleEdit}
            onKeyDown={(e) => handleKeyDown(e, () => handleEdit(e as any))}
          >
            <FaEdit className="menu-item-icon" aria-hidden="true" />
            <span>Edit</span>
          </button>
          <button
            className="options-item delete"
            onClick={handleDeleteClick}
            onKeyDown={(e) => handleKeyDown(e, () => handleDeleteClick(e as any))}
          >
            <FaTrash className="menu-item-icon" aria-hidden="true" />
            <span>Delete</span>
          </button>
      
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="Delete Nutrition Log"
          message="Are you sure you want to delete this nutrition log? This action cannot be undone."
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default NutritionLogOptionsMenu;
