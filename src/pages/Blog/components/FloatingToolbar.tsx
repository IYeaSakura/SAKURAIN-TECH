import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useTheme } from '@/hooks';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PlantUML } from '@/pages/Docs/components/PlantUML';
import { CodeBlock } from '@/pages/Docs/components/CodeBlock';

interface FloatingToolbarProps {
  onExit: () => void;
  content?: string;
  title?: string;
  className?: string;
}

const ExportProgressDialog = ({ isOpen, progress }: { isOpen: boolean; progress: string }) => {
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
            正在导出PDF
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

const markdownComponents = {
  h1: ({ children }: { children?: any }) => <h1 className="text-3xl font-bold mt-8 mb-4" style={{ color: '#000' }}>{children}</h1>,
  h2: ({ children }: { children?: any }) => <h2 className="text-2xl font-bold mt-6 mb-3" style={{ color: '#000' }}>{children}</h2>,
  h3: ({ children }: { children?: any }) => <h3 className="text-xl font-semibold mt-5 mb-2" style={{ color: '#000' }}>{children}</h3>,
  h4: ({ children }: { children?: any }) => <h4 className="text-lg font-semibold mt-4 mb-2" style={{ color: '#000' }}>{children}</h4>,
  h5: ({ children }: { children?: any }) => <h5 className="text-base font-semibold mt-3 mb-2" style={{ color: '#000' }}>{children}</h5>,
  h6: ({ children }: { children?: any }) => <h6 className="text-sm font-semibold mt-2 mb-2" style={{ color: '#000' }}>{children}</h6>,
  p: ({ children }: { children?: any }) => <p className="my-3 leading-relaxed" style={{ color: '#333' }}>{children}</p>,
  ul: ({ children }: { children?: any }) => <ul className="my-3 ml-6 list-disc" style={{ color: '#333' }}>{children}</ul>,
  ol: ({ children }: { children?: any }) => <ol className="my-3 ml-6 list-decimal" style={{ color: '#333' }}>{children}</ol>,
  li: ({ children }: { children?: any }) => <li className="my-1">{children}</li>,
  a: ({ href, children }: { href?: string; children?: any }) => <a href={href} className="underline" style={{ color: '#0066cc' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ inline, className, children }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    if (language === 'plantuml' || codeString.includes('@startuml')) return <PlantUML code={codeString} />;
    if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: '#f4f4f4', color: '#c7254e', border: '1px solid #ddd' }}>{children}</code>;
    if (language) return <CodeBlock language={language} value={codeString} />;
    return <CodeBlock language="text" value={codeString} />;
  },
  table: ({ children }: { children?: any }) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-300"><table className="min-w-full border-collapse" style={{ color: '#333' }}>{children}</table></div>,
  thead: ({ children }: { children?: any }) => <thead style={{ background: '#f5f5f5' }}>{children}</thead>,
  th: ({ children }: { children?: any }) => <th className="border border-gray-300 px-4 py-3 text-left font-semibold" style={{ color: '#000' }}>{children}</th>,
  td: ({ children }: { children?: any }) => <td className="border border-gray-300 px-4 py-3" style={{ color: '#333' }}>{children}</td>,
  blockquote: ({ children }: { children?: any }) => <blockquote className="border-l-4 pl-4 my-4 py-2 rounded-r" style={{ borderColor: '#ddd', background: '#f9f9f9', color: '#666' }}>{children}</blockquote>,
  hr: () => <hr className="my-6" style={{ borderColor: '#ddd' }} />,
  img: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} className="max-w-full h-auto my-4" />,
};

export function FloatingToolbar({ onExit, content, title, className = '' }: FloatingToolbarProps) {
  const { theme, isTransitioning, toggleTheme } = useTheme();
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
      alert('链接已复制到剪贴板');
    }
  }, []);

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
      alert('无法导出PDF：缺少文章内容');
      return;
    }

    setIsExporting(true);
    setExportProgress('正在渲染内容...');

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!exportContainerRef.current) {
        throw new Error('导出容器未找到');
      }

      setExportProgress('正在加载图片和公式...');

      await new Promise(resolve => setTimeout(resolve, 500));

      await waitForImages(exportContainerRef.current);

      setExportProgress('正在生成PDF...');

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

      setExportProgress('导出完成！');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: unknown) {
      console.error('PDF导出错误:', error);
      alert('PDF导出失败，请重试');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, [content, title]);

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
      id: 'exportPdf',
      icon: FileDown,
      label: '导出PDF',
      onClick: handleExportPDF,
      show: true,
      disabled: isExporting,
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
      <AnimatePresence>
        <ExportProgressDialog isOpen={isExporting} progress={exportProgress} />
      </AnimatePresence>

      <div
        ref={exportContainerRef}
        className="fixed -left-[9999px] top-0 w-[800px] bg-white p-10"
        style={{ fontFamily: 'Microsoft YaHei, SimHei, PingFang SC, STHeiti, sans-serif' }}
      >
        {content && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

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
