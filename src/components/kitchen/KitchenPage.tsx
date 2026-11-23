'use client';

/**
 * KitchenPage —— 菜谱列表。
 *
 * 沿用全站的 brutalist 语言：2px 描边 + 硬阴影 + 等宽小字，
 * 顶部提供搜索与标签筛选，卡片直接进入详情。
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, UtensilsCrossed, Flame, Calendar, X } from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { SiteData } from '@/types';
import type { Recipe } from '@/lib/content/kitchen';

interface KitchenPageProps {
  recipes: Recipe[];
  tags: Array<{ name: string; count: number }>;
  footer: SiteData['footer'] | null;
}

function RecipeCard({
  recipe,
  index,
  onOpen,
  stepsLabel,
}: {
  recipe: Recipe;
  index: number;
  onOpen: () => void;
  stepsLabel: string;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      className="group relative flex h-full flex-col border-2 p-5 text-left transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
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

      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        <span>#{String(index + 1).padStart(2, '0')}</span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {recipe.date || '—'}
        </span>
      </div>

      <h3
        className="mb-2 text-lg font-bold leading-snug"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
      >
        {recipe.title}
      </h3>

      <p
        className="mb-4 line-clamp-2 text-[13px] leading-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        {recipe.description}
      </p>

      <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-wrap items-center gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
          <Flame className="h-3 w-3" />
          {recipe.steps} {stepsLabel}
        </span>
      </div>
    </motion.button>
  );
}

export default function KitchenPage({ recipes, tags, footer }: KitchenPageProps) {
  const router = useRouter();
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (activeTag && !recipe.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        recipe.title.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [recipes, query, activeTag]);

  const openRecipe = (slug: string) => {
    router.push(`/kitchen/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <motion.header
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
          <div className="mb-3 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center border-2"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
            >
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              kitchen
            </span>
          </div>
          <h1
            className="mb-2 text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {t.kitchen.title}
          </h1>
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            {t.kitchen.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            <span>{recipes.length} {t.kitchen.recipeUnit}</span>
            <span>{tags.length} {t.kitchen.tagUnit}</span>
          </div>
        </motion.header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            className="flex flex-1 items-center gap-2 border-2 px-3 py-2"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.kitchen.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label={t.kitchen.clear}>
                <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors"
              style={{
                borderColor: activeTag === null ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: activeTag === null ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'var(--bg-secondary)',
              }}
            >
              {t.kitchen.allTags}
            </button>
            {tags.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
                className="border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors"
                style={{
                  borderColor: activeTag === tag.name ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: activeTag === tag.name ? 'var(--accent-primary)' : 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                }}
              >
                {tag.name} {tag.count}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="border-2 px-6 py-16 text-center"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <UtensilsCrossed className="mx-auto mb-3 h-6 w-6" />
            <p className="text-sm">{t.kitchen.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe, index) => (
              <RecipeCard
                key={recipe.slug}
                recipe={recipe}
                index={index}
                onOpen={() => openRecipe(recipe.slug)}
                stepsLabel={t.kitchen.stepsUnit}
              />
            ))}
          </div>
        )}
      </main>

      {footer && <Footer data={footer} />}
    </div>
  );
}
