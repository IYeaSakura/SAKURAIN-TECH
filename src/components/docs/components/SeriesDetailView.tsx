import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, BarChart3, ChevronRight, PlayCircle, Layers } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { DocSeries, DocCategory, Chapter } from '../types';

interface SeriesDetailViewProps {
  series: DocSeries;
  category: DocCategory;
  onBack: () => void;
  onSelectChapter: (category: DocCategory, series: DocSeries, chapter: Chapter) => void;
}

const ChapterItem = memo(({
  chapter,
  index,
  onClick,
}: {
  chapter: Chapter;
  index: number;
  onClick: () => void;
}) => {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationEnabled ? Math.min(index, 10) * 0.03 : 0 }}
      className="group relative flex w-full items-center gap-4 border-2 p-4 text-left transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
        style={{ background: 'var(--accent-primary)' }}
      />

      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 font-mono text-sm font-bold"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-primary)' }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-base font-bold leading-snug"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {chapter.title}
        </span>
        {chapter.description && (
          <span className="mt-1 block truncate text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {chapter.description}
          </span>
        )}
      </span>

      <ChevronRight
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: 'var(--text-muted)' }}
      />
    </motion.button>
  );
});

ChapterItem.displayName = 'ChapterItem';

export function SeriesDetailView({ series, category, onBack, onSelectChapter }: SeriesDetailViewProps) {
  const { t, tReplace } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const totalChapters = series.chapters.length;
  const estimatedTime = `${Math.ceil(totalChapters * 15)}`;
  const difficulty = totalChapters > 10 ? t.docs.difficultyAdvanced : t.docs.difficultyBeginner;

  const metaChip = (icon: React.ReactNode, text: string) => (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] uppercase tracking-wider"
      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
    >
      {icon}
      {text}
    </span>
  );

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:pt-36">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t.docs.back}
          </button>
          <ThemeToggleButton />
        </div>

        {/* Series header */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 border-2 p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '6px 6px 0 var(--border-subtle)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center border-2"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
            >
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              {category.name}
            </span>
          </div>

          <h1
            className="hero-mark mb-3 text-2xl font-bold leading-tight sm:text-4xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {series.title}
          </h1>

          {series.description && (
            <p className="mb-5 text-sm leading-7 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              {series.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {metaChip(<Layers className="h-3 w-3" style={{ color: 'var(--accent-primary)' }} />, tReplace(t.docs.chapterCount, { count: totalChapters }))}
            {metaChip(<Clock className="h-3 w-3" style={{ color: 'var(--accent-primary)' }} />, tReplace(t.docs.estimatedTime, { time: estimatedTime }))}
            {metaChip(<BarChart3 className="h-3 w-3" style={{ color: 'var(--accent-secondary)' }} />, difficulty)}
          </div>

          <button
            type="button"
            onClick={() => onSelectChapter(category, series, series.chapters[0])}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border-2 px-6 py-3 font-mono text-[11px] uppercase tracking-wider transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 sm:w-auto"
            style={{
              background: 'var(--accent-primary)',
              borderColor: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <PlayCircle className="h-4 w-4" />
            {t.docs.startLearning}
          </button>
        </motion.section>

        {/* Chapters */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <Layers className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              {t.docs.chaptersTitle}
            </h2>
            <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
              {String(totalChapters).padStart(2, '0')}
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          </div>

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
        </section>
      </main>
    </div>
  );
}
