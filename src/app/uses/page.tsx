import type { Metadata } from 'next';
import { UsesPage } from '@/components/uses/UsesPage';

export const metadata: Metadata = {
  title: 'Uses | SAKURAIN',
  description: 'SAKURAIN 日常使用的硬件、软件、技术栈与云服务清单。',
};

export default function Page() {
  return <UsesPage />;
}
