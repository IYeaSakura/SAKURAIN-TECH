import type { Metadata } from 'next';
import LabPageLoader from '@/components/lab/LabPageLoader';

export const metadata: Metadata = {
  title: '实验室 | SAKURAIN',
  description:
    'SAKURAIN 实验室 —— 3D 创意展厅。首件展品：莫比乌斯数据环，一万四千个发光粒子沿单侧曲面循环流动。',
};

/**
 * /lab —— 实验室展厅（Server Component 外壳）。
 * 实际内容为纯客户端 WebGL 场景，经 ssr:false 动态加载。
 */
export default function LabRoute() {
  return <LabPageLoader />;
}
