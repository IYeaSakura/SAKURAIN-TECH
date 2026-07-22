import type { Metadata } from "next";
import ToolsLoader from "@/components/tools/ToolsLoader";

/**
 * 工具箱首页 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Tools 的整页客户端组件（Phase 1 务实起步）。
 */
export const metadata: Metadata = {
  title: "开发者工具箱 —— SAKURAIN",
  description:
    "高效便捷的在线开发者工具集合：JSON 格式化、Base64 编解码、哈希生成、正则测试、时间戳转换等 20+ 实用工具。",
};

export default function ToolsPage() {
  return <ToolsLoader />;
}
