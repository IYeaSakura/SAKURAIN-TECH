import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), cesium()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router'],
          // 动画库
          'framer-motion': ['framer-motion'],
          'gsap': ['gsap', '@gsap/react'],
          // 图标
          'lucide': ['lucide-react'],
          // 工具库
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          // 图表
          'charts': ['recharts'],
          // 粒子效果
          'particles': ['@tsparticles/react', '@tsparticles/slim'],
          // 3D 库 - 分开打包以减小单个 chunk 大小
          'three-core': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        },
        // 优化 chunk 文件名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          // 根据模块内容命名 chunk
          const facadeModuleId = chunkInfo.facadeModuleId || '';
          if (facadeModuleId.includes('Docs')) {
            return 'assets/docs-[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 压缩选项
    minify: 'esbuild',
    // 禁用 source map
    sourcemap: false,
  },
  // 开发服务器配置
  server: {
    hmr: true,
    open: false,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
    ],
  },
  // CSS 配置
  css: {
    devSourcemap: true,
  },
  // 实验性功能
  esbuild: {
    // 移除 console 和 debugger
    drop: ['console', 'debugger'],
  },
});
