'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Briefcase, Code, Search, Rocket, GraduationCap, Folder, ChevronRight, BookMarked, FileText, Sparkles, Layers } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow, GradientText, LightBeam } from '@/components/effects';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled, useIsDesktopClient, useTranslation } from '@/hooks';
import { deploymentConfig } from '@/config/deployment-config';
import { DocListView } from './components/DocListView';
import { SeriesDetailView } from './components/SeriesDetailView';
import { clipPathRounded } from '@/utils/styles';
import { ImagePreviewProvider } from '@/contexts/ImagePreviewContext';
import type { DocCategory, DocItem, DocSeries, Chapter, DocsConfig } from './types';
import type { SiteData } from '@/types';

// Import components directly (no lazy loading)
import { DocDetailView as DocDetailViewComponent } from './components/DocDetailView';
import { ChapterReader as ChapterReaderComponent } from './components/ChapterReader';
const DocDetailView = DocDetailViewComponent;
const ChapterReader = ChapterReaderComponent;

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

// Stat card with pixel-style border
const StatCard = memo(({ value, label, icon: Icon, color, delay }: { 
  value: string | number; 
  label: string; 
  icon: React.ComponentType<LucideProps>;
  color: string;
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative p-5 text-center cursor-default group"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '2px solid rgba(255, 255, 255, 0.08)',
        clipPath: clipPathRounded(6),
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />
      
      <Icon className="w-6 h-6 mx-auto mb-3" style={{ color }} />
      <div className="font-sans font-bold text-2xl mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// Category card with pixel-style borders and hover glow effects
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
  const animationEnabled = useAnimationEnabled();
  const isDesktopClient = useIsDesktopClient();
  const { t, tReplace } = useTranslation();
  const Icon = iconMap[category.icon] || Folder;
  const seriesCount = category.items.filter((i: DocItem) => i.type === 'series').length;
  const docCount = category.items.filter((i: DocItem) => i.type === 'doc').length;

  return (
    <motion.button
      key={category.id}
      initial={animationEnabled ? { opacity: 0, y: 30 } : undefined}
      animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: animationEnabled ? index * 0.1 : 0, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group text-left relative cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* Pixel-style border */}
      <div
        className="relative p-6 overflow-hidden transition-all duration-300"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
          clipPath: clipPathRounded(8),
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
      >
        {/* Corner glow effects - desktop only */}
        {isDesktopClient && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none">
              <motion.div
                className="absolute top-0 left-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-0 left-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}
                animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none">
              <motion.div
                className="absolute top-0 right-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-0 right-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to bottom, var(--accent-secondary), transparent)' }}
                animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </>
        )}

        {/* Top gradient glow - desktop only */}
        {isDesktopClient && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%)' }}
            animate={{ opacity: isHovered ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Shine sweep effect - desktop only */}
        {isDesktopClient && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)' }}
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '200%' : '-100%' }}
            transition={{ duration: 0.6 }}
          />
        )}

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div
            className="p-3 transition-all duration-300"
            style={{
              background: isHovered ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              clipPath: clipPathRounded(4),
            }}
          >
            <Icon
              className="w-7 h-7 transition-colors duration-300"
              style={{ color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)' }}
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
          className="font-primary text-lg font-bold mb-3 relative z-10 transition-colors duration-300"
          style={{ color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {category.name}
        </h3>

        <div className="flex items-center gap-4 text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>
          {seriesCount > 0 && (
            <span className="flex items-center gap-1.5">
              <BookMarked className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span>{tReplace(t.docs.seriesCount, { count: seriesCount })}</span>
            </span>
          )}
          {docCount > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>{tReplace(t.docs.docCount, { count: docCount })}</span>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
});

CategoryCard.displayName = 'CategoryCard';

function DocHomeView({ config, onSelectCategory, iconMap, siteData }: DocHomeViewProps) {
  const { t } = useTranslation();
  const isDesktopClient = useIsDesktopClient();

  // Compute overview statistics
  const categoryCount = config.categories.length;
  const docCount = config.categories.reduce((acc: number, cat: DocCategory) => 
    acc + cat.items.filter((i: DocItem) => i.type === 'doc').length, 0);
  const seriesCount = config.categories.reduce((acc: number, cat: DocCategory) => 
    acc + cat.items.filter((i: DocItem) => i.type === 'series').length, 0);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Unified background effects - blue-green palette */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
        <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
        <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />

        {/* 80px grid background */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Hero section - asymmetric layout */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side: title + description */}
            <div className="">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{t.docs.knowledgeBase}</span>
                </motion.div>

                {/* Main title - blue-green gradient */}
                <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
                  <GradientText animate={true}>{config.title}</GradientText>
                </h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg sm:text-xl max-w-2xl font-primary"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                >
                  {config.description}
                </motion.p>
              </motion.div>
            </div>

            {/* Right side: stat cards - pixel style */}
            <div className="">
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  value={categoryCount}
                  label={t.docs.categoryLabel}
                  icon={Layers}
                  color="var(--accent-primary)"
                  delay={0.4}
                />
                <StatCard
                  value={docCount}
                  label={t.docs.docsLabel}
                  icon={FileText}
                  color="var(--accent-secondary)"
                  delay={0.5}
                />
                <StatCard
                  value={seriesCount}
                  label={t.docs.seriesLabel}
                  icon={BookMarked}
                  color="#22c55e"
                  delay={0.6}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories section */}
      <section className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-sans font-bold text-2xl mb-4">
            <GradientText animate={true}>{t.docs.docCategories}</GradientText>
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>{t.docs.exploreDocs}</p>
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
      </section>

      {/* Footer - shared component */}
      {siteData?.footer && <Footer data={siteData.footer} />}

      {/* Bottom light beam - desktop only */}
      {isDesktopClient && <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />}
    </div>
  );
}
