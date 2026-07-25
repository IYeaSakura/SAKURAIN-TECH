import type { Metadata } from 'next';
import StudioPageLoader from '@/components/studio/StudioPageLoader';

/**
 * /studio —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/pages/Studio (Phase 1 pragmatic bootstrap).
 */
export const metadata: Metadata = {
  title: 'Studio | SAKURAIN',
  description:
    'SAKURAIN TEAM Studio: services, tech stack, statistics, workflow, and contact information.',
};

export default function Page() {
  return <StudioPageLoader />;
}
