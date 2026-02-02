import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Hash, Search, X } from 'lucide-react';
import type { Chapter, DocSeries, TocItem, HeadingItem } from '../types';

interface UnifiedTocProps {
  series: DocSeries;
  chapters: Chapter[];
  currentChapterId: string;
  headings: TocItem[];
  flatHeadings: HeadingItem[];
  activeHeading: string;
  onSelectChapter: (chapter: Chapter) => void;
  onSelectHeading: (id: string, lineIndex?: number, containerSelector?: string) => void;
}

export function UnifiedToc({ chapters, currentChapterId, headings, flatHeadings, activeHeading, onSelectChapter, onSelectHeading }: UnifiedTocProps) {
  // 构建标题到行号的映射
  const headingLineMap = useMemo(() => {
    const map = new Map<string, number>();
    flatHeadings.forEach((h, index) => {
      // 使用 flatHeadings 的索引作为行号参考
      map.set(h.id, index);
    });
    return map;
  }, [flatHeadings]);

  // 包装点击处理函数，传递行号信息
  const handleSelectHeading = useCallback((id: string) => {
    const lineIndex = headingLineMap.get(id);
    onSelectHeading(id, lineIndex, 'main');
  }, [onSelectHeading, headingLineMap]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // 获取当前章节的标题
  const currentChapterHeadings = flatHeadings.filter(h => h.level > 1);

  // 收集所有 ID
  const collectAllIds = useCallback((items: TocItem[]): string[] => {
    return items.flatMap(item => [item.id, ...(item.children ? collectAllIds(item.children) : [])]);
  }, []);

  // 查找父节点 ID
  const findParentIds = useCallback((items: TocItem[], targetId: string, parents: string[] = []): string[] => {
    for (const item of items) {
      if (item.id === targetId) return parents;
      if (item.children?.length) {
        const found = findParentIds(item.children, targetId, [...parents, item.id]);
        if (found.length > 0) return found;
      }
    }
    return [];
  }, []);

  // 初始化展开所有节点
  useEffect(() => {
    const allIds = new Set(collectAllIds(headings));
    setExpandedIds(allIds);
  }, [headings, collectAllIds]);

  // 当前标题变化时，自动展开其父节点
  useEffect(() => {
    if (!activeHeading) return;
    const parentIds = findParentIds(headings, activeHeading);
    if (parentIds.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        parentIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [activeHeading, headings, findParentIds]);

  // 切换展开/收起
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 过滤章节
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const query = searchQuery.toLowerCase();
    return chapters.filter(ch => ch.title.toLowerCase().includes(query));
  }, [chapters, searchQuery]);

  // 过滤标题
  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return headings;
    const query = searchQuery.toLowerCase();
    const filter = (items: TocItem[]): TocItem[] => items.reduce((acc: TocItem[], item) => {
      const matches = item.text.toLowerCase().includes(query);
      const filteredChildren = item.children ? filter(item.children) : [];
      if (matches || filteredChildren.length > 0) acc.push({ ...item, children: filteredChildren });
      return acc;
    }, []);
    return filter(headings);
  }, [headings, searchQuery]);

  // 递归渲染 TOC 树 - 带折叠功能
  const renderTocTree = (items: TocItem[], level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedIds.has(item.id);
      const isActive = activeHeading === item.id;
      
      return (
        <div key={item.id}>
          <div 
            className="flex items-center rounded-lg transition-all duration-200"
            style={{
              background: isActive ? 'rgba(86,156,214,0.12)' : 'transparent',
            }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(item.id)}
                className="p-1 mr-1 rounded hover:bg-white/10 flex-shrink-0 transition-colors"
                style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                type="button"
              >
                <ChevronRight 
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </button>
            ) : (
              <span className="w-6 mr-1 flex-shrink-0" />
            )}
            <button
              onClick={() => handleSelectHeading(item.id)}
              className="flex-1 text-left py-1.5 pr-2 text-sm transition-colors hover:opacity-80 truncate"
              style={{
                paddingLeft: `${level * 12}px`,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {item.text}
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-0.5 relative">
              <div 
                className="absolute left-[9px] top-0 bottom-2 w-px opacity-30" 
                style={{ background: 'var(--border-color)' }} 
              />
              {renderTocTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 固定顶部区域 - 搜索框 */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h4 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <FileText className="w-4 h-4" />章节
        </h4>
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

      {/* Chapter List - 独立滚动区域（上半部分） */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)', maxHeight: '40%' }}>
        <div className="p-4 overflow-y-auto max-h-full">
          <div className="space-y-1">
            {filteredChapters.map((chapter, idx) => {
              const isActive = chapter.id === currentChapterId;
              
              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    if (!isActive) {
                      onSelectChapter(chapter);
                    }
                  }}
                  className="w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left text-sm transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(86,156,214,0.12)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {isActive && currentChapterHeadings.length > 0 ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <span className="w-3 h-3 flex-shrink-0 text-xs text-center">{idx + 1}</span>
                  )}
                  <span className="truncate flex-1">{chapter.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Doc Headings - 独立滚动区域（下半部分，占据剩余空间） */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Hash className="w-3 h-3" />本章目录
          </h4>
          {filteredHeadings.length > 0 ? (
            <div className="space-y-0.5">
              {renderTocTree(filteredHeadings)}
            </div>
          ) : currentChapterHeadings.length > 0 && !searchQuery ? (
            // 如果没有树形结构，直接显示所有标题
            <div className="space-y-0.5">
              {currentChapterHeadings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => handleSelectHeading(heading.id)}
                  className="w-full text-left py-1.5 pr-2 text-sm rounded-lg transition-all duration-200 truncate"
                  style={{
                    paddingLeft: `${(heading.level - 2) * 12 + 8}px`,
                    color: activeHeading === heading.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: activeHeading === heading.id ? 500 : 400,
                    background: activeHeading === heading.id ? 'rgba(86,156,214,0.12)' : 'transparent',
                  }}
                >
                  {heading.text}
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              未找到匹配的目录
            </div>
          ) : (
            <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              暂无目录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
