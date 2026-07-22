import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 仓库根还有旧 Vite 项目的 lockfile，显式固定 tracing root 到 next-app/
  outputFileTracingRoot: path.join(__dirname),
  compiler: {
    // 生产环境移除 console，保留 error / warn
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  // 预留：需要 transpile 的 ESM-only 包在此追加
  transpilePackages: [],
  // 注意：EdgeOne 不支持 next.config 的 redirects/rewrites，一律走 edgeone.json
};

export default nextConfig;
