'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：随记页为重度客户端页面，ssr:false 动态加载 */
const NotesPage = dynamic(() => import('./NotesPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function NotesPageLoader() {
  return <NotesPage />;
}
