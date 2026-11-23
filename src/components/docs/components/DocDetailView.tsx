import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder } from 'lucide-react';
import { useDocumentContent } from '../hooks';
import { TocNav } from './TocNav';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { SingleDoc, DocCategory, TocItem } from '../types';

// Lazy load heavy components to reduce initial bundle size
const DocSearch = lazy(() => import('./DocSearch').then(m => ({ default: m.DocSearch })));
const MarkdownRenderer = lazy(() => import('@/components/markdown/MarkdownRenderer').then(m => ({ default: m.MarkdownRenderer })));

interface DocDetailViewProps {
  doc: SingleDoc;
  category: DocCategory;
  /** 服务端 SSG 注入的文档 markdown 正文（gray-matter 已去 frontmatter） */
  content: string;
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

export function DocDetailView({ doc, category, content, onBack }: DocDetailViewProps) {
  const { toc, flatHeadings, searchContent, scrollToLine, scrollToHeadingById, headingLineMap } = useDocumentContent(content);
  const [showToc, setShowToc] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const mainRef = useRef<HTMLElement>(null);

  // 移动端目录默认收起，避免一进文档页就弹出抽屉并挂载两份目录树。
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) setShowToc(false);
  }, []);

  // 使用 flatHeadings 构建目录（包含所有标题）；仅在正文变化时重算。
  const displayToc = useMemo(
    () => (toc.length > 0 ? toc : buildTocFromHeadings(flatHeadings)),
    [toc, flatHeadings]
  );
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
      const lineIndex = headingLineMap.get(id);
      if (lineIndex !== undefined) {
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
    <div className="flex h-screen overflow-hidden">
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
          <div className="p-4 border-b-2 flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 border-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />返回
            </button>
            <ThemeToggleButton />
          </div>
          
          {/* 文档信息 - 固定在侧边栏顶部 */}
          <div className="p-4 border-b-2 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <Folder className="h-3.5 w-3.5" />{category.name}
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}>{doc.title}</div>
          </div>
          
          {/* 目录区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>目录</h3>
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
                className="inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  boxShadow: '4px 4px 0 var(--border-subtle)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>返回</span>
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
                    className="lg:hidden border-2 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider" 
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
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
            <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {content && content.trim() ? (
                <Suspense fallback={<div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>加载内容...</div>}>
                  <MarkdownRenderer content={content} />
                </Suspense>
              ) : (
                <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                  暂无内容
                </div>
              )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-12 flex items-center gap-4 border-2 p-5"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '4px 4px 0 var(--border-subtle)',
                  }}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        本作品采用
                      </span>
                      <a
                        href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm transition-all duration-200 hover:underline"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        CC BY-NC-ND 4.0
                      </a>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        许可协议
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: '1.4' }}>
                      署名-非商业性使用-禁止演绎
                    </div>
                  </div>
                </motion.div>
              </motion.article>
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
