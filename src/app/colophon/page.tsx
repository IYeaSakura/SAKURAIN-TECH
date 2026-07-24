import type { Metadata } from 'next';
import { ColophonPage } from '@/components/colophon/ColophonPage';

/**
 * /colophon —— Server Component shell for the colophon page.
 */
export const metadata: Metadata = {
  title: 'Colophon | SAKURAIN',
  description: 'SAKURAIN 网站的构建方式、技术栈与设计说明。',
};

export default function Page() {
  return <ColophonPage />;
}
