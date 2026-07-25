import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { List } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Parse article content to extract h2 and h3 headings.
  const headings = useMemo(() => {
    const result: Heading[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);
      
      if (h2Match) {
        const text = h2Match[1].trim();
        const id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        result.push({ id, text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        const id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        result.push({ id, text, level: 3 });
      }
    }
    
    return result;
  }, [content]);

  // Listen to scroll events and highlight the currently visible heading.
  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    // Find the heading closest to the top of the viewport.
    const scrollPosition = window.scrollY + 150; // offset to highlight early

    let currentActiveId = headings[0]?.id || '';
    
    for (let i = 0; i < headingElements.length; i++) {
      const element = headingElements[i];
      if (element.offsetTop <= scrollPosition) {
        currentActiveId = headings[i].id;
      } else {
        break;
      }
    }

    setActiveId(currentActiveId);
  }, [headings]);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll smoothly to the selected heading.
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120; // top offset for fixed headers
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`fixed left-6 top-28 z-40 hidden xl:flex flex-col ${className}`}
      style={{
        height: 'auto',
        maxHeight: 'calc(100vh - 140px)',
      }}
    >
      <div
        className="rounded-2xl p-4 overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(10px)',
          width: isCollapsed ? '60px' : '240px',
          minWidth: isCollapsed ? '60px' : '240px',
          maxWidth: isCollapsed ? '60px' : '240px',
          transition: 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <List className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium">{t.blog.tableOfContents}</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
            }}
            title={isCollapsed ? t.blog.expandToc : t.blog.collapseToc}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Table of contents list */}
        {!isCollapsed && (
          <nav className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <ul className="space-y-1">
              {headings.map((heading, index) => (
                <motion.li
                  key={heading.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleClick(heading.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:opacity-100 group relative"
                    style={{
                      paddingLeft: heading.level === 3 ? '1.5rem' : '0.75rem',
                      color: activeId === heading.id 
                        ? 'var(--accent-primary)' 
                        : 'var(--text-secondary)',
                      background: activeId === heading.id 
                        ? 'var(--bg-secondary)' 
                        : 'transparent',
                      fontWeight: activeId === heading.id ? 600 : 400,
                      opacity: activeId === heading.id ? 1 : 0.7,
                    }}
                  >
                    {/* Left active indicator */}
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-200"
                      style={{
                        height: activeId === heading.id ? '60%' : '0%',
                        background: 'var(--accent-primary)',
                        opacity: activeId === heading.id ? 1 : 0,
                      }}
                    />
                    
                    <span className="relative z-10 line-clamp-2">
                      {heading.text}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </nav>
        )}

        {/* Collapsed state hint */}
        {isCollapsed && (
          <div className="text-center">
            <div 
              className="w-8 h-8 mx-auto rounded-full flex items-center justify-center"
              style={{ 
                background: 'var(--bg-secondary)',
                color: 'var(--accent-primary)',
              }}
            >
              <span className="text-xs font-bold">{headings.length}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
