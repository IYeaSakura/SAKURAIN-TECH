import type { Metadata } from "next";
import AlgoVizLoader from "@/components/algoviz/AlgoVizLoader";

// 全局 CSS 必须在 app/ 目录导入（原 AlgoViz 组件内的样式迁移到此处统一引入）
import "@/components/algoviz/algo-visualizer.css";
import "@/components/algoviz/components/memory-visualizer.css";

/**
 * /algo-viz —— 算法可视化实验室。
 * Server Component 外壳；实际内容为迁移自旧 Vite 项目
 * src/pages/AlgoViz/ 的整页客户端组件（排序/图论/DP，单步执行引擎 + 伪代码同步）。
 */
export const metadata: Metadata = {
  title: "算法可视化 —— SAKURAIN",
  description:
    "交互式学习经典算法：排序、图论、动态规划可视化，代码与动画逐帧同步，支持单步执行与复盘。",
};

export default function Page() {
  return <AlgoVizLoader />;
}
