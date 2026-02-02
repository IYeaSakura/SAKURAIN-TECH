import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, FileText, FolderOpen, Search, BookMarked, GraduationCap, ArrowLeft } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { DocCategory, DocItem, DocSeries, SingleDoc, IconMap } from '../types';

interface DocListViewProps {
  category: DocCategory;
  onBack: () => void;
  onSelectItem: (category: DocCategory, item: DocItem) => void;
  iconMap: IconMap;
}

export function DocListView({ category, onBack, onSelectItem, iconMap }: DocListViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const seriesItems = category.items.filter((i): i is DocSeries => i.type === 'series');
  const docItems = category.items.filter((i): i is SingleDoc => i.type === 'doc');
  const Icon = iconMap[category.icon] || FolderOpen;

  const handleSelectItem = (cat: DocCategory, item: DocItem) => {
    onSelectItem(cat, item);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        allCategories={[category]}
        onSelectItem={handleSelectItem}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{category.name}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative py-16 px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Icon className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{category.name}</h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 系列教程 */}
        {seriesItems.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookMarked className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>系列教程</h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {seriesItems.map((series, index) => (
                <motion.button
                  key={series.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleSelectItem(category, series)}
                  className="group text-left p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                      <GraduationCap className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{series.title}</h3>
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>{series.description}</p>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <BookOpen className="w-3 h-3" />
                    <span>{series.chapters.length} 个章节</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 独立文档 */}
        {docItems.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>独立文档</h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {docItems.map((doc, index) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleSelectItem(category, doc)}
                  className="group text-left p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 transition-colors" style={{ color: 'var(--accent-primary)' }} />
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{doc.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{doc.description}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
