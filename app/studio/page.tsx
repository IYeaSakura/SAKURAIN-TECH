import type { Metadata } from 'next';
import StudioPageLoader from '@/components/studio/StudioPageLoader';

/**
 * /studio —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Studio 的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: '工作室 | SAKURAIN',
  description:
    'SAKURAIN TEAM 工作室：服务、技术栈、统计数据、工作流程与联系方式展示。',
};

export default function Page() {
  return <StudioPageLoader />;
}
