import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks';

export function ThemeToggleButton() {
  const { theme, isTransitioning, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className="relative flex h-8 w-8 items-center justify-center border-2 transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-60"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
