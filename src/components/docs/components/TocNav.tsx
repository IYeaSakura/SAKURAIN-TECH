import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import type { TocItem } from '../types';

// Toc Tree Item Component
function TocTreeItem({
  item,
  activeId,
  onSelect,
  expandedIds,
  onToggle,
  level = 0
}: {
  item: TocItem;
  activeId: string;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  level?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedIds.has(item.id);
  const isActive = activeId === item.id;
  const itemRef = useRef<HTMLButtonElement>(null);

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

  const handleSelect = () => onSelect(item.id);

  return (
    <li className="select-none">
      <div className="flex items-center relative" style={{ paddingLeft: `${level * 12}px` }}>
        {/* Active indicator */}
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
          <div className="absolute left-[9px] top-0 bottom-2 w-px opacity-30" style={{ background: 'var(--border-color)' }} />
          {item.children.map((child) => (
            <TocTreeItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} expandedIds={expandedIds} onToggle={onToggle} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Toc Nav Component
interface TocNavProps {
  toc: TocItem[];
  activeHeading: string;
  onSelect: (id: string) => void;
}

export function TocNav({ toc, activeHeading, onSelect }: TocNavProps) {
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
