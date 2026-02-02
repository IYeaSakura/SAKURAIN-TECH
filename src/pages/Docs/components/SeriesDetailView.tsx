import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, BarChart3, ChevronRight, PlayCircle } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { DocSeries, DocCategory, Chapter } from '../types';

interface SeriesDetailViewProps {
  series: DocSeries;
  category: DocCategory;
  onBack: () => void;
  onSelectChapter: (category: DocCategory, series: DocSeries, chapter: Chapter) => void;
}

export function SeriesDetailView({ series, category, onBack, onSelectChapter }: SeriesDetailViewProps) {
  const totalChapters = series.chapters.length;
  const estimatedTime = `${Math.ceil(totalChapters * 15)} 分钟`;
  const difficulty = totalChapters > 10 ? '进阶' : '入门';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">返回</span>
          </button>
          <div className="text-sm font-medium truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{series.title}</div>
          <ThemeToggleButton />
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-12 px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex w-24 h-24 rounded-xl items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-primary)' }}>
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  <span>{category.name}</span>
                  <span>•</span>
                  <span>{totalChapters} 章</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{series.title}</h1>
                <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>{series.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-4 h-4" />预计 {estimatedTime}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <BarChart3 className="w-4 h-4" />{difficulty}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Start Learning Button */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => onSelectChapter(category, series, series.chapters[0])}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-medium text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{ background: 'var(--accent-primary)' }}
        >
          <PlayCircle className="w-6 h-6" />
          开始学习
        </motion.button>
      </div>

      {/* Chapter List */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>章节列表</h2>
        <div className="space-y-3">
          {series.chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onSelectChapter(category, series, chapter)}
              className="group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 font-semibold" style={{ background: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{chapter.title}</h3>
                <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{chapter.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--text-muted)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
