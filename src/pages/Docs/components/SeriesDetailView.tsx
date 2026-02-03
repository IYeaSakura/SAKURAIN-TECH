import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, BarChart3, ChevronRight, PlayCircle, Sparkles, Layers } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AmbientGlow } from '@/components/effects';
import type { DocSeries, DocCategory, Chapter } from '../types';

interface SeriesDetailViewProps {
  series: DocSeries;
  category: DocCategory;
  onBack: () => void;
  onSelectChapter: (category: DocCategory, series: DocSeries, chapter: Chapter) => void;
}

// 浮动代码装饰
const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div 
      className={`absolute font-mono text-xs sm:text-sm opacity-10 pointer-events-none animate-float-slow ${className}`}
    >
      <div className="text-[var(--accent-primary)]">{'<Series.load>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">chapters: ready</div>
      <div className="text-[var(--accent-tertiary)] ml-2">progress: 0%</div>
      <div className="text-[var(--text-muted)]">{'</Series.load>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

// 章节项组件
const ChapterItem = memo(({
  chapter,
  index,
  onClick,
}: {
  chapter: Chapter;
  index: number;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '3px solid',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
        transform: isHovered ? 'translateX(8px) scale(1.01)' : 'none',
        boxShadow: isHovered 
          ? `0 10px 30px var(--accent-glow), 0 0 20px var(--accent-primary)15, inset -3px -3px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 3px 3px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)` 
          : 'inset -3px -3px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 3px 3px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
      }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, var(--accent-primary)10, transparent 50%)`,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* 章节编号 */}
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 font-bold text-lg transition-all duration-300 relative z-10"
        style={{ 
          background: isHovered ? 'var(--accent-primary)' : 'var(--bg-primary)',
          color: isHovered ? 'white' : 'var(--accent-primary)',
          boxShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
        }}
      >
        {index + 1}
      </div>
      
      {/* 章节信息 */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3 
          className="font-primary font-semibold text-lg mb-1 truncate transition-all duration-300"
          style={{ 
            color: 'var(--text-primary)',
            textShadow: isHovered ? '0 0 10px var(--accent-glow)' : 'none',
          }}
        >
          {chapter.title}
        </h3>
        <p 
          className="text-sm truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {chapter.description}
        </p>
      </div>
      
      {/* 箭头 */}
      <ChevronRight 
        className="w-5 h-5 flex-shrink-0 transition-all duration-300 relative z-10"
        style={{ 
          color: 'var(--text-muted)',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(4px)' : 'translateX(-4px)',
        }} 
      />
    </motion.div>
  );
});

ChapterItem.displayName = 'ChapterItem';

// 发光徽章组件
const GlowBadge = memo(({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-4 relative"
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

export function SeriesDetailView({ series, category, onBack, onSelectChapter }: SeriesDetailViewProps) {
  const totalChapters = series.chapters.length;
  const estimatedTime = `${Math.ceil(totalChapters * 15)} 分钟`;
  const difficulty = totalChapters > 10 ? '进阶' : '入门';

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
            className="text-sm font-bold font-primary truncate max-w-xs"
            style={{ color: 'var(--text-primary)' }}
          >
            {series.title}
          </h1>
          
          <div className="flex items-center">
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 徽章 */}
            <div className="flex items-center gap-3 mb-4">
              <GlowBadge text={category.name} />
              <div 
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ 
                  background: 'var(--bg-card)',
                  color: 'var(--accent-secondary)',
                  border: '2px solid var(--accent-secondary)',
                }}
              >
                {totalChapters} 章
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              {/* 图标 */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hidden sm:flex w-24 h-24 rounded-2xl items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'var(--bg-card)',
                  border: '3px solid var(--accent-primary)',
                  boxShadow: '0 0 40px var(--accent-glow), inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
                }}
              >
                <BookOpen className="w-12 h-12" style={{ color: 'var(--accent-primary)' }} />
              </motion.div>
              
              <div className="flex-1">
                {/* 标题 */}
                <h1 
                  className="font-primary text-2xl sm:text-3xl lg:text-4xl font-black mb-4"
                  style={{ 
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {series.title}
                </h1>
                
                {/* 描述 */}
                <p 
                  className="text-lg mb-6 font-primary"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                >
                  {series.description}
                </p>
                
                {/* 元信息 */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ 
                      background: 'var(--bg-card)',
                      border: '2px solid var(--border-subtle)',
                    }}
                  >
                    <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>预计 {estimatedTime}</span>
                  </div>
                  <div 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ 
                      background: 'var(--bg-card)',
                      border: '2px solid var(--border-subtle)',
                    }}
                  >
                    <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Start Learning Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 mb-8 relative z-10">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={() => onSelectChapter(category, series, series.chapters[0])}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))',
            boxShadow: '0 4px 20px var(--accent-glow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 30px var(--accent-glow), 0 0 60px var(--accent-primary)40';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)';
          }}
        >
          {/* 光效背景 */}
          <div 
            className="absolute inset-0 transition-transform duration-600"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'translateX(-100%)',
            }}
          />
          <PlayCircle className="w-6 h-6 relative z-10" />
          <span className="relative z-10 font-primary">开始学习</span>
        </motion.button>
      </div>

      {/* Chapter List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center gap-3 mb-6"
        >
          <Layers className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <h2 
            className="text-xl font-bold font-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            章节列表
          </h2>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </motion.div>
        
        <div className="space-y-3">
          {series.chapters.map((chapter, index) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              index={index}
              onClick={() => onSelectChapter(category, series, chapter)}
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
