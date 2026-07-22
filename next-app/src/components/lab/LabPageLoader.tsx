'use client';

import dynamic from 'next/dynamic';

/**
 * Phase 1：/lab 展品为纯客户端 3D 场景（WebGL / 浏览器 API），
 * 按迁移原则用 ssr:false 动态加载。
 */
const LabPage = dynamic(() => import('./LabPage'), {
  ssr: false,
  loading: () => (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
      <div className="flex h-[68vh] min-h-[420px] items-center justify-center border border-white/10 bg-[#05070a]">
        <p className="font-mono text-xs tracking-widest text-white/50">
          {'>'} INITIALIZING EXHIBIT_001...
        </p>
      </div>
    </main>
  ),
});

export default function LabPageLoader() {
  return <LabPage />;
}
