import type { Metadata } from 'next';
import ResumePageLoader from '@/components/resume/ResumePageLoader';

/**
 * /resume —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Resume 的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: '简历 | SAKURAIN',
  description:
    'Yuyang 的个人简历：核心优势、技术栈、实习与项目经历、教育背景与获奖证书。',
};

export default function Page() {
  return <ResumePageLoader />;
}
