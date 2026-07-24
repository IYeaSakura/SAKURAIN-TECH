import { RouteLoader } from "@/components/RouteLoader";

/**
 * 路由级加载反馈 —— 页面已 SSG，
 * 仅在客户端导航的 Suspense 边界兜底显示。
 */
export default function Loading() {
  return <RouteLoader />;
}
