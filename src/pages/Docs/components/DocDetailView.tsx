import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder } from 'lucide-react';
import { useDocument } from '../hooks';
import { TocNav } from './TocNav';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { SingleDoc, DocCategory, TocItem } from '../types';

// Lazy load heavy components to reduce initial bundle size
const DocSearch = lazy(() => import('./DocSearch').then(m => ({ default: m.DocSearch })));
const MarkdownRenderer = lazy(() => import('./MarkdownRenderer').then(m => ({ default: m.MarkdownRenderer })));

interface DocDetailViewProps {
  doc: SingleDoc;
  category: DocCategory;
  onBack: () => void;
}

// 将 flat headings 转为 tree 结构用于显示
function buildTocFromHeadings(headings: Array<{ level: number; text: string; id: string }>): TocItem[] {
  const toc: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const h of headings) {
    // 跳过 h1
    if (h.level === 1) continue;
    
    const item: TocItem = { ...h, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      toc.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return toc;
}

export function DocDetailView({ doc, category, onBack }: DocDetailViewProps) {
  const { content, loading, error, toc, flatHeadings, searchContent, scrollToLine, scrollToHeadingById, lines } = useDocument(doc.path);
  const [showToc, setShowToc] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const mainRef = useRef<HTMLElement>(null);

  // 使用 flatHeadings 构建目录（包含所有标题）
  const displayToc = toc.length > 0 ? toc : buildTocFromHeadings(flatHeadings);
  const hasToc = flatHeadings.length > 0;

  // 监听标题可见性
  useEffect(() => {
    if (!flatHeadings.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-5% 0px -85% 0px', threshold: 0 }
    );

    const headings = document.querySelectorAll('[data-heading="true"]');
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [flatHeadings, content]);

  const handleSelectHeading = (id: string) => {
    // 优先使用行号跳转（更精确）
    const heading = flatHeadings.find(h => h.id === id);
    if (heading) {
      const lineIndex = lines.findIndex(line => {
        const match = line.match(/^(\s{0,3})(#{1,4})\s+(.+?)(?:\r)?$/);
        return match && match[3].trim() === heading.text;
      });
      if (lineIndex >= 0) {
        scrollToLine(lineIndex, 'main');
      } else {
        scrollToHeadingById(id, 'main');
      }
    }
    setActiveHeading(id);
  };

  // 处理搜索结果跳转 - 精确到行
  const handleSearchSelect = (result: { type: string; text: string; id?: string; lineIndex?: number }) => {
    if (result.lineIndex !== undefined && result.lineIndex >= 0) {
      scrollToLine(result.lineIndex, 'main');
    } else if (result.id) {
      scrollToHeadingById(result.id, 'main');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* TOC Sidebar - 单一滚动区域 */}
      {showToc && hasToc && (
        <div 
          className="w-72 border-r hidden lg:flex flex-col" 
          style={{ 
            background: 'var(--bg-secondary)', 
            borderColor: 'var(--border-color)',
            height: '100vh',
            flexShrink: 0
          }}
        >
          {/* 顶部工具栏 - 固定在侧边栏顶部 */}
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft className="w-4 h-4" />返回
            </button>
            <ThemeToggleButton />
          </div>
          
          {/* 文档信息 - 固定在侧边栏顶部 */}
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Folder className="w-4 h-4" />{category.name}
            </div>
            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{doc.title}</div>
          </div>
          
          {/* 目录区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>目录</h3>
              <TocNav toc={displayToc} activeHeading={activeHeading} onSelect={handleSelectHeading} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - 固定 */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 mc-navbar"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <motion.button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">返回</span>
              </motion.button>

              <div className="flex items-center gap-2">
                {/* 文档内搜索 */}
                <Suspense fallback={<div className="w-8 h-8" />}>
                  <DocSearch
                    onSearch={searchContent}
                    onSelectResult={handleSearchSelect}
                    placeholder="搜索本文档..."
                  />
                </Suspense>
                <ThemeToggleButton />
                {hasToc && (
                  <button 
                    onClick={() => setShowToc(!showToc)} 
                    className="lg:hidden p-2 rounded-lg text-sm" 
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    目录
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content - 可滚动 */}
        <main 
          ref={mainRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-12">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="mb-4" style={{ color: '#ef4444' }}>加载失败</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-white" style={{ background: 'var(--accent-primary)' }}>重试</button>
              </div>
            ) : (
              <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{doc.title}</h1>
                <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>{doc.description}</p>
                <Suspense fallback={<div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>加载内容...</div>}>
                  <MarkdownRenderer content={content} />
                </Suspense>
              </motion.article>
            )}
          </div>
        </main>
      </div>

      {/* Mobile TOC Drawer */}
      {showToc && hasToc && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setShowToc(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div 
            className="absolute left-0 top-0 bottom-0 w-80 flex flex-col" 
            style={{ background: 'var(--bg-secondary)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 移动端侧边栏头部 */}
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>目录</span>
              <button onClick={() => setShowToc(false)} style={{ color: 'var(--text-secondary)' }}>关闭</button>
            </div>
            {/* 移动端侧边栏内容 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-4">
              <TocNav toc={displayToc} activeHeading={activeHeading} onSelect={(id: string) => { handleSelectHeading(id); setShowToc(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
