import type { Metadata } from 'next';
import { PhotosPage } from '@/components/photos/PhotosPage';

/**
 * /photos —— Server Component shell for the photos gallery page.
 */
export const metadata: Metadata = {
  title: '照片 | SAKURAIN',
  description: 'SAKURAIN 的照片墙，记录一些值得定格的瞬间。',
};

export default function Page() {
  return <PhotosPage />;
}
