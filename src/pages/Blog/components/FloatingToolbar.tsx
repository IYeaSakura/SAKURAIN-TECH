import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Moon, 
  Sun, 
  Maximize,
  Minimize,
  Share2,
  Printer,
  ArrowUp
} from 'lucide-react';
import { useTheme } from '@/hooks';

interface FloatingToolbarProps {
  onExit: () => void;
  className?: string;
}

export function FloatingToolbar({ onExit, className = '' }: FloatingToolbarProps) {
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const tools = [
    {
      id: 'exit',
      icon: X,
      label: '退出',
      onClick: onExit,
      show: true,
    },
    {
      id: 'theme',
      icon: isDark ? Sun : Moon,
      label: isDark ? '日间模式' : '夜间模式',
      onClick: toggleTheme,
      show: true,
      rotating: isTransitioning,
    },
    {
      id: 'fullscreen',
      icon: isFullscreen ? Minimize : Maximize,
      label: isFullscreen ? '退出全屏' : '全屏',
      onClick: handleFullscreen,
      show: true,
    },
    {
      id: 'print',
      icon: Printer,
      label: '打印',
      onClick: handlePrint,
      show: true,
    },
    {
      id: 'share',
      icon: Share2,
      label: '分享',
      onClick: handleShare,
      show: true,
    },
    {
      id: 'scrollTop',
      icon: ArrowUp,
      label: '回到顶部',
      onClick: scrollToTop,
      show: showScrollTop,
    },
  ];

  return (
    <>
      <div
        className={`fixed right-6 z-40 hidden md:flex flex-col justify-center ${className}`}
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          height: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          <div
            className="rounded-2xl p-2 flex flex-col gap-1"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {tools.map((tool, index) => (
              tool.show && (
                <motion.button
                  key={tool.id}
                  initial={tool.id === 'scrollTop' ? undefined : { opacity: 0, scale: 0.8 }}
                  animate={tool.id === 'scrollTop' ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={tool.onClick}
                  disabled={tool.id === 'theme' && isTransitioning}
                  className="relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    width: '48px',
                    height: '48px',
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    background: 'var(--bg-secondary)',
                    color: 'var(--accent-primary)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tool.icon 
                    className={`w-5 h-5 ${tool.rotating ? 'animate-spin' : ''}`} 
                  />
                  
                  <span
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {tool.label}
                  </span>
                </motion.button>
              )
            ))}
          </div>
        </motion.div>
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4 pt-2 print:hidden"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary) 0%, var(--bg-primary) 80%, transparent 100%)',
        }}
      >
        <div
          className="rounded-2xl p-2 flex items-center justify-around"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {tools.map((tool) => (
            tool.show && tool.id !== 'print' && (
              <button
                key={tool.id}
                onClick={tool.onClick}
                disabled={tool.id === 'theme' && isTransitioning}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                <tool.icon className={`w-5 h-5 ${tool.rotating ? 'animate-spin' : ''}`} />
                <span className="text-[10px]">{tool.label}</span>
              </button>
            )
          ))}
        </div>
      </div>
    </>
  );
}
