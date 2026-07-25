'use client';

import dynamic from 'next/dynamic';

/**
 * Phase 1: /about is a heavy client-side page (effects / Context / browser APIs
 * are deeply coupled), so load it dynamically with ssr:false to avoid accessing
 * window/document during SSR.
 */
const AboutPage = dynamic(() => import('./AboutPage'), {
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

export default function AboutPageLoader() {
  return <AboutPage />;
}
