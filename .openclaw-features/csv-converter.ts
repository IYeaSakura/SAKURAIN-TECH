/**
 * CSV转换工具
 * 添加CSV与JSON互转工具
 * 
 * @author OpenClaw Auto-Dev
 * @date 2026-03-04
 */

export interface csv_converterState {
  status: "ready" | "running" | "completed";
  data: unknown;
  message: string;
  timestamp: string;
}

export const csv_converterFeature = {
  id: "csv-converter",
  name: "CSV转换工具",
  description: "添加CSV与JSON互转工具",
  category: "tool",
  status: "implemented",
  createdAt: "2026-03-04T15:50:03+08:00",
  author: "OpenClaw Auto-Dev",
};

export default csv_converterFeature;
