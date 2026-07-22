// next.config.ts
import type { NextConfig } from "next";

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
  },
};

export default nextConfig;