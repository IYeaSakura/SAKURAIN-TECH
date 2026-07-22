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
  experimental: {
    // 按需重写具名导入为深路径导入，避免 barrel 全量打包；
    // 注意：cesium 不能加入（依赖侧效导入，会被破坏）
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
  },
  // 预留：需要 transpile 的 ESM-only 包在此追加
  transpilePackages: [],
  // 注意：EdgeOne 不支持 next.config 的 redirects/rewrites，一律走 edgeone.json
};

export default nextConfig;
