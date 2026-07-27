import type { Metadata } from 'next';
import { MomentsPage } from '@/components/moments/MomentsPage';

/**
 * /moments —— Server Component shell for the moments gallery page.
 */
export const metadata: Metadata = {
  title: 'Moments | SAKURAIN',
  description: 'Life moments and snapshots.',
};

export default function Page() {
  return <MomentsPage />;
}
