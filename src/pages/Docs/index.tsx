import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Briefcase, Code, Search, Rocket, GraduationCap, Folder, ChevronRight, BookMarked, FileText, Home } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { MagneticCursor, VelocityCursor } from '@/components/effects';
import { useConfig } from '@/hooks';
import { DocListView } from './components/DocListView';
import { SeriesDetailView } from './components/SeriesDetailView';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import type { DocCategory, DocItem, DocSeries, Chapter, DocsConfig } from './types';

// 懒加载需要 Markdown 处理的组件
const DocDetailView = lazy(() => import('./components/DocDetailView').then(m => ({ default: m.DocDetailView })));
const ChapterReader = lazy(() => import('./components/ChapterReader').then(m => ({ default: m.ChapterReader })));

// 文档加载占位组件
function DocsLoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <span style={{ color: 'var(--text-secondary)' }}>加载文档...</span>
      </div>
    </div>
  );
}

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Rocket, Briefcase, Code, Search, BookOpen, GraduationCap
};

export default function DocsPage() {
  const { categoryId, itemId, chapterId } = useParams<{
    categoryId?: string;
    itemId?: string;
    chapterId?: string;
  }>();
  const navigate = useNavigate();
  
  const { data: config, loading: configLoading, error: configError } = useConfig<DocsConfig>('/data/docs.json');
  
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<DocItem | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (!config || !categoryId) {
      setSelectedCategory(null);
      setSelectedItem(null);
      setSelectedChapter(null);
      return;
    }

    const category = config.categories.find((c: DocCategory) => c.id === categoryId);
    if (!category) {
      navigate('/docs');
      return;
    }
    setSelectedCategory(category);

    if (!itemId) {
      setSelectedItem(null);
      setSelectedChapter(null);
      return;
    }

    const item = category.items.find((i: DocItem) => i.id === itemId);
    if (!item) {
      navigate('/docs');
      return;
    }
    setSelectedItem(item);

    if (item.type === 'series') {
      if (chapterId) {
        const chapter = item.chapters.find((c: Chapter) => c.id === chapterId);
        if (chapter) {
          setSelectedChapter(chapter);
        } else {
          navigate(`/docs/${categoryId}/${itemId}`);
        }
      } else {
        setSelectedChapter(null);
      }
    } else {
      setSelectedChapter(null);
    }
  }, [config, categoryId, itemId, chapterId, navigate]);

  const allChapters = useMemo(() => {
    if (!config) return [];
    const chapters: Array<{ chapter: Chapter; series: DocSeries; category: DocCategory }> = [];
    config.categories.forEach((category: DocCategory) => {
      category.items.forEach((item: DocItem) => {
        if (item.type === 'series') {
          item.chapters.forEach((chapter: Chapter) => {
            chapters.push({ chapter, series: item, category });
          });
        }
      });
    });
    return chapters;
  }, [config]);

  const handleSelectCategory = (category: DocCategory) => {
    navigate(`/docs/${category.id}`);
  };

  const handleSelectItem = (category: DocCategory, item: DocItem) => {
    navigate(`/docs/${category.id}/${item.id}`);
  };

  const handleSelectChapter = (category: DocCategory, series: DocSeries, chapter: Chapter) => {
    navigate(`/docs/${category.id}/${series.id}/${chapter.id}`);
  };

  const handleBack = () => {
    if (selectedChapter && selectedItem?.type === 'series') {
      navigate(`/docs/${selectedCategory?.id}/${selectedItem.id}`);
    } else if (selectedItem) {
      navigate(`/docs/${selectedCategory?.id}`);
    } else {
      navigate('/docs');
    }
  };

  const handleBackToHome = () => {
    navigate('/docs');
  };

  if (configLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>加载...</span>
      </div>
    </div>
  );

  if (configError || !config) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <p style={{ color: '#ef4444' }}>加载失败</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-white" style={{ background: 'var(--accent-primary)' }}>重试</button>
      </div>
    </div>
  );

  return (
    <>
      <MagneticCursor /><VelocityCursor />
      <AnimatePresence mode="wait">
        {selectedChapter && selectedItem?.type === 'series' && selectedCategory ? (
          <motion.div key="chapter-reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-screen flex flex-col">
            <Suspense fallback={<DocsLoadingFallback />}>
              <ChapterReader
                chapter={selectedChapter}
                series={selectedItem}
                category={selectedCategory}
                allChapters={allChapters}
                onBack={handleBack}
                onSelectChapter={handleSelectChapter}
              />
            </Suspense>
          </motion.div>
        ) 
        : selectedItem?.type === 'series' && selectedCategory ? (
          <motion.div key="series-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <SeriesDetailView
              series={selectedItem}
              category={selectedCategory}
              onBack={handleBack}
              onSelectChapter={handleSelectChapter}
            />
          </motion.div>
        )
        : selectedItem?.type === 'doc' && selectedCategory ? (
          <motion.div key="doc-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-screen flex flex-col">
            <Suspense fallback={<DocsLoadingFallback />}>
              <DocDetailView
                doc={selectedItem}
                category={selectedCategory}
                onBack={handleBack}
              />
            </Suspense>
          </motion.div>
        )
        : selectedCategory ? (
          <motion.div key="category-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <DocListView
              category={selectedCategory}
              onBack={handleBackToHome}
              onSelectItem={handleSelectItem}
              iconMap={iconMap}
            />
          </motion.div>
        )
        : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <DocHomeView
              config={config}
              onSelectCategory={handleSelectCategory}
              iconMap={iconMap}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 首页组件
interface DocHomeViewProps {
  config: DocsConfig;
  onSelectCategory: (category: DocCategory) => void;
  iconMap: Record<string, React.ComponentType<LucideProps>>;
}

function DocHomeView({ config, onSelectCategory, iconMap }: DocHomeViewProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80" 
              style={{ color: 'var(--text-secondary)' }}
            >
              <Home className="w-4 h-4" /><span className="hidden sm:inline">返回主站</span>
            </button>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{config.title}</h1>
          <div className="flex items-center">
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative py-16 px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BookOpen className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{config.title}</h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>{config.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {config.categories.map((category: DocCategory, index: number) => {
            const Icon = iconMap[category.icon] || Folder;
            const seriesCount = category.items.filter((i: DocItem) => i.type === 'series').length;
            const docCount = category.items.filter((i: DocItem) => i.type === 'doc').length;
            
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => onSelectCategory(category)}
                className="group text-left p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <Icon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{category.name}</h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {seriesCount > 0 && (
                    <span className="flex items-center gap-1">
                      <BookMarked className="w-3 h-3" />{seriesCount} 个系列
                    </span>
                  )}
                  {docCount > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />{docCount} 篇文档
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
