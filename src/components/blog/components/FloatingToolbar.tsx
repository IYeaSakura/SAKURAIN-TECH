import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Moon,
  Sun,
  Maximize,
  Minimize,
  Share2,
  Printer,
  FileDown,
  ArrowUp,
  Loader2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme, useTranslation } from '@/hooks';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';

interface FloatingToolbarProps {
  onExit: () => void;
  content?: string;
  title?: string;
  className?: string;
}

const ExportProgressDialog = ({ isOpen, title, progress }: { isOpen: boolean; title: string; progress: string }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-2xl p-8 max-w-md w-full mx-4"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            {progress}
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export function FloatingToolbar({ onExit, content, title, className = '' }: FloatingToolbarProps) {
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const exportContainerRef = useRef<HTMLDivElement>(null);
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
      alert(t.blog.linkCopied);
    }
  }, [t.blog.linkCopied]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const waitForImages = (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    return Promise.all(promises).then(() => {});
  };

  const handleExportPDF = useCallback(async () => {
    if (!content || !title) {
      alert(t.blog.exportPDFMissingContent);
      return;
    }

    setIsExporting(true);
    setExportProgress(t.blog.exportPDFRendering);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!exportContainerRef.current) {
        throw new Error(t.blog.exportContainerNotFound);
      }

      setExportProgress(t.blog.exportPDFLoadingAssets);

      await new Promise(resolve => setTimeout(resolve, 500));

      await waitForImages(exportContainerRef.current);

      setExportProgress(t.blog.exportPDFGenerating);

      // Dynamic import: html2pdf.js depends on browser globals (self/window) and will throw during SSR.
      const { default: html2pdf } = await import('html2pdf.js');

      const element = exportContainerRef.current.cloneNode(true) as HTMLElement;
      element.style.padding = '40px';
      element.style.fontFamily = 'Microsoft YaHei, SimHei, PingFang SC, STHeiti, sans-serif';
      element.style.fontSize = '16px';
      element.style.lineHeight = '1.6';
      element.style.color = '#333';
      element.style.backgroundColor = '#fff';
      element.style.width = '100%';

      const opt = {
        margin: 10,
        filename: `${title}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();

      setExportProgress(t.blog.exportPDFComplete);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: unknown) {
      console.error('PDF export error:', error);
      alert(t.blog.exportPDFFailed);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, [content, title, t]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const tools = [
    {
      id: 'exit',
      icon: X,
      label: t.blog.floatingToolbar.exit,
      onClick: onExit,
      show: true,
    },
    {
      id: 'theme',
      icon: isDark ? Sun : Moon,
      label: isDark ? t.blog.floatingToolbar.dayMode : t.blog.floatingToolbar.nightMode,
      onClick: toggleTheme,
      show: true,
      rotating: isTransitioning,
    },
    {
      id: 'fullscreen',
      icon: isFullscreen ? Minimize : Maximize,
      label: isFullscreen ? t.blog.floatingToolbar.exitFullscreen : t.blog.floatingToolbar.fullscreen,
      onClick: handleFullscreen,
      show: true,
    },
    {
      id: 'print',
      icon: Printer,
      label: t.blog.floatingToolbar.print,
      onClick: handlePrint,
      show: true,
    },
    {
      id: 'exportPdf',
      icon: FileDown,
      label: t.blog.floatingToolbar.exportPDF,
      onClick: handleExportPDF,
      show: true,
      disabled: isExporting,
    },
    {
      id: 'share',
      icon: Share2,
      label: t.blog.floatingToolbar.share,
      onClick: handleShare,
      show: true,
    },
    {
      id: 'scrollTop',
      icon: ArrowUp,
      label: t.blog.floatingToolbar.backToTop,
      onClick: scrollToTop,
      show: showScrollTop,
    },
  ];

  return (
    <>
      <AnimatePresence>
        <ExportProgressDialog isOpen={isExporting} title={t.blog.exportingPDF} progress={exportProgress} />
      </AnimatePresence>

      {/* PDF 导出用的离屏副本：只在真正导出时挂载。
          此前它在每篇博客页都把整篇文章再渲染一遍（KaTeX / 代码高亮 / 图片全跑两次），
          是文章页最大的一笔无谓渲染开销。用 token 覆盖保证离屏副本始终是浅色打印配色。 */}
      {(isExporting || exportProgress) && content && (
        <div
          ref={exportContainerRef}
          className="fixed -left-[9999px] top-0 w-[800px] bg-white p-10"
          style={{
            fontFamily: 'Microsoft YaHei, SimHei, PingFang SC, STHeiti, sans-serif',
            '--text-primary': '#000',
            '--text-secondary': '#333',
            '--text-muted': '#666',
            '--accent-primary': '#0066cc',
            '--border-color': '#ddd',
            '--border-subtle': '#ddd',
            '--bg-primary': '#fff',
            '--bg-secondary': '#f5f5f5',
            '--bg-card': '#fff',
          } as CSSProperties}
        >
          <MarkdownRenderer content={content} />
        </div>
      )}

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
                  transition={{ 
                    delay: 0.5 + index * 0.1,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  onClick={tool.onClick}
                  disabled={tool.disabled || (tool.id === 'theme' && isTransitioning)}
                  className="relative p-3 rounded-xl group flex items-center justify-center toolbar-button"
                  style={{
                    width: '48px',
                    height: '48px',
                  }}
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
            tool.show && tool.id !== 'print' && tool.id !== 'exportPdf' && (
              <button
                key={tool.id}
                onClick={tool.onClick}
                disabled={tool.disabled || (tool.id === 'theme' && isTransitioning)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl group toolbar-button"
              >
                <tool.icon className={`w-5 h-5 ${tool.rotating ? 'animate-spin' : ''}`} />
                <span className="text-[10px]">{tool.label}</span>
              </button>
            )
          ))}
        </div>
      </div>
      
      <style>{`
        .toolbar-button {
          background: transparent;
          color: var(--text-secondary);
          transition: none;
        }
        .toolbar-button:hover:not(:disabled) {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          transform: scale(1.1);
        }
        .toolbar-button:active:not(:disabled) {
          transform: scale(0.95);
        }
        .toolbar-button:disabled {
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
