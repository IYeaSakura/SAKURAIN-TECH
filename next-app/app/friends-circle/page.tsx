import type { Metadata } from "next";
import FeedPageLoader from "@/components/feed/FeedPageLoader";

/**
 * 朋友圈 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Feed/index.tsx 的整页客户端组件。
 * 注：/api/feed/* 接口尚未迁移，接口 404 时组件内错误态兜底展示。
 */
export const metadata: Metadata = {
  title: "朋友圈 —— SAKURAIN",
  description: "聚合友链网站的最新文章，实时同步更新，一站式阅读体验。",
};

export default function Page() {
  return <FeedPageLoader />;
}
