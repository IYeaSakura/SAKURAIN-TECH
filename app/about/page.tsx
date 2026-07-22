import type { Metadata } from 'next';
import AboutPageLoader from '@/components/about/AboutPageLoader';

/**
 * /about —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/About 的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: '关于 | SAKURAIN',
  description:
    '关于 Yuyang：全栈开发、博弈算法与 AI 研究，技术栈词云、项目介绍与荣誉成就。',
};

export default function Page() {
  return <AboutPageLoader />;
}
