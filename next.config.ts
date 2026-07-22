import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep tracing root at the project root now that next-app/ has been promoted.
  outputFileTracingRoot: path.join(__dirname),
  // Suppress cross-origin dev warnings when accessing localhost via 127.0.0.1.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
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
  // 注意：EdgeOne 不支持 next.config 的 redirects/rewrites，一律走 edgeone.json。
  // 因此下面的 rewrites 仅在开发态生效：把 /api/* 代理到 DEV_API_TARGET，
  // 生产构建输出不包含任何 rewrites。
  // 代理目标由环境变量 DEV_API_TARGET 决定：
  //   - 默认 https://sakurain.net（线上生产真实 API，CORS 已全开）；
  //   - 想回本地后端：在 .env.local 设 DEV_API_TARGET=http://localhost:8788。
  ...(process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          const devApiTarget =
            process.env.DEV_API_TARGET || "https://sakurain.net";
          return [
            {
              source: "/api/:path*",
              destination: `${devApiTarget}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
