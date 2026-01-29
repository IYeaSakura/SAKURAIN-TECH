import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库打包到一起
          'react-vendor': ['react', 'react-dom'],
          // 将动画库打包到一起
          'animation-vendor': ['framer-motion'],
          // 将图标库打包到一起
          'icons-vendor': ['lucide-react'],
          // 将工具库打包到一起
          'utils-vendor': ['clsx', 'tailwind-merge'],
        },
      },
    },
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
});
