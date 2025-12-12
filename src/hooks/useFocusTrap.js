// Custom hook for managing focus trap in modals

import { useEffect, useRef } from 'react';

export const useFocusTrap = (isOpen) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElementRef.current = document.activeElement;

    // Find all focusable elements in the modal
    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');
      
      return Array.from(modalRef.current.querySelectorAll(focusableSelectors));
    };

    // Focus the first focusable element
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // Handle tab key navigation
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: move focus to last element if currently on first
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move focus to first element if currently on last
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Set initial focus after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(focusFirstElement, 100);

    // Add event listener for tab navigation
    document.addEventListener('keydown', handleKeyDown);

    // Disable body scroll
    document.body.style.overflow = 'hidden';

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        // This should be handled by the parent component
        // We'll dispatch a custom event that the modal can listen to
        const escapeEvent = new CustomEvent('modal-escape');
        document.dispatchEvent(escapeEvent);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return modalRef;
};