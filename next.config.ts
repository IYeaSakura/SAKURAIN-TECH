// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // EdgeOne Pages copies the Next.js standalone output into its SSR runtime
  // image. Explicitly enabling standalone lets us control the traced files
  // and prune build-time-only dependencies after `next build`.
  output: "standalone",

  allowedDevOrigins: ["localhost", "127.0.0.1"],

  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
  },

  // Exclude build-time-only packages from the standalone server bundle to keep
  // the EdgeOne Pages deployment image small. The post-build prune script
  // removes anything that still slips through on the build platform.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/typescript/**/*",
      "node_modules/@types/**/*",
      "node_modules/eslint/**/*",
      "node_modules/eslint-config-next/**/*",
      "node_modules/postcss/**/*",
      "node_modules/autoprefixer/**/*",
      "node_modules/tailwindcss/**/*",
      "node_modules/tailwindcss-animate/**/*",
      "node_modules/edgeone/**/*",
    ],
  },

  ...(process.env.NODE_ENV === "development" ? {
    async rewrites() {
      const target = process.env.DEV_API_TARGET || "https://sakurain.net";
      return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
    },
  } : {}),
};

export default nextConfig;