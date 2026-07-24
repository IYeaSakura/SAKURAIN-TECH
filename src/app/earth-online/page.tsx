import type { Metadata } from 'next';
import EarthOnlineLoader from '@/components/earth/EarthOnlineLoader';

/**
 * /earth-online —— Cesium 3D 地球 + 卫星弹幕 + 中国 3D 地图。
 * Server Component 外壳；实际内容为迁移自旧 Vite 项目的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: '地球 Online | SAKURAIN',
  description:
    '交互式 3D 可视化：基于 CesiumJS 的全球实时数据地球、卫星轨道弹幕，以及 Three.js 高精度 3D 中国地图。',
};

export default function Page() {
  return <EarthOnlineLoader />;
}
