import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import KitchenPage from '@/components/kitchen/KitchenPage';
import { getAllRecipeTags, getAllRecipes } from '@/lib/content/kitchen';
import type { SiteData } from '@/types';

export const metadata: Metadata = {
  title: 'Kitchen — SAKURAIN',
  description: '菜谱合集：家常快手菜的做法、配料与关键步骤记录。',
};

/** 页脚数据在构建期读取，避免客户端再发一次请求 */
function getFooterData(): SiteData['footer'] | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'site-data.json'), 'utf-8');
    return (JSON.parse(raw) as SiteData).footer ?? null;
  } catch {
    return null;
  }
}

export default function Page() {
  return (
    <KitchenPage
      recipes={getAllRecipes()}
      tags={getAllRecipeTags()}
      footer={getFooterData()}
    />
  );
}
