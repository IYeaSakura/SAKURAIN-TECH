import { useState, useEffect, useRef, Component, Suspense, lazy, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UnifiedToc } from './UnifiedToc';
import { ThemeToggleButton } from './ThemeToggleButton';
import { CodeBlock } from './CodeBlock';
import { PlantUML } from './PlantUML';
import type { Chapter, DocSeries, DocCategory, TocItem } from '../types';

const DocSearch = lazy(() => import('./DocSearch').then(m => ({ default: m.DocSearch })));

// 错误边界组件
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: any) {
    console.error('ChapterReader Error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'var(--bg-primary)' }}>
          <p className="mb-4 text-lg" style={{ color: '#ef4444' }}>文档渲染出错</p>
          <p className="mb-4 text-sm text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



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

// 简单的 markdown 组件
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-12 mb-6 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }} data-heading="true">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-10 mb-4 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }} data-heading="true">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-8 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }} data-heading="true">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-lg font-semibold mt-6 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }} data-heading="true">{children}</h4>,
  p: ({ children }: any) => <p className="my-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
  ul: ({ children }: any) => <ul className="my-4 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }: any) => <ol className="my-4 ml-6 list-decimal" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }: any) => <li className="my-1">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="underline hover:no-underline transition-colors" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ inline, className, children }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    if (language === 'plantuml' || codeString.includes('@startuml')) {
      return <PlantUML code={codeString} />;
    }
    if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>{children}</code>;
    if (language) return <CodeBlock language={language} value={codeString} />;
    return <CodeBlock language="text" value={codeString} />;
  },
  table: ({ children }: any) => <div className="overflow-x-auto my-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}><table className="min-w-full border-collapse" style={{ borderColor: 'var(--border-color)' }}>{children}</table></div>,
  thead: ({ children }: any) => <thead style={{ background: 'var(--bg-secondary)' }}>{children}</thead>,
  th: ({ children }: any) => <th className="border px-4 py-3 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>,
  td: ({ children }: any) => <td className="border px-4 py-3 whitespace-pre-line" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{children}</td>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
};

// 解析标题
function parseHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').replace(/^-+|-+$/g, '').substring(0, 50) || 'heading';
      headings.push({ level: match[1].length, text, id });
    }
  }
  return headings;
}

export function ChapterReader({ chapter, series, category, onBack, onSelectChapter }: ChapterReaderProps) {
  const [showToc, setShowToc] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>(chapter.id);
  const mainRef = useRef<HTMLElement>(null);
  
  // 直接使用 fetch 加载内容，类似博客
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flatHeadings, setFlatHeadings] = useState<Array<{ level: number; text: string; id: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    fetch(chapter.path)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        if (!cancelled) {
          setContent(text);
          setFlatHeadings(parseHeadings(text));
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, [chapter.path]);
  
  // 简单的搜索功能
  const searchContent = (query: string) => {
    if (!query.trim() || !content) return [];
    const lines = content.split('\n');
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (let i = 0; i < lines.length && results.length < 20; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'content',
          text: lines[i].trim().substring(0, 80),
          lineIndex: i
        });
      }
    }
    return results;
  };
  
  // 滚动到指定行
  const scrollToLine = (lineIndex: number) => {
    const container = mainRef.current;
    if (!container) return;
    const paragraphs = container.querySelectorAll('p, li, h1, h2, h3, h4');
    if (paragraphs[lineIndex]) {
      paragraphs[lineIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentIndex = series.chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? series.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < series.chapters.length - 1 ? series.chapters[currentIndex + 1] : null;

  // 使用 flatHeadings 确保有目录显示
  const displayToc = buildTocFromHeadings(flatHeadings);

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

  // 滚动到指定 heading ID
  const scrollToHeadingById = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
    }
  };

  // 处理搜索结果跳转 - 精确到行
  const handleSearchSelect = (result: { type: string; text: string; id?: string; lineIndex?: number }) => {
    if (result.lineIndex !== undefined && result.lineIndex >= 0) {
      scrollToLine(result.lineIndex);
    } else if (result.id) {
      scrollToHeadingById(result.id);
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
    <ErrorBoundary>
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
                  scrollToLine(lineIndex);
                } else {
                  scrollToHeadingById(id);
                }
              }}
            />
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
                    placeholder="搜索本章内容..."
                  />
                </Suspense>
                <ThemeToggleButton />
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="hidden lg:flex p-2 rounded-lg text-sm items-center gap-1"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <List className="w-4 h-4" />目录
                </button>
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="lg:hidden p-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  目录
                </button>
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
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
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
    </ErrorBoundary>
  );
}
