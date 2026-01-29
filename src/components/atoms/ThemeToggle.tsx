import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (event: React.MouseEvent<HTMLElement>) => void;
  isTransitioning?: boolean;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, isTransitioning, className }: ThemeToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={isTransitioning}
      className={cn(
        'relative p-2 mc-icon-box transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'focus:outline-none',
        isTransitioning && 'pointer-events-none',
        className
      )}
      style={{
        width: '44px',
        height: '44px',
        borderColor: 'var(--border-subtle)',
      }}
      whileTap={{ scale: 0.95 }}
      aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        ) : (
          <Moon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        )}
      </motion.div>
    </motion.button>
  );
}
