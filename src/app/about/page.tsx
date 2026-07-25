import type { Metadata } from 'next';
import AboutPageLoader from '@/components/about/AboutPageLoader';

/**
 * /about —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/pages/About (Phase 1 pragmatic bootstrap).
 */
export const metadata: Metadata = {
  title: 'About | SAKURAIN',
  description:
    'About Yuyang: full-stack development, game algorithms, and AI research, including tech stack, project data, and honors.',
};

export default function Page() {
  return <AboutPageLoader />;
}
