import type { Metadata } from "next";
import ToolDetailLoader from "@/components/tools/ToolDetailLoader";

/**
 * 工具详情页 —— Server Component 外壳。
 * toolId 由客户端 Loader 通过 useParams 获取并查询工具注册表；
 * id 不存在时在页面内优雅降级（提示 + 返回工具箱）。
 */
export const metadata: Metadata = {
  title: "工具详情 —— SAKURAIN 工具箱",
  description: "SAKURAIN 开发者工具箱：在线开发工具详情与使用。",
};

export default function ToolDetailPage() {
  return <ToolDetailLoader />;
}
