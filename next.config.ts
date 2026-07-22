// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 删除 output: "standalone"
  // 删除 outputFileTracingRoot
  // 删除 outputFileTracingExcludes

  allowedDevOrigins: ["localhost", "127.0.0.1"],

  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
  },

  ...(process.env.NODE_ENV === "development" ? {
    async rewrites() {
      const target = process.env.DEV_API_TARGET || "https://sakurain.net";
      return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
    },
  } : {}),
};

export default nextConfig;