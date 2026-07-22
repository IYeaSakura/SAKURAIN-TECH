'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：友链页为重度客户端页面，ssr:false 动态加载 */
const FriendsPage = dynamic(() => import('./FriendsPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function FriendsPageLoader() {
  return <FriendsPage />;
}
