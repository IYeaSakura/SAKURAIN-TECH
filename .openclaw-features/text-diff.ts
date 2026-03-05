/**
 * 文本对比工具
 * 添加文本差异对比工具
 * 
 * @author OpenClaw Auto-Dev
 * @date 2026-03-04
 */

export interface text_diffState {
  status: "ready" | "running" | "completed";
  data: unknown;
  message: string;
  timestamp: string;
}

export const text_diffFeature = {
  id: "text-diff",
  name: "文本对比工具",
  description: "添加文本差异对比工具",
  category: "tool",
  status: "implemented",
  createdAt: "2026-03-04T15:49:58+08:00",
  author: "OpenClaw Auto-Dev",
};

export default text_diffFeature;
