import { useState, useEffect, useMemo, lazy, Suspense, memo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Briefcase, Code, Search, Rocket, GraduationCap, Folder, ChevronRight, BookMarked, FileText, Home, Sparkles, Terminal } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow } from '@/components/effects';
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

// 发光徽章组件
const GlowBadge = memo(({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative"
    >
      {/* 外发光 */}
      <div 
        className="absolute -inset-2 rounded-xl animate-pulse-glow"
        style={{
          background: `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))`,
          filter: 'blur(15px)',
          opacity: 0.4,
          zIndex: -1,
        }}
      />
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid color-mix(in srgb, var(--accent-primary) 80%, transparent)',
          boxShadow: '0 0 20px var(--accent-glow), inset 0 0 10px var(--accent-primary)10',
        }}
      >
        {/* 内部光效 */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, var(--accent-primary)20, transparent)`,
          }}
        />
        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span
          className="font-primary text-sm font-bold uppercase tracking-wider relative z-10"
          style={{ color: 'var(--accent-primary)' }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
});

GlowBadge.displayName = 'GlowBadge';

// 分类卡片组件
const CategoryCard = memo(({ 
  category, 
  index, 
  iconMap, 
  onSelect 
}: { 
  category: DocCategory; 
  index: number; 
  iconMap: Record<string, React.ComponentType<LucideProps>>;
  onSelect: (category: DocCategory) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[category.icon] || Folder;
  const seriesCount = category.items.filter((i: DocItem) => i.type === 'series').length;
  const docCount = category.items.filter((i: DocItem) => i.type === 'doc').length;
  
  return (
    <motion.button
      key={category.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group text-left relative cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* 发光边框效果 */}
      <div
        className="absolute -inset-[2px] rounded-xl transition-opacity duration-500"
        style={{
          background: isHovered 
            ? `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))`
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
          opacity: isHovered ? 1 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />
      <div
        className="relative p-6 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered 
            ? `0 20px 40px var(--accent-glow), 0 0 30px var(--accent-primary)20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)` 
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        {/* Glow background - 顶部径向渐变 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, var(--accent-primary)20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine effect - 斜向光泽 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, var(--accent-primary)15 45%, var(--accent-primary)30 50%, var(--accent-primary)15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div 
            className="p-3 rounded-lg transition-all duration-300"
            style={{ 
              background: isHovered ? 'var(--accent-primary)' : 'var(--bg-primary)',
              boxShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
            }}
          >
            <Icon 
              className="w-8 h-8 transition-colors duration-300" 
              style={{ color: isHovered ? 'white' : 'var(--accent-primary)' }} 
            />
          </div>
          <ChevronRight 
            className="w-5 h-5 transition-all transform duration-300" 
            style={{ 
              color: 'var(--text-muted)',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            }} 
          />
        </div>
        
        <h3 
          className="font-primary text-xl font-bold mb-3 relative z-10 transition-all duration-300"
          style={{ 
            color: 'var(--text-primary)',
            textShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
          }}
        >
          {category.name}
        </h3>
        
        <div className="flex items-center gap-4 text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>
          {seriesCount > 0 && (
            <span className="flex items-center gap-1.5">
              <BookMarked className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>{seriesCount} 个系列</span>
            </span>
          )}
          {docCount > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-tertiary)' }} />
              <span>{docCount} 篇文档</span>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
});

CategoryCard.displayName = 'CategoryCard';

// 浮动代码装饰
const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div 
      className={`absolute font-mono text-xs sm:text-sm opacity-10 pointer-events-none animate-float-slow ${className}`}
    >
      <div className="text-[var(--accent-primary)]">{'<Docs.init>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">knowledge: loaded</div>
      <div className="text-[var(--accent-tertiary)] ml-2">status: ready</div>
      <div className="text-[var(--text-muted)]">{'</Docs.init>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

function DocHomeView({ config, onSelectCategory, iconMap }: DocHomeViewProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 背景效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 静态网格背景 */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(var(--accent-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* 环境光效 */}
        <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.12} />
        <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.08} />
        
        {/* 径向渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)`,
          }}
        />
      </div>

      {/* 浮动代码装饰 */}
      <CodeDecoration className="top-32 left-8 hidden lg:block" />
      <CodeDecoration className="bottom-32 right-8 hidden lg:block" />

      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ 
          background: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)', 
          borderColor: 'var(--border-subtle)' 
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:opacity-80 group"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div 
                className="p-1.5 rounded-lg transition-all duration-300 group-hover:shadow-lg"
                style={{ 
                  background: 'var(--bg-card)',
                  boxShadow: 'inset -2px -2px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
                }}
              >
                <Home className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="hidden sm:inline font-primary">返回主站</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 hidden sm:block" style={{ color: 'var(--accent-primary)' }} />
            <h1 
              className="text-lg font-bold font-primary hidden sm:block"
              style={{ 
                color: 'var(--text-primary)',
                textShadow: '0 0 20px var(--accent-glow)',
              }}
            >
              {config.title}
            </h1>
          </div>
          
          <div className="flex items-center">
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 发光徽章 */}
            <GlowBadge text="知识库" />
            
            {/* 主标题 */}
            <h1 
              className="font-primary text-4xl sm:text-5xl lg:text-6xl font-black mb-6"
              style={{ 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {config.title}
            </h1>
            
            {/* 描述 */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl max-w-2xl mx-auto font-primary"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
            >
              {config.description}
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center gap-3 mb-8"
        >
          <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <h2 
            className="text-xl font-bold font-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            文档分类
          </h2>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.categories.map((category: DocCategory, index: number) => (
            <CategoryCard 
              key={category.id}
              category={category}
              index={index}
              iconMap={iconMap}
              onSelect={onSelectCategory}
            />
          ))}
        </div>
      </div>
      
      {/* 底部渐变 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />
    </div>
  );
}
