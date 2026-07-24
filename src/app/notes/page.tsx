import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * 开发日志已重构为说说，旧 /notes 路径 301 跳转至 /shuoshuo。
 * 保留外链与搜索引擎索引兼容性。
 */
export const metadata: Metadata = {
  title: "说说 —— SAKURAIN",
  description: "记录日常灵感、心情与碎碎念。",
};

export default function Page() {
  redirect("/shuoshuo");
}
