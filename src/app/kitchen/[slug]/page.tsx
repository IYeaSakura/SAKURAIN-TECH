import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipePage from '@/components/kitchen/RecipePage';
import { getAllRecipes, getRecipeBySlug } from '@/lib/content/kitchen';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 全部菜谱 slug 构建期静态生成 */
export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ slug: recipe.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return { title: '菜谱不存在 — SAKURAIN' };

  return {
    title: `${recipe.title} — SAKURAIN`,
    description: recipe.description,
    keywords: recipe.tags,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      type: 'article',
      publishedTime: recipe.date,
      tags: recipe.tags,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const all = getAllRecipes();
  const index = all.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? { slug: all[index - 1].slug, title: all[index - 1].title } : null;
  const next =
    index >= 0 && index < all.length - 1
      ? { slug: all[index + 1].slug, title: all[index + 1].title }
      : null;

  return <RecipePage recipe={recipe} prev={prev} next={next} />;
}
