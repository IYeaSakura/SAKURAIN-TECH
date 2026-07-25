// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // EdgeOne Pages deploys the static export directly; no SSR Node runtime is
  // needed because all pages are generated at build time and dynamic APIs are
  // implemented as EdgeOne Edge Functions in the ./edge-functions directory.
  output: "export",
  distDir: "dist",

  allowedDevOrigins: ["localhost", "127.0.0.1"],

  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
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