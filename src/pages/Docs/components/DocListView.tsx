import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, FileText, FolderOpen, Search, BookMarked, GraduationCap, ArrowLeft, Sparkles } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AmbientGlow } from '@/components/effects';
import type { DocCategory, DocItem, DocSeries, SingleDoc, IconMap } from '../types';

interface DocListViewProps {
  category: DocCategory;
  onBack: () => void;
  onSelectItem: (category: DocCategory, item: DocItem) => void;
  iconMap: IconMap;
}

// 浮动代码装饰
const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div 
      className={`absolute font-mono text-xs sm:text-sm opacity-10 pointer-events-none animate-float-slow ${className}`}
    >
      <div className="text-[var(--accent-primary)]">{'<Category.load>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">items: ready</div>
      <div className="text-[var(--accent-tertiary)] ml-2">type: docs</div>
      <div className="text-[var(--text-muted)]">{'</Category.load>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

// 系列卡片组件
const SeriesCard = memo(({
  series,
  index,
  onClick,
}: {
  series: DocSeries;
  index: number;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
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
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, var(--accent-primary)15, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, var(--accent-primary)10 45%, var(--accent-primary)20 50%, var(--accent-primary)10 55%, transparent 60%)`,
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
            <GraduationCap 
              className="w-6 h-6 transition-colors duration-300" 
              style={{ color: isHovered ? 'white' : 'var(--accent-primary)' }} 
            />
          </div>
          <ChevronRight 
            className="w-5 h-5 transition-all duration-300" 
            style={{ 
              color: 'var(--text-muted)',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            }} 
          />
        </div>
        
        <h3 
          className="font-primary text-lg font-bold mb-2 relative z-10 transition-all duration-300"
          style={{ 
            color: 'var(--text-primary)',
            textShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
          }}
        >
          {series.title}
        </h3>
        
        <p 
          className="text-sm line-clamp-2 mb-4 relative z-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {series.description}
        </p>
        
        <div 
          className="flex items-center gap-2 text-xs relative z-10"
          style={{ color: 'var(--text-muted)' }}
        >
          <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-secondary)' }} />
          <span>{series.chapters.length} 个章节</span>
        </div>
      </div>
    </motion.button>
  );
});

SeriesCard.displayName = 'SeriesCard';

// 独立文档卡片组件
const DocCard = memo(({
  doc,
  index,
  onClick,
}: {
  doc: SingleDoc;
  index: number;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
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
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, var(--accent-primary)15, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, var(--accent-primary)10 45%, var(--accent-primary)20 50%, var(--accent-primary)10 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        <div className="flex items-start justify-between mb-4 relative z-10">
          <FileText 
            className="w-8 h-8 transition-all duration-300"
            style={{ 
              color: isHovered ? 'var(--accent-secondary)' : 'var(--accent-primary)',
              filter: isHovered ? 'drop-shadow(0 0 10px var(--accent-glow))' : 'none',
            }}
          />
          <ChevronRight 
            className="w-5 h-5 transition-all duration-300" 
            style={{ 
              color: 'var(--text-muted)',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            }} 
          />
        </div>
        
        <h3 
          className="font-primary text-lg font-bold mb-2 relative z-10 transition-all duration-300"
          style={{ 
            color: 'var(--text-primary)',
            textShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
          }}
        >
          {doc.title}
        </h3>
        
        <p 
          className="text-sm line-clamp-2 relative z-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {doc.description}
        </p>
      </div>
    </motion.button>
  );
});

DocCard.displayName = 'DocCard';

// 发光徽章组件
const GlowBadge = memo(({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-6 relative"
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        allCategories={[category]}
        onSelectItem={handleSelectItem}
      />

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
        <AmbientGlow position="top-left" color="var(--accent-primary)" size={400} opacity={0.1} />
        <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={300} opacity={0.06} />
        
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
          <button 
            onClick={onBack} 
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
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="hidden sm:inline font-primary">返回</span>
          </button>
          
          <h1 
            className="text-lg font-bold font-primary truncate max-w-xs"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.name}
          </h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(true)} 
              className="p-2 rounded-lg transition-all duration-300 hover:shadow-lg"
              style={{ 
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                boxShadow: 'inset -2px -2px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
              }}
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 发光徽章 */}
            <GlowBadge text={category.name} />
            
            {/* 图标 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div 
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
                style={{ 
                  background: 'var(--bg-card)',
                  border: '3px solid var(--accent-primary)',
                  boxShadow: '0 0 40px var(--accent-glow), inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
                }}
              >
                <Icon className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
              </div>
            </motion.div>
            
            {/* 标题 */}
            <h1 
              className="font-primary text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
              style={{ 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {category.name}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 relative z-10">
        {/* 系列教程 */}
        {seriesItems.length > 0 && (
          <div className="mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 mb-8"
            >
              <BookMarked className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h2 
                className="text-xl font-bold font-primary"
                style={{ color: 'var(--text-primary)' }}
              >
                系列教程
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {seriesItems.map((series, index) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  index={index}
                  onClick={() => handleSelectItem(category, series)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 独立文档 */}
        {docItems.length > 0 && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-3 mb-8"
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h2 
                className="text-xl font-bold font-primary"
                style={{ color: 'var(--text-primary)' }}
              >
                独立文档
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {docItems.map((doc, index) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  index={index}
                  onClick={() => handleSelectItem(category, doc)}
                />
              ))}
            </div>
          </div>
        )}
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
