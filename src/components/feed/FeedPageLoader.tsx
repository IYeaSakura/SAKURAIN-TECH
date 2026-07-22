'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：朋友圈（Feed 聚合）为重度客户端页面，ssr:false 动态加载 */
const FeedPage = dynamic(() => import('./FeedPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function FeedPageLoader() {
  return <FeedPage />;
}
