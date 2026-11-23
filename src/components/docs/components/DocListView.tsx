import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, ChevronRight, FileText, FolderOpen, Search, ArrowLeft, Layers } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { ThemeToggleButton } from './ThemeToggleButton';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { DocCategory, DocItem, DocSeries, SingleDoc, IconMap } from '../types';

interface DocListViewProps {
  category: DocCategory;
  onBack: () => void;
  onSelectItem: (category: DocCategory, item: DocItem) => void;
  iconMap: IconMap;
}

/* 与博客 / 菜谱列表一致的 brutalist 卡片：2px 描边 + 硬阴影 */
const CARD_STYLE: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderColor: 'var(--border-subtle)',
  boxShadow: '4px 4px 0 var(--border-subtle)',
};

const SeriesCard = memo(({
  series,
  index,
  onOpen,
}: {
  series: DocSeries;
  index: number;
  onOpen: () => void;
}) => {
  const animationEnabled = useAnimationEnabled();
  const { t, tReplace } = useTranslation();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: animationEnabled ? Math.min(index, 8) * 0.04 : 0 }}
      className="group relative flex h-full flex-col border-2 p-5 text-left transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={CARD_STYLE}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
        style={{ background: 'var(--accent-primary)' }}
      />

      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        <span>#{String(index + 1).padStart(2, '0')}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </div>

      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-primary)' }}
        >
          <BookMarked className="h-4 w-4" />
        </span>
        <h3
          className="min-w-0 flex-1 truncate text-base font-bold leading-snug"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {series.title}
        </h3>
      </div>

      <p className="mb-4 line-clamp-2 text-[13px] leading-6" style={{ color: 'var(--text-secondary)' }}>
        {series.description}
      </p>

      <div
        className="mt-auto flex items-center justify-between border-t pt-3 font-mono text-[11px]"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <span>{tReplace(t.docs.chapterCount, { count: series.chapters.length })}</span>
        <span className="inline-flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
          {t.docs.startLearning}
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.button>
  );
});

SeriesCard.displayName = 'SeriesCard';

const DocCard = memo(({
  doc,
  index,
  onOpen,
}: {
  doc: SingleDoc;
  index: number;
  onOpen: () => void;
}) => {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: animationEnabled ? Math.min(index, 8) * 0.04 : 0 }}
      className="group relative flex h-full flex-col border-2 p-5 text-left transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={CARD_STYLE}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
        style={{ background: 'var(--accent-secondary)' }}
      />

      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        <span>#{String(index + 1).padStart(2, '0')}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </div>

      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-secondary)' }}
        >
          <FileText className="h-4 w-4" />
        </span>
        <h3
          className="min-w-0 flex-1 truncate text-base font-bold leading-snug"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {doc.title}
        </h3>
      </div>

      <p className="line-clamp-3 text-[13px] leading-6" style={{ color: 'var(--text-secondary)' }}>
        {doc.description}
      </p>
    </motion.button>
  );
});

DocCard.displayName = 'DocCard';

function SectionHeading({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<LucideProps>;
  label: string;
  count: number;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <Icon className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
      <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </h2>
      <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
        {String(count).padStart(2, '0')}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
    </div>
  );
}

export function DocListView({ category, onBack, onSelectItem, iconMap }: DocListViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t, tReplace } = useTranslation();
  const animationEnabled = useAnimationEnabled();

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
    <div className="min-h-screen">
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        allCategories={[category]}
        onSelectItem={handleSelectItem}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-36">
        {/* Toolbar: back + search + theme */}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t.docs.search}</span>
              <kbd
                className="hidden border px-1 text-[10px] sm:inline"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                ⌘K
              </kbd>
            </button>
            <ThemeToggleButton />
          </div>
        </div>

        {/* Header card */}
        <motion.header
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 border-2 p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '6px 6px 0 var(--border-subtle)',
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center border-2"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              {category.id}
            </span>
          </div>

          <h1
            className="hero-mark mb-3 text-2xl font-bold uppercase tracking-tight sm:text-4xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {category.name}
          </h1>

          <div
            className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {seriesItems.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <BookMarked className="h-3 w-3" style={{ color: 'var(--accent-primary)' }} />
                {tReplace(t.docs.seriesCount, { count: seriesItems.length })}
              </span>
            )}
            {docItems.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" style={{ color: 'var(--accent-secondary)' }} />
                {tReplace(t.docs.docCount, { count: docItems.length })}
              </span>
            )}
          </div>
        </motion.header>

        {/* Series */}
        {seriesItems.length > 0 && (
          <section className="mb-10">
            <SectionHeading icon={BookMarked} label={t.docs.seriesSection} count={seriesItems.length} />
            <div className="grid gap-5 md:grid-cols-2">
              {seriesItems.map((series, index) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  index={index}
                  onOpen={() => handleSelectItem(category, series)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Standalone docs */}
        {docItems.length > 0 && (
          <section>
            <SectionHeading icon={FileText} label={t.docs.docsSection} count={docItems.length} />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {docItems.map((doc, index) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  index={index}
                  onOpen={() => handleSelectItem(category, doc)}
                />
              ))}
            </div>
          </section>
        )}

        {seriesItems.length === 0 && docItems.length === 0 && (
          <div
            className="border-2 px-6 py-16 text-center"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <Layers className="mx-auto mb-3 h-5 w-5" />
            <p className="text-sm">{t.docs.noContent}</p>
          </div>
        )}
      </main>
    </div>
  );
}
