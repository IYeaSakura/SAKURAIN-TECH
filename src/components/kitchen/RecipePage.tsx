'use client';

/**
 * RecipePage —— 单篇菜谱。
 *
 * 头部一张信息卡（标题/导语/日期/标签/步骤数），正文交给共享的
 * MarkdownRenderer 渲染，表格、代码块、图片能力与博客、文档保持一致。
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Flame, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { ImagePreviewProvider } from '@/contexts/ImagePreviewContext';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { Recipe } from '@/lib/content/kitchen';

interface RecipePageProps {
  recipe: Recipe;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function RecipePage({ recipe, prev, next }: RecipePageProps) {
  return (
    <ImagePreviewProvider>
      <RecipeContent recipe={recipe} prev={prev} next={next} />
    </ImagePreviewProvider>
  );
}

function RecipeContent({ recipe, prev, next }: RecipePageProps) {
  const router = useRouter();
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();

  const go = (slug: string) => {
    router.push(`/kitchen/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push('/kitchen')}
          className="mb-5 inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
            boxShadow: '3px 3px 0 var(--border-subtle)',
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.kitchen.back}
        </button>

        <motion.header
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 border-2 p-6 sm:p-8"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '6px 6px 0 var(--border-subtle)',
          }}
        >
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            <UtensilsCrossed className="h-3.5 w-3.5" />
            recipe
          </div>
          <h1
            className="mb-3 text-2xl font-bold leading-snug sm:text-3xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mb-4 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {recipe.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {recipe.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              {recipe.steps} {t.kitchen.stepsUnit}
            </span>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="border px-1.5 py-0.5"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.header>

        <article
          className="border-2 p-5 sm:p-8"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <MarkdownRenderer content={recipe.content ?? ''} />
        </article>

        {(prev || next) && (
          <nav className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {prev ? (
              <button
                type="button"
                onClick={() => go(prev.slug)}
                className="border-2 p-4 text-left transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
              >
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t.kitchen.prev}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {prev.title}
                </span>
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button
                type="button"
                onClick={() => go(next.slug)}
                className="border-2 p-4 text-right transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:col-start-2"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
              >
                <span className="mb-1 flex items-center justify-end gap-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t.kitchen.next}
                  <ArrowRight className="h-3 w-3" />
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {next.title}
                </span>
              </button>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
