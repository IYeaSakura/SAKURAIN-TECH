import { RouteLoader } from "@/components/RouteLoader";

/**
 * 路由级加载反馈 —— 页面为 ssr:false 客户端大包，
 * 跳转时立即渲染占位，避免白屏等待 chunk 下载与执行。
 */
export default function Loading() {
  return <RouteLoader />;
}
