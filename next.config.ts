// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // EdgeOne Pages deploys the static export directly; no SSR Node runtime is
  // needed because all pages are generated at build time and dynamic APIs are
  // implemented as EdgeOne Edge Functions in the ./edge-functions directory.
  output: "export",
  // 生产构建输出到 dist（EdgeOne 的发布目录）；开发服务使用独立目录，
  // 避免 turbopack 把开发态 manifest 混进 dist 导致部署后资源 404。
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : "dist",

  allowedDevOrigins: ["localhost", "127.0.0.1"],

  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Offload webpack compilation to a worker process to reduce peak memory
    // usage in the main process during builds with heavy dependencies.
    webpackBuildWorker: true,
  },

  webpack: (config) => {
    // Replace @spz-loader/core with a stub. The real package contains
    // Emscripten output with octal escape sequences inside template strings,
    // which breaks strict-mode bundles in the browser.
    config.resolve.alias["@spz-loader/core"] = path.resolve(
      process.cwd(),
      "src/lib/stubs/spz-loader-stub.js"
    );
    return config;
  },
};

export default nextConfig;