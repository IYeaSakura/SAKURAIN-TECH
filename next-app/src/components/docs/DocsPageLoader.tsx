'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：文档站为重度客户端页面，ssr:false 动态加载 */
const DocsPage = dynamic(() => import('./DocsPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function DocsPageLoader() {
  return <DocsPage />;
}
