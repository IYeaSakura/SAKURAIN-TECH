'use client';

import { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Briefcase, Code, Search, Rocket, GraduationCap, Folder, ChevronRight, BookMarked, FileText, Layers } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { MagneticCursor, VelocityCursor } from '@/components/effects';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled, useIsDesktopClient, useTranslation } from '@/hooks';
import { deploymentConfig } from '@/config/deployment-config';
import { DocListView } from './components/DocListView';
import { SeriesDetailView } from './components/SeriesDetailView';
import { ImagePreviewProvider } from '@/contexts/ImagePreviewContext';
import type { DocCategory, DocItem, DocSeries, Chapter, DocsConfig } from './types';
import type { SiteData } from '@/types';

// 阅读器只在真正打开文档/章节时加载。默认保留 SSR，静态导出中的正文不会丢失。
const DocDetailView = dynamic(() => import('./components/DocDetailView').then((m) => m.DocDetailView));
const ChapterReader = dynamic(() => import('./components/ChapterReader').then((m) => m.ChapterReader));

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Rocket, Briefcase, Code, Search, BookOpen, GraduationCap
};

/**
 * Phase 2: the catalog tree and site data are injected by server-side SSG.
 * The four-level route params (categoryId/itemId/chapterId) are resolved by
 * the route adapter and passed as props. Chapter / single-document markdown
 * content is read by the server-side gray-matter pipeline and injected via
 * the `content` prop.
 */
interface DocsPageProps {
  config: DocsConfig;
  siteData: SiteData | null;
  categoryId?: string;
  itemId?: string;
  chapterId?: string;
  content?: string | null;
}

export default function DocsPage({
  config,
  siteData,
  categoryId,
  itemId,
  chapterId,
  content = null,
}: DocsPageProps) {
  const navigate = useRouter().push;
  const isDesktopClient = useIsDesktopClient();

  // Derive the current selection from props (server already validated paths)
  const selectedCategory = useMemo<DocCategory | null>(
    () => (categoryId ? config.categories.find((c) => c.id === categoryId) ?? null : null),
    [config, categoryId],
  );
  const selectedItem = useMemo<DocItem | null>(
    () => (selectedCategory && itemId ? selectedCategory.items.find((i) => i.id === itemId) ?? null : null),
    [selectedCategory, itemId],
  );
  const selectedChapter = useMemo<Chapter | null>(
    () =>
      selectedItem?.type === 'series' && chapterId
        ? selectedItem.chapters.find((c) => c.id === chapterId) ?? null
        : null,
    [selectedItem, chapterId],
  );

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
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (deploymentConfig.useWindowLocation) {
      window.location.href = `/docs/${category.id}`;
    } else {
      navigate(`/docs/${category.id}`);
    }
  };

  const handleSelectItem = (category: DocCategory, item: DocItem) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (deploymentConfig.useWindowLocation) {
      window.location.href = `/docs/${category.id}/${item.id}`;
    } else {
      navigate(`/docs/${category.id}/${item.id}`);
    }
  };

  const handleSelectChapter = (category: DocCategory, series: DocSeries, chapter: Chapter) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (deploymentConfig.useWindowLocation) {
      window.location.href = `/docs/${category.id}/${series.id}/${chapter.id}`;
    } else {
      navigate(`/docs/${category.id}/${series.id}/${chapter.id}`);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (selectedChapter && selectedItem?.type === 'series') {
      if (deploymentConfig.useWindowLocation) {
        window.location.href = `/docs/${selectedCategory?.id}/${selectedItem.id}`;
      } else {
        navigate(`/docs/${selectedCategory?.id}/${selectedItem.id}`);
      }
    } else if (selectedItem) {
      if (deploymentConfig.useWindowLocation) {
        window.location.href = `/docs/${selectedCategory?.id}`;
      } else {
        navigate(`/docs/${selectedCategory?.id}`);
      }
    } else {
      if (deploymentConfig.useWindowLocation) {
        window.location.href = '/docs';
      } else {
        navigate('/docs');
      }
    }
  };

  const handleBackToHome = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/docs';
    } else {
      navigate('/docs');
    }
  };

  return (
    <ImagePreviewProvider>
      {/* Mouse effects - desktop only */}
      {isDesktopClient && (
        <>
          <MagneticCursor /><VelocityCursor />
        </>
      )}
      <AnimatePresence mode="wait">
        {selectedChapter && selectedItem?.type === 'series' && selectedCategory ? (
          <motion.div key="chapter-reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-screen flex flex-col">
            <ChapterReader
              chapter={selectedChapter}
              series={selectedItem}
              category={selectedCategory}
              allChapters={allChapters}
              content={content ?? ''}
              onBack={handleBack}
              onSelectChapter={handleSelectChapter}
            />
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
          <DocDetailView
            doc={selectedItem}
            category={selectedCategory}
            content={content ?? ''}
            onBack={handleBack}
          />
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
              siteData={siteData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ImagePreviewProvider>
  );
}

// Docs home view component
interface DocHomeViewProps {
  config: DocsConfig;
  onSelectCategory: (category: DocCategory) => void;
  iconMap: Record<string, React.ComponentType<LucideProps>>;
  siteData?: SiteData | null;
}

/* Shared brutalist card shell: 2px border + hard offset shadow, matching the
 * blog / kitchen lists so the docs section reads as part of the same site. */
const CARD_STYLE: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderColor: 'var(--border-subtle)',
  boxShadow: '4px 4px 0 var(--border-subtle)',
};

const StatCard = memo(({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: string | number;
  label: string;
  icon: React.ComponentType<LucideProps>;
  delay: number;
}) => {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + delay * 0.08, duration: 0.4 }}
      className="border-2 p-4 text-center sm:p-5"
      style={CARD_STYLE}
    >
      <Icon className="mx-auto mb-2 h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
      <div className="text-2xl font-bold leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

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
  const animationEnabled = useAnimationEnabled();
  const { t, tReplace } = useTranslation();
  const Icon = iconMap[category.icon] || Folder;
  const seriesCount = category.items.filter((i: DocItem) => i.type === 'series').length;
  const docCount = category.items.filter((i: DocItem) => i.type === 'doc').length;

  return (
    <motion.button
      key={category.id}
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: animationEnabled ? Math.min(index, 8) * 0.04 : 0 }}
      onClick={() => onSelect(category)}
      className="group relative flex h-full flex-col border-2 p-5 text-left transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={CARD_STYLE}
    >
      {/* Hover accent bar */}
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
          <Icon className="h-4 w-4" />
        </span>
        <h3
          className="truncate text-base font-bold leading-snug"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {category.name}
        </h3>
      </div>

      <div
        className="mt-auto flex flex-wrap items-center gap-3 border-t pt-3 font-mono text-[11px]"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        {seriesCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <BookMarked className="h-3 w-3" style={{ color: 'var(--accent-primary)' }} />
            {tReplace(t.docs.seriesCount, { count: seriesCount })}
          </span>
        )}
        {docCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" style={{ color: 'var(--accent-secondary)' }} />
            {tReplace(t.docs.docCount, { count: docCount })}
          </span>
        )}
      </div>
    </motion.button>
  );
});

CategoryCard.displayName = 'CategoryCard';

function DocHomeView({ config, onSelectCategory, iconMap, siteData }: DocHomeViewProps) {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();

  // Compute overview statistics
  const categoryCount = config.categories.length;
  const docCount = config.categories.reduce((acc: number, cat: DocCategory) =>
    acc + cat.items.filter((i: DocItem) => i.type === 'doc').length, 0);
  const seriesCount = config.categories.reduce((acc: number, cat: DocCategory) =>
    acc + cat.items.filter((i: DocItem) => i.type === 'series').length, 0);

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:px-6 lg:pt-36">
        {/* Header */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div
                className="mb-4 inline-flex items-center gap-2 border-2 px-3 py-1.5"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <BookOpen className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  Docs
                </span>
              </div>

              <h1
                className="hero-mark mb-4 text-3xl font-bold uppercase tracking-tight sm:text-5xl"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                {config.title}
              </h1>

              <p className="max-w-xl text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                {config.description}
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-3 lg:w-[420px]">
              <StatCard value={categoryCount} label={t.docs.categoryLabel} icon={Layers} delay={0} />
              <StatCard value={docCount} label={t.docs.docsLabel} icon={FileText} delay={1} />
              <StatCard value={seriesCount} label={t.docs.seriesLabel} icon={BookMarked} delay={2} />
            </div>
          </div>
        </motion.section>

        {/* Categories */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Layers className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <h2
              className="font-mono text-[11px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.docs.docCategories}
            </h2>
            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          </div>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>{t.docs.exploreDocs}</p>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        </section>
      </main>

      {/* Footer - shared component */}
      {siteData?.footer && <Footer data={siteData.footer} />}
    </div>
  );
}
