import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Bookmark } from 'lucide-react';
import { useDocument } from '../hooks';
import { UnifiedToc } from './UnifiedToc';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { Chapter, DocSeries, DocCategory, TocItem } from '../types';

// Lazy load heavy components to reduce initial bundle size
const DocSearch = lazy(() => import('./DocSearch').then(m => ({ default: m.DocSearch })));
const MarkdownRenderer = lazy(() => import('./MarkdownRenderer').then(m => ({ default: m.MarkdownRenderer })));

interface ChapterReaderProps {
  chapter: Chapter;
  series: DocSeries;
  category: DocCategory;
  allChapters: Array<{ chapter: Chapter; series: DocSeries; category: DocCategory }>;
  onBack: () => void;
  onSelectChapter: (category: DocCategory, series: DocSeries, chapter: Chapter) => void;
}

// 将 flat headings 转为 tree 结构
function buildTocFromHeadings(headings: Array<{ level: number; text: string; id: string }>): TocItem[] {
  const toc: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const h of headings) {
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

export function ChapterReader({ chapter, series, category, onBack, onSelectChapter }: ChapterReaderProps) {
  const [showToc, setShowToc] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>(chapter.id);
  const mainRef = useRef<HTMLElement>(null);
  const { content, loading, error, toc, flatHeadings, searchContent, scrollToLine, scrollToHeadingById } = useDocument(chapter.path);
  
  const currentIndex = series.chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? series.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < series.chapters.length - 1 ? series.chapters[currentIndex + 1] : null;

  // 使用 flatHeadings 确保有目录显示
  const displayToc = toc.length > 0 ? toc : buildTocFromHeadings(flatHeadings);

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

  // 切换章节时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveHeading(chapter.id);
  }, [chapter.id]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const offset = 84;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveHeading(id);
  };

  // 处理搜索结果跳转 - 精确到行
  const handleSearchSelect = (result: { type: string; text: string; id?: string; lineIndex?: number }) => {
    if (result.lineIndex !== undefined && result.lineIndex >= 0) {
      scrollToLine(result.lineIndex, 'main');
    } else if (result.id) {
      scrollToHeading(result.id);
    }
  };

  const handlePrevChapter = () => {
    if (prevChapter) {
      onSelectChapter(category, series, prevChapter);
    }
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      onSelectChapter(category, series, nextChapter);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* TOC Sidebar - 固定高度，内部可滚动 */}
      {showToc && (
        <div 
          className="w-80 border-r hidden lg:flex flex-col" 
          style={{ 
            background: 'var(--bg-secondary)', 
            borderColor: 'var(--border-color)',
            height: '100vh',
            flexShrink: 0
          }}
        >
          {/* 顶部工具栏 - 固定 */}
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft className="w-4 h-4" />返回系列
            </button>
            <ThemeToggleButton />
          </div>
          
          {/* 目录内容 - 可滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <UnifiedToc
              series={series}
              chapters={series.chapters}
              currentChapterId={chapter.id}
              headings={displayToc}
              flatHeadings={flatHeadings}
              activeHeading={activeHeading}
              onSelectChapter={(ch) => onSelectChapter(category, series, ch)}
              onSelectHeading={(id, lineIndex) => {
                if (lineIndex !== undefined && lineIndex >= 0) {
                  scrollToLine(lineIndex, 'main');
                } else {
                  scrollToHeadingById(id, 'main');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - 固定 */}
        <header 
          className="h-16 border-b flex items-center justify-between px-4 flex-shrink-0" 
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-4">
            {!showToc && (
              <button onClick={onBack} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{series.title}</span>
              <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>/</span>
              <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{chapter.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 文档内搜索 */}
            <Suspense fallback={<div className="w-8 h-8" />}>
              <DocSearch
                onSearch={searchContent}
                onSelectResult={handleSearchSelect}
                placeholder="搜索本章内容..."
              />
            </Suspense>
            <ThemeToggleButton />
            <button 
              onClick={() => setShowToc(!showToc)} 
              className="hidden lg:flex p-2 rounded-lg text-sm items-center gap-1" 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <List className="w-4 h-4" />目录
            </button>
            <button 
              onClick={() => setShowToc(!showToc)} 
              className="lg:hidden p-2 rounded-lg text-sm" 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              目录
            </button>
          </div>
        </header>

        {/* Content - 可滚动 */}
        <main 
          ref={mainRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    <Bookmark className="w-4 h-4" />
                    <span>第 {currentIndex + 1} / {series.chapters.length} 章</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{chapter.title}</h1>
                  <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{chapter.description}</p>
                </div>
                <Suspense fallback={<div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>加载内容...</div>}>
                  <MarkdownRenderer content={content} />
                </Suspense>
              </motion.article>
            )}

            {/* Chapter Navigation */}
            <div className="mt-16 pt-8 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={handlePrevChapter}
                disabled={!prevChapter}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[150px]">{prevChapter ? prevChapter.title : '上一章'}</span>
                <span className="sm:hidden">上一章</span>
              </button>
              <button
                onClick={handleNextChapter}
                disabled={!nextChapter}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'var(--accent-primary)', color: 'white' }}
              >
                <span className="hidden sm:inline truncate max-w-[150px]">{nextChapter ? nextChapter.title : '下一章'}</span>
                <span className="sm:hidden">下一章</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile TOC Drawer */}
      {showToc && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setShowToc(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div 
            className="absolute left-0 top-0 bottom-0 w-80 flex flex-col" 
            style={{ background: 'var(--bg-secondary)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 移动端侧边栏头部 */}
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{series.title}</span>
              <div className="flex items-center gap-2">
                <ThemeToggleButton />
                <button onClick={() => setShowToc(false)} style={{ color: 'var(--text-secondary)' }}>关闭</button>
              </div>
            </div>
            {/* 移动端侧边栏内容 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-4">
              <UnifiedToc
                series={series}
                chapters={series.chapters}
                currentChapterId={chapter.id}
                headings={displayToc}
                flatHeadings={flatHeadings}
                activeHeading={activeHeading}
                onSelectChapter={(ch) => { onSelectChapter(category, series, ch); setShowToc(false); }}
                onSelectHeading={(id) => { scrollToHeading(id); setShowToc(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
