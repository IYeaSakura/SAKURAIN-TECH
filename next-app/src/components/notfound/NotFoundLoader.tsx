'use client';

import dynamic from 'next/dynamic';

/**
 * 404 页面 Loader —— Phase 1：整页客户端组件（framer-motion 动画），
 * 按迁移原则用 ssr:false 动态加载。
 */
const NotFoundPage = dynamic(() => import('./NotFoundPage'), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <p className="font-mono" style={{ color: 'var(--text-muted)' }}>
        {'>'} 404
      </p>
    </div>
  ),
});

export default function NotFoundLoader() {
  return <NotFoundPage />;
}
