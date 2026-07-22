import type { Metadata } from "next";
import HomePageLoader from "@/components/HomePageLoader";

/**
 * 首页 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/App.tsx 的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: "SAKURAIN —— 有用、有料、有趣",
  description:
    "SAKURAIN 的个人门户：技术博客、随记、文档与开源作品。有用、有料、有趣。",
};

export default function Page() {
  return <HomePageLoader />;
}
