/**
 * Keyboard Shortcuts Hook for Toolbox
 * 
 * Provides keyboard shortcut support for tools:
 * - Ctrl/Cmd + V: Paste from clipboard
 * - Ctrl/Cmd + C: Copy result when focused
 * - Ctrl/Cmd + Shift + C: Copy result directly
 * 
 * @author SAKURAIN
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardShortcutsOptions {
  onPaste?: (text: string) => void;
  onCopy?: () => string | null;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPaste,
  onCopy,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const lastFocusedRef = useRef<boolean>(false);

  // Handle keyboard events
  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (!enabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + V: Paste
    if (ctrlKey && e.key === 'v' && onPaste) {
      // Let the default paste behavior work for input fields
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || 
                      activeElement instanceof HTMLTextAreaElement;
      
      if (!isInput) {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            onPaste(text);
          }
        } catch (err) {
          console.warn('Failed to read clipboard:', err);
        }
      }
    }

    // Ctrl/Cmd + Shift + C: Copy result directly
    if (ctrlKey && e.shiftKey && e.key === 'C' && onCopy) {
      e.preventDefault();
      try {
        const text = onCopy();
        if (text) {
          await navigator.clipboard.writeText(text);
        }
      } catch (err) {
        console.warn('Failed to copy:', err);
      }
    }
  }, [enabled, onPaste, onCopy]);

  // Handle copy event for regular Ctrl+C
  const handleCopy = useCallback(async (e: ClipboardEvent) => {
    if (!enabled || !onCopy) return;

    const activeElement = document.activeElement;
    const isInput = activeElement instanceof HTMLInputElement || 
                    activeElement instanceof HTMLTextAreaElement;

    // Only intercept copy if not in an input field
    if (!isInput) {
      const text = onCopy();
      if (text) {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          console.warn('Failed to copy:', err);
        }
      }
    }
  }, [enabled, onCopy]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled, handleKeyDown, handleCopy]);

  return {
    lastFocusedRef,
  };
}

// Toast notification for copy success
export function useCopyToast() {
  const showCopyToast = useCallback((message: string = '已复制到剪贴板') => {
    // Create a simple toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: rgba(34, 197, 94, 0.9);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 2000);
  }, []);

  return showCopyToast;
}
