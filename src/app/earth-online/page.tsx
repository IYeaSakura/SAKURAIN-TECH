import type { Metadata } from 'next';
import EarthOnlineLoader from '@/components/earth/EarthOnlineLoader';

/**
 * /earth-online —— Cesium 3D globe + satellite bullet comments.
 * Server Component shell; the actual content is the full-page client component
 * migrated from the legacy Vite project (Phase 1 pragmatic bootstrap).
 */
export const metadata: Metadata = {
  title: 'Earth Online | SAKURAIN',
  description:
    'Interactive 3D visualization: a CesiumJS-based global real-time data globe with satellite orbit bullet comments.',
};

export default function Page() {
  return <EarthOnlineLoader />;
}
