import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (event: React.MouseEvent<HTMLElement>) => void;
  isTransitioning?: boolean;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, isTransitioning, className }: ThemeToggleProps) {
  const isLight = theme === 'light';

  return (
    <motion.button
      onClick={onToggle}
      disabled={isTransitioning}
      className={cn(
        'relative flex items-center justify-center',
        'w-11 h-11 rounded-xl',
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
        isTransitioning && 'pointer-events-none',
        className
      )}
      style={{
        background: isLight 
          ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
          : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        border: `2px solid ${isLight ? '#f59e0b' : '#6366f1'}`,
        boxShadow: isLight
          ? '0 4px 20px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
          : '0 4px 20px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      whileTap={{ scale: 0.92 }}
      whileHover={{ 
        boxShadow: isLight
          ? '0 8px 30px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
          : '0 8px 30px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      aria-label={isLight ? '切换到暗色模式' : '切换到亮色模式'}
    >
      {/* 背景光晕效果 */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          opacity: isTransitioning ? [0.5, 1, 0.5] : 0,
        }}
        transition={{
          duration: 0.6,
          ease: 'easeInOut',
        }}
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
        }}
      />

      {/* 图标容器 */}
      <div className="relative w-5 h-5">
        <AnimatePresence mode="wait" initial={false}>
          {isLight ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun 
                className="w-5 h-5" 
                style={{ 
                  color: '#f59e0b',
                  filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))',
                }} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon 
                className="w-5 h-5" 
                style={{ 
                  color: '#818cf8',
                  filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.5))',
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 过渡时的脉冲环 */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          style={{
            borderColor: isLight ? '#f59e0b' : '#6366f1',
          }}
        />
      )}
    </motion.button>
  );
}
