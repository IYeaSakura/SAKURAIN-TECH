import type { Metadata } from 'next';
import { PhotosPage } from '@/components/photos/PhotosPage';

/**
 * /photos —— Server Component shell for the photos gallery page.
 */
export const metadata: Metadata = {
  title: 'Photos | SAKURAIN',
  description: "SAKURAIN's photo wall capturing moments worth freezing in time.",
};

export default function Page() {
  return <PhotosPage />;
}
