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
        'relative p-2.5 rounded-xl transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        theme === 'light'
          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 focus-visible:ring-slate-600',
        isTransitioning && 'pointer-events-none',
        className
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  );
}
