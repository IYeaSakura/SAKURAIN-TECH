'use client';

import dynamic from 'next/dynamic';
import type { Note } from '@/lib/content/notes';
import type { BlogPost } from '@/components/blog/types';

/**
 * Phase 1：首页为重度客户端页面（特效/Context/浏览器 API 深度耦合），
 * 按迁移原则用 ssr:false 动态加载，避免 SSR 阶段的 window/document 访问。
 * 近期文章与说说数据由服务端组件在构建期注入。
 */
const HomePage = dynamic(() => import('./HomePage'), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center font-mono">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
      </div>
    </div>
  ),
});

interface HomePageLoaderProps {
  notes: Note[];
  posts: BlogPost[];
}

export default function HomePageLoader({ notes, posts }: HomePageLoaderProps) {
  return <HomePage notes={notes} posts={posts} />;
}
