import { useState, useEffect, useMemo, useCallback, useRef, type ComponentType } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { encode } from 'plantuml-encoder';
import { 
  BookOpen, ChevronRight, FileText, ArrowLeft, FolderOpen, Menu, X,
  Rocket, Briefcase, Code, Search, Home, Sun, Moon,
  ZoomIn, ZoomOut, RotateCcw, type LucideProps
} from 'lucide-react';
import { useConfig, useTheme } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticCursor, VelocityCursor } from '@/components/effects';

// ==================== 类型定义 ====================
interface Doc { id: string; title: string; description: string; path: string; }
interface DocCategory { id: string; name: string; icon: string; docs: Doc[]; }
interface DocsConfig { title: string; description: string; categories: DocCategory[]; }
interface TocItem { level: number; text: string; id: string; children: TocItem[]; }
interface SearchResult { doc: Doc; category: DocCategory; matches: Array<{ text: string; context: string }>; }

// ==================== 主题切换按钮 ====================
function ThemeToggleButton() {
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

// ==================== PlantUML 模态框 ====================
function PlantUMLModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetView = useCallback(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, []);

  const showToolbarWithTimeout = useCallback(() => {
    setShowToolbar(true);
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    toolbarTimeoutRef.current = setTimeout(() => setShowToolbar(false), 3000);
  }, []);

  useEffect(() => { showToolbarWithTimeout(); return () => { if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current); }; }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); resetView(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, resetView]);

  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); showToolbarWithTimeout(); setScale(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1)))); };
  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsDragging(true); dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; };
  const handleMouseMove = (e: React.MouseEvent) => { showToolbarWithTimeout(); if (isDragging) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)}>
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`} style={{ background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { showToolbarWithTimeout(); setScale(p => Math.max(0.5, p - 0.2)); }} className="p-2 rounded-lg text-white hover:bg-white/20"><ZoomOut className="w-5 h-5" /></button>
        <span className="text-white text-sm min-w-[60px] text-center font-mono">{Math.round(scale * 100)}%</span>
        <button onClick={() => { showToolbarWithTimeout(); setScale(p => Math.min(3, p + 0.2)); }} className="p-2 rounded-lg text-white hover:bg-white/20"><ZoomIn className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={() => { showToolbarWithTimeout(); resetView(); }} className="p-2 rounded-lg text-white hover:bg-white/20"><RotateCcw className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={() => { showToolbarWithTimeout(); onClose(); }} className="p-2 rounded-lg text-white hover:bg-white/20"><X className="w-5 h-5" /></button>
      </div>
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm transition-opacity duration-300 ${showToolbar ? 'opacity-100' : 'opacity-0'}`}>滚轮缩放 · 拖拽移动 · ESC 关闭</div>
      <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing" onWheel={handleWheel} onMouseDown={handleMouseDown} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="PlantUML" className="max-w-none select-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} draggable={false} />
      </div>
    </div>
  );
}

// ==================== PlantUML 渲染组件 ====================
const PlantUML = ({ code }: { code: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const renderedRef = useRef<string>('');

  useEffect(() => {
    if (renderedRef.current === code && imageUrl) return;
    
    const render = async () => {
      try {
        setLoading(true); setError('');
        let cleanCode = code.trim();
        if (!cleanCode.includes('@startuml')) cleanCode = '@startuml\n' + cleanCode;
        if (!cleanCode.includes('@enduml')) cleanCode = cleanCode + '\n@enduml';
        const encoded = encode(cleanCode);
        const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
        const img = new Image();
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = url; });
        renderedRef.current = code;
        setImageUrl(url);
      } catch (err) { setError('渲染失败'); } 
      finally { setLoading(false); }
    };
    render();
  }, [code]);

  if (loading) return <div className="flex items-center justify-center p-8 rounded-lg" style={{ background: 'var(--bg-secondary)' }}><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /><span className="ml-3" style={{ color: 'var(--text-secondary)' }}>渲染图表...</span></div>;
  if (error || !imageUrl) return <div className="p-4 rounded-lg border text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}><div className="font-medium mb-2">PlantUML 渲染失败</div></div>;

  return (
    <>
      <div className="plantuml-diagram overflow-x-auto rounded-lg border p-4 my-4 text-center cursor-zoom-in hover:opacity-90 transition-opacity" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} onClick={() => setIsModalOpen(true)} title="点击放大查看"><img src={imageUrl} alt="PlantUML" className="inline-block max-w-full" /></div>
      {isModalOpen && <PlantUMLModal imageUrl={imageUrl} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

// ==================== 代码高亮组件 ====================
const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) {} };
  const lineCount = value.split('\n').filter(line => line.trim() !== '').length;
  const isShortCode = lineCount <= 3 && value.length < 200;
  const langNames: Record<string, string> = { js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX', py: 'Python', java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', rb: 'Ruby', php: 'PHP', sql: 'SQL', sh: 'Shell', bash: 'Bash', yaml: 'YAML', yml: 'YAML', json: 'JSON', xml: 'XML', html: 'HTML', css: 'CSS', scss: 'SCSS', md: 'Markdown', dockerfile: 'Dockerfile', nginx: 'Nginx' };
  const displayLang = langNames[language] || language?.toUpperCase() || 'TEXT';
  if (isShortCode) return <code className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>{value}</code>;
  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#858585' }}>
        <div className="flex items-center gap-2"><Code className="w-3.5 h-3.5" /><span className="font-medium">{displayLang}</span></div>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-white/10" style={{ color: copied ? '#4ade80' : 'inherit' }}>{copied ? <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>已复制</span></> : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>复制</span></>}</button>
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={language || 'text'} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 0.75rem 0.75rem', fontSize: '0.8125rem', lineHeight: '1.6', padding: '1.25rem' }} showLineNumbers lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#4b5563', textAlign: 'right' }}>{value}</SyntaxHighlighter>
    </div>
  );
};

// ==================== 图标映射 ====================
const iconMap: Record<string, ComponentType<LucideProps>> = { Rocket, Briefcase, Code, Search };

// ==================== ID 生成工具函数 ====================
const generateHeadingId = (text: string): string => {
  if (!text || !text.trim()) return 'section';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // 空格和下划线替换为连字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留字母、数字、下划线、中文、连字符
    .replace(/^-+|-+$/g, '');          // 移除首尾连字符
};

// 递归提取 React children 中的纯文本
const extractTextFromChildren = (children: any): string => {
  if (children == null) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (children.props && children.props.children) return extractTextFromChildren(children.props.children);
  return '';
};

// ==================== 稳定的 Markdown 组件 ====================
const MarkdownH2 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h2 id={id} className="text-2xl font-bold mt-10 mb-4 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h2>;
};

const MarkdownH3 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h3 id={id} className="text-xl font-semibold mt-8 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h3>;
};

const MarkdownH4 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h4 id={id} className="text-lg font-semibold mt-6 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h4>;
};

const MarkdownCode = ({ inline, className, children }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  if (language === 'plantuml' || codeString.includes('@startuml')) return <PlantUML code={codeString} />;
  if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>{children}</code>;
  if (language) return <CodeBlock language={language} value={codeString} />;
  return <CodeBlock language="text" value={codeString} />;
};

// 静态组件配置 - 确保引用稳定
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-12 mb-6" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h1>,
  h2: MarkdownH2,
  h3: MarkdownH3,
  h4: MarkdownH4,
  p: ({ children }: any) => <p className="my-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
  ul: ({ children }: any) => <ul className="my-4 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }: any) => <ol className="my-4 ml-6 list-decimal" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }: any) => <li className="my-1">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="underline hover:no-underline transition-colors" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: MarkdownCode,
  table: ({ children }: any) => <div className="overflow-x-auto my-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}><table className="min-w-full border-collapse" style={{ borderColor: 'var(--border-color)' }}>{children}</table></div>,
  thead: ({ children }: any) => <thead style={{ background: 'var(--bg-secondary)' }}>{children}</thead>,
  th: ({ children }: any) => <th className="border px-4 py-3 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>,
  td: ({ children }: any) => {
    // 处理 <br /> 标签，将其转换为换行
    const processChildren = (child: any): any => {
      if (typeof child === 'string') return child;
      if (Array.isArray(child)) {
        return child.flatMap((c) => {
          if (c?.type === 'br') return '\n';
          if (typeof c === 'object' && c?.props?.children) {
            return processChildren(c.props.children);
          }
          return c;
        });
      }
      if (child?.type === 'br') return '\n';
      return child;
    };
    return <td className="border px-4 py-3 whitespace-pre-line" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{processChildren(children)}</td>;
  },
  blockquote: ({ children }: any) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
};

// ==================== 目录树组件 ====================
function TocTreeItem({ item, activeId, onSelect, expandedIds, onToggle, level = 0 }: { item: TocItem; activeId: string; onSelect: (id: string) => void; expandedIds: Set<string>; onToggle: (id: string) => void; level?: number }) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedIds.has(item.id);
  const isActive = activeId === item.id;
  const itemRef = useRef<HTMLButtonElement>(null);

  // 自动将活跃项滚动到可视区域
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(item.id);
  };

  const handleSelect = () => {
    onSelect(item.id);
  };

  return (
    <li className="select-none">
      <div className="flex items-center relative" style={{ paddingLeft: `${level * 12}px` }}>
        {/* 活跃状态左侧指示条 */}
        <div 
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-300 ${isActive ? 'opacity-100 h-5' : 'opacity-0 h-0'}`}
          style={{ background: 'var(--accent-primary)' }}
        />
        {hasChildren ? (
          <button onClick={handleToggle} className="p-1 mr-1 rounded hover:bg-white/10 flex-shrink-0 transition-colors" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} type="button">
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : <span className="w-6 mr-1 flex-shrink-0" />}
        <button 
          ref={itemRef}
          onClick={handleSelect}
          className={`flex-1 text-left py-1.5 px-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'font-medium' : 'hover:opacity-80'}`}
          style={{ 
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(86,156,214,0.12)' : 'transparent'
          }}
          type="button"
        >
          <span className="line-clamp-2">{item.text}</span>
        </button>
      </div>
      {hasChildren && isExpanded && (
        <ul className="mt-0.5 relative">
          {/* 子项连接线 */}
          <div 
            className="absolute left-[9px] top-0 bottom-2 w-px opacity-30" 
            style={{ background: 'var(--border-color)' }}
          />
          {item.children.map((child) => (
            <TocTreeItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} expandedIds={expandedIds} onToggle={onToggle} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ==================== 目录导航组件 ====================
function TocNav({ toc, activeHeading, onSelect }: { toc: TocItem[]; activeHeading: string; onSelect: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const collectAllIds = useCallback((items: TocItem[]): string[] => {
    return items.flatMap(item => [item.id, ...(item.children ? collectAllIds(item.children) : [])]);
  }, []);

  const findParentIds = useCallback((items: TocItem[], targetId: string, parents: string[] = []): string[] => {
    for (const item of items) {
      if (item.id === targetId) return parents;
      if (item.children) {
        const found = findParentIds(item.children, targetId, [...parents, item.id]);
        if (found.length > 0) return found;
      }
    }
    return [];
  }, []);

  useEffect(() => {
    const allIds = new Set(collectAllIds(toc));
    setExpandedIds(allIds);
  }, [toc, collectAllIds]);

  useEffect(() => {
    if (!activeHeading) return;
    const parentIds = findParentIds(toc, activeHeading);
    if (parentIds.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        parentIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [activeHeading, toc, findParentIds]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => { 
      const next = new Set(prev); 
      if (next.has(id)) next.delete(id); 
      else next.add(id); 
      return next; 
    });
  }, []);

  const filteredToc = useMemo(() => {
    if (!searchQuery.trim()) return toc;
    const query = searchQuery.toLowerCase();
    const filter = (items: TocItem[]): TocItem[] => items.reduce((acc: TocItem[], item) => { 
      const matches = item.text.toLowerCase().includes(query); 
      const filteredChildren = item.children ? filter(item.children) : []; 
      if (matches || filteredChildren.length > 0) acc.push({ ...item, children: filteredChildren }); 
      return acc; 
    }, []);
    return filter(toc);
  }, [toc, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: 'var(--text-muted)' }}>目录导航</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="搜索目录..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm border outline-none focus:ring-2 transition-all" 
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {filteredToc.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>未找到匹配的目录</div>
        ) : (
          <ul className="space-y-0.5">
            {filteredToc.map((item) => (
              <TocTreeItem 
                key={item.id} 
                item={item} 
                activeId={activeHeading} 
                onSelect={onSelect} 
                expandedIds={expandedIds} 
                onToggle={toggleExpand} 
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ==================== 全文搜索弹窗 ====================
function SearchModal({ isOpen, onClose, allDocs, allCategories, onSelectDoc }: { isOpen: boolean; onClose: () => void; allDocs: Doc[]; allCategories: DocCategory[]; onSelectDoc: (doc: Doc, category: DocCategory) => void; }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); 
    else { setQuery(''); setResults([]); } 
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      const res: SearchResult[] = [];
      for (const cat of allCategories) {
        for (const doc of cat.docs) {
          try {
            const response = await fetch(doc.path.startsWith('/') ? doc.path : `/${doc.path}`);
            if (!response.ok) continue;
            const content = await response.text();
            const lines = content.split('\n');
            const matches: Array<{ text: string; context: string }> = [];
            lines.forEach((line, idx) => { 
              if (line.toLowerCase().includes(query.toLowerCase())) 
                matches.push({ text: line.trim(), context: lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 2)).join('\n').substring(0, 150) }); 
            });
            if (matches.length > 0 || doc.title.toLowerCase().includes(query.toLowerCase()) || doc.description.toLowerCase().includes(query.toLowerCase())) 
              res.push({ doc, category: cat, matches: matches.slice(0, 3) });
          } catch (e) {}
        }
      }
      setResults(res); 
      setLoading(false);
    };
    const id = setTimeout(search, 300);
    return () => clearTimeout(id);
  }, [query, allDocs, allCategories]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input ref={inputRef} type="text" placeholder="搜索文档内容..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-12 pr-10 py-3 text-lg rounded-xl border-0 outline-none focus:ring-2" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'var(--accent-primary)' }} />搜索中...</div> : query && results.length === 0 ? <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>未找到包含 "{query}" 的文档</div> : <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>{results.map((r) => <button key={r.doc.id} onClick={() => { onSelectDoc(r.doc, r.category); onClose(); }} className="w-full p-4 text-left transition-colors hover:bg-opacity-50" style={{ background: 'var(--bg-secondary)' }}><div className="flex items-start gap-3"><FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} /><div className="flex-1 min-w-0"><div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{r.doc.title}</div><div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{r.category.name}</div>{r.matches.length > 0 && <div className="space-y-1">{r.matches.map((m, i) => <div key={i} className="text-sm p-2 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: m.text.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark style="background: var(--accent-primary); color: white; padding: 0 2px; border-radius: 2px;">${m}</mark>`) }} />)}</div>}</div></div></button>)}</div>}
        </div>
        <div className="p-3 text-xs text-center border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>按 ESC 关闭搜索</div>
      </div>
    </div>
  );
}

// ==================== 文档列表视图 ====================
function DocListView({ config, onSelectDoc }: { config: DocsConfig; onSelectDoc: (doc: Doc, category: DocCategory) => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => { 
    const h = (e: KeyboardEvent) => { 
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } 
      if (e.key === 'Escape') setSearchOpen(false); 
    }; 
    window.addEventListener('keydown', h); 
    return () => window.removeEventListener('keydown', h); 
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} allDocs={config.categories.flatMap(c => c.docs)} allCategories={config.categories} onSelectDoc={onSelectDoc} />
      <div className="relative py-20 px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BookOpen className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{config.title}</h1>
            <p className="text-lg max-w-2xl mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>{config.description}</p>
            <button onClick={() => setSearchOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors hover:opacity-80" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Search className="w-4 h-4" /><span>搜索文档...</span><kbd className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-secondary)' }}>Ctrl K</kbd></button>
          </motion.div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {config.categories.map((category, catIndex) => {
          const Icon = iconMap[category.icon] || FolderOpen;
          return (
            <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: catIndex * 0.1 }} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}><Icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} /></div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{category.name}</h2>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{category.docs.length} 篇</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.docs.map((doc, docIndex) => (
                  <motion.button key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: catIndex * 0.1 + docIndex * 0.05 }} onClick={() => onSelectDoc(doc, category)} className="group text-left p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02]" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-start justify-between mb-4"><FileText className="w-8 h-8 transition-colors" style={{ color: 'var(--accent-primary)' }} /><ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} /></div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{doc.title}</h3>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>{doc.description}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}><FolderOpen className="w-3 h-3" /><span>{category.name}</span></div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 文档详情视图 ====================
function DocDetailView({ doc, category, onBack, allDocs, allCategories, onSelectDoc }: { doc: Doc; category: DocCategory; onBack: () => void; allDocs: Doc[]; allCategories: DocCategory[]; onSelectDoc: (doc: Doc) => void; }) {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeading, setActiveHeading] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 解析 Markdown 生成目录 - 跳过代码块内的内容
  const parseToc = useCallback((content: string): TocItem[] => {
    const lines = content.split('\n');
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      // 检测代码块开始/结束
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      // 跳过代码块内的内容
      if (inCodeBlock) continue;
      
      // 匹配标题（必须是行首，前面可以有空白）
      const match = line.match(/^(\s{0,3})(#{2,4})\s+(.+)$/);
      if (match) {
        const level = match[2].length;
        const text = match[3].trim();
        const id = generateHeadingId(text);
        headings.push({ level, text, id });
      }
    }
    
    // 构建树形结构
    const root: TocItem[] = [];
    const stack: TocItem[] = [];
    
    for (const heading of headings) {
      const item: TocItem = { ...heading, children: [] };
      
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        root.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }
      
      stack.push(item);
    }
    
    return root;
  }, []);

  // 加载 Markdown
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setToc([]);
      setActiveHeading('');
      try {
        const response = await fetch(doc.path.startsWith('/') ? doc.path : `/${doc.path}`);
        if (!response.ok) throw new Error(`Failed: ${response.status}`);
        const content = await response.text();
        setMarkdownContent(content);
        // 直接解析生成目录
        setToc(parseToc(content));
      } catch (err) {
        setMarkdownContent('# 加载失败\n\n' + String(err));
      }
      setLoading(false);
    };
    load();
    window.scrollTo(0, 0);
  }, [doc, parseToc]);

  // 使用 IntersectionObserver 实现更可靠的滚动监听
  useEffect(() => {
    // 等待内容渲染完成
    if (loading || toc.length === 0) return;
    
    // 延迟一点确保 React 渲染完成
    const timer = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '-5% 0px -85% 0px', // 视口顶部 5%-15% 区域为触发区
        threshold: 0
      };
      
      const observer = new IntersectionObserver((entries) => {
        // 获取所有可见的 heading，按在文档中的位置排序
        const visibleEntries = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => {
            const rectA = (a.target as HTMLElement).getBoundingClientRect();
            const rectB = (b.target as HTMLElement).getBoundingClientRect();
            return rectA.top - rectB.top;
          });
        
        if (visibleEntries.length > 0) {
          setActiveHeading(visibleEntries[0].target.id);
        }
      }, observerOptions);
      
      // 观察所有 heading 元素
      const headings = document.querySelectorAll('h2[id], h3[id], h4[id]');
      if (headings.length > 0) {
        headings.forEach(h => observer.observe(h));
        // 初始化第一个为活跃
        setActiveHeading(headings[0].id);
      }
      
      return () => observer.disconnect();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loading, toc]); // 在加载完成且目录生成后执行

  // 滚动到指定标题
  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSidebarOpen(false);
  }, []);

  const currentIndex = allDocs.findIndex(d => d.id === doc.id);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  useEffect(() => { 
    const h = (e: KeyboardEvent) => { 
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } 
      if (e.key === 'Escape') { setSearchOpen(false); setSidebarOpen(false); } 
    }; 
    window.addEventListener('keydown', h); 
    return () => window.removeEventListener('keydown', h); 
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} allDocs={allDocs} allCategories={allCategories} onSelectDoc={onSelectDoc} />
      <header className="sticky top-0 z-50 border-b flex-shrink-0" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>{sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-secondary)' }}><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">返回</span></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden md:block" style={{ color: 'var(--text-muted)' }}>{category?.name}</span>
            <span style={{ color: 'var(--border-color)' }}>/</span>
            <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{doc?.title}</span>
          </div>
          <div className="flex items-center gap-3"><ThemeToggleButton /><Link to="/" className="flex items-center gap-2 text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}><Home className="w-4 h-4" /></Link></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-80 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ top: '64px', height: 'calc(100vh - 64px)', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
          <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <select value={doc?.id} onChange={(e) => { const s = allDocs.find(d => d.id === e.target.value); if (s) onSelectDoc(s); }} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              {allCategories.map(cat => <optgroup key={cat.id} label={cat.name}>{cat.docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</optgroup>)}
            </select>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <TocNav toc={toc} activeHeading={activeHeading} onSelect={scrollToHeading} />
          </div>
          {/* 上下一篇切换 */}
          <div className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="grid grid-cols-2 gap-2">
              {prevDoc ? (
                <button onClick={() => onSelectDoc(prevDoc)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 text-left" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <ArrowLeft className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{prevDoc.title}</span>
                </button>
              ) : (
                <div className="px-3 py-2 rounded-lg text-xs text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>无上一篇</div>
              )}
              {nextDoc ? (
                <button onClick={() => onSelectDoc(nextDoc)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 text-right justify-end" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <span className="truncate">{nextDoc.title}</span>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                </button>
              ) : (
                <div className="px-3 py-2 rounded-lg text-xs text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>无下一篇</div>
              )}
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" style={{ top: '64px' }} onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /><span className="ml-4" style={{ color: 'var(--text-secondary)' }}>加载中...</span></div>
            ) : (
              <>
                <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--text-muted)' }}><FolderOpen className="w-4 h-4" /><span>{category?.name}</span><ChevronRight className="w-3 h-3" /><span>文档</span></div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{doc?.title}</h1>
                  {doc?.description && <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{doc.description}</p>}
                </div>
                <article className="prose prose-lg max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{markdownContent}</ReactMarkdown></article>
                <div className="mt-16 pt-8 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border-color)' }}>
                  {prevDoc && <button onClick={() => onSelectDoc(prevDoc)} className="text-left p-4 rounded-lg border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}><div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" />上一篇</div><div style={{ color: 'var(--text-primary)' }}>{prevDoc.title}</div></button>}
                  {nextDoc && <button onClick={() => onSelectDoc(nextDoc)} className="text-right p-4 rounded-lg border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}><div className="text-xs mb-1 flex items-center justify-end gap-1" style={{ color: 'var(--text-muted)' }}>下一篇<ChevronRight className="w-3 h-3" /></div><div style={{ color: 'var(--text-primary)' }}>{nextDoc.title}</div></button>}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
export default function DocsPage() {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const { data: config, loading: configLoading, error: configError } = useConfig<DocsConfig>('/data/docs.json');
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const allDocs = config?.categories.flatMap(c => c.docs) || [];

  useEffect(() => {
    if (!config || !docId) { setSelectedDoc(null); setSelectedCategory(null); return; }
    for (const cat of config.categories) { 
      const doc = cat.docs.find(d => d.id === docId); 
      if (doc) { setSelectedDoc(doc); setSelectedCategory(cat); return; } 
    }
    setSelectedDoc(null); setSelectedCategory(null);
  }, [config, docId]);

  const handleSelectDoc = (doc: Doc, category?: DocCategory) => {
    navigate(`/docs/${doc.id}`);
    if (category) setSelectedCategory(category);
    else if (config) { 
      for (const cat of config.categories) { 
        if (cat.docs.some(d => d.id === doc.id)) { setSelectedCategory(cat); break; } 
      } 
    }
  };

  const handleBack = () => { navigate('/docs'); setSelectedDoc(null); setSelectedCategory(null); };

  if (configLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="flex items-center gap-3"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /><span style={{ color: 'var(--text-secondary)' }}>加载...</span></div></div>;
  if (configError || !config) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="text-center"><p style={{ color: '#ef4444' }}>加载失败</p><button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-white" style={{ background: 'var(--accent-primary)' }}>重试</button></div></div>;

  return (
    <>
      <MagneticCursor /><VelocityCursor />
      <AnimatePresence mode="wait">
        {selectedDoc && selectedCategory ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-screen flex flex-col">
            <DocDetailView doc={selectedDoc} category={selectedCategory} onBack={handleBack} allDocs={allDocs} allCategories={config.categories} onSelectDoc={handleSelectDoc} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <DocListView config={config} onSelectDoc={handleSelectDoc} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
