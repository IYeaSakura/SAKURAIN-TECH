/**
 * Shared UI Components for Toolbox
 * 
 * Reusable components for all tools
 * Self-contained, no external dependencies beyond React
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCcw, ArrowUpDown, X } from 'lucide-react';

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Tool Card Wrapper
interface ToolCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolCard({ title, description, children, className = '' }: ToolCardProps) {
  return (
    <div className={`tool-card ${className}`}>
      <div
        className="p-6"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-subtle)',
          clipPath: clipPathRounded(12),
        }}
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {description && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// Tool Input Area
interface ToolInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export function ToolInput({
  value,
  onChange,
  placeholder = '',
  label,
  rows = 6,
  className = '',
  autoFocus = false,
}: ToolInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for global paste events
  useEffect(() => {
    const handleGlobalPaste = (e: CustomEvent<string>) => {
      // Focus the textarea and set the value
      if (textareaRef.current) {
        textareaRef.current.focus();
        onChange(e.detail);
      }
    };

    window.addEventListener('toolpaste', handleGlobalPaste as EventListener);
    return () => {
      window.removeEventListener('toolpaste', handleGlobalPaste as EventListener);
    };
  }, [onChange]);

  return (
    <div className={`tool-input ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className="w-full p-4 resize-none focus:outline-none transition-colors"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          clipPath: clipPathRounded(8),
        }}
      />
    </div>
  );
}

// Tool Output Area
interface ToolOutputProps {
  value: string;
  label?: string;
  className?: string;
  showCopy?: boolean;
  onCopy?: () => void;
}

export function ToolOutput({
  value,
  label,
  className = '',
  showCopy = true,
  onCopy,
}: ToolOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [value, onCopy]);

  // Listen for global copy events
  useEffect(() => {
    const handleGlobalCopy = () => {
      if (value) {
        handleCopy();
      }
    };

    window.addEventListener('toolcopy', handleGlobalCopy);
    return () => {
      window.removeEventListener('toolcopy', handleGlobalCopy);
    };
  }, [value, handleCopy]);

  return (
    <div className={`tool-output ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        className="relative p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          clipPath: clipPathRounded(8),
        }}
      >
        <pre
          className="whitespace-pre-wrap break-all text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {value || <span style={{ color: 'var(--text-muted)' }}>结果将显示在这里...</span>}
        </pre>
        {showCopy && value && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 transition-colors"
            style={{
              background: copied ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: copied ? '#22c55e' : 'var(--text-muted)',
              clipPath: clipPathRounded(4),
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Tool Button
interface ToolButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ToolButton({
  onClick,
  children,
  variant = 'primary',
  icon,
  disabled = false,
  className = '',
}: ToolButtonProps) {
  const variantStyles = {
    primary: {
      background: 'var(--accent-primary)',
      border: 'var(--accent-primary)',
      color: 'white',
    },
    secondary: {
      background: 'var(--bg-secondary)',
      border: 'var(--border-subtle)',
      color: 'var(--text-primary)',
    },
    danger: {
      background: '#ef4444',
      border: '#ef4444',
      color: 'white',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: style.background,
        border: `2px solid ${style.border}`,
        color: style.color,
        clipPath: clipPathRounded(6),
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

// Tool Actions Bar
interface ToolActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolActions({ children, className = '' }: ToolActionsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

// Swap Button for bidirectional tools
interface SwapButtonProps {
  onSwap: () => void;
  className?: string;
}

export function SwapButton({ onSwap, className = '' }: SwapButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 180 }}
      whileTap={{ scale: 0.9 }}
      onClick={onSwap}
      className={`p-2 transition-colors ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-subtle)',
        color: 'var(--accent-primary)',
        clipPath: clipPathRounded(4),
      }}
      title="交换输入输出"
    >
      <ArrowUpDown className="w-5 h-5" />
    </motion.button>
  );
}

// Clear Button
interface ClearButtonProps {
  onClear: () => void;
  className?: string;
}

export function ClearButton({ onClear, className = '' }: ClearButtonProps) {
  return (
    <ToolButton
      onClick={onClear}
      variant="secondary"
      icon={<RotateCcw className="w-4 h-4" />}
      className={className}
    >
      清空
    </ToolButton>
  );
}

// Error Message
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onDismiss, className = '' }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center justify-between gap-3 p-3 ${className}`}
      style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        color: '#f87171',
        clipPath: clipPathRounded(6),
      }}
    >
      <span className="text-sm">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Info Message
interface InfoMessageProps {
  message: string;
  className?: string;
}

export function InfoMessage({ message, className = '' }: InfoMessageProps) {
  return (
    <div
      className={`p-3 text-sm ${className}`}
      style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid rgba(59, 130, 246, 0.2)',
        color: '#60a5fa',
        clipPath: clipPathRounded(6),
      }}
    >
      {message}
    </div>
  );
}

// Two Column Layout for input/output
interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  centerAction?: React.ReactNode;
  className?: string;
}

export function TwoColumnLayout({
  left,
  right,
  centerAction,
  className = '',
}: TwoColumnLayoutProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 items-start ${className}`}>
      <div>{left}</div>
      <div className="flex flex-col gap-4">
        {centerAction && <div className="flex justify-center">{centerAction}</div>}
        {right}
      </div>
    </div>
  );
}

// Keyboard Shortcut Hint
interface KeyboardShortcutProps {
  keys: string[];
  description: string;
  className?: string;
}

export function KeyboardShortcut({ keys, description, className = '' }: KeyboardShortcutProps) {
  return (
    <div className={`inline-flex items-center gap-2 text-xs ${className}`} style={{ color: 'var(--text-muted)' }}>
      <span className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd
              className="px-1.5 py-0.5 text-xs font-mono"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
              }}
            >
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="mx-0.5">+</span>}
          </span>
        ))}
      </span>
      <span>{description}</span>
    </div>
  );
}

// Keyboard Shortcuts Panel
interface KeyboardShortcutsPanelProps {
  shortcuts: { keys: string[]; description: string }[];
  className?: string;
}

export function KeyboardShortcutsPanel({ shortcuts, className = '' }: KeyboardShortcutsPanelProps) {
  return (
    <div
      className={`p-3 ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-subtle)',
        clipPath: clipPathRounded(6),
      }}
    >
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        快捷键
      </div>
      <div className="flex flex-wrap gap-3">
        {shortcuts.map((shortcut, i) => (
          <KeyboardShortcut key={i} keys={shortcut.keys} description={shortcut.description} />
        ))}
      </div>
    </div>
  );
}
