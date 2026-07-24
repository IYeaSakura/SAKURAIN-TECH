import type { Metadata } from 'next';
import { PhotoLogPage } from '@/components/photolog/PhotoLogPage';

/**
 * /photolog —— Server Component shell for the photo log page.
 */
export const metadata: Metadata = {
  title: '照片日志 | SAKURAIN',
  description: 'SAKURAIN 的照片日志，记录一些值得定格的瞬间。',
};

export default function Page() {
  return <PhotoLogPage />;
}
