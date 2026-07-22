import type { Metadata } from "next";
import FriendsPageLoader from "@/components/friends/FriendsPageLoader";

/**
 * 友情链接 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Friends/index.tsx 的整页客户端组件。
 */
export const metadata: Metadata = {
  title: "友情链接 —— SAKURAIN",
  description: "友情链接：与我相关的朋友们、友链推荐与演示站点。",
};

export default function Page() {
  return <FriendsPageLoader />;
}
