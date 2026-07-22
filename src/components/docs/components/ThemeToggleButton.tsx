import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks';

export function ThemeToggleButton() {
  const { theme, isTransitioning, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} disabled={isTransitioning} className="relative p-2.5 rounded-xl transition-all duration-300 hover:scale-110" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </motion.div>
      </AnimatePresence>
      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2" style={{ background: theme === 'light' ? '#f59e0b' : '#6366f1', borderColor: 'var(--bg-primary)' }} />
    </button>
  );
}
