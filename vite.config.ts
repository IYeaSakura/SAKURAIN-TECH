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
          'animation-vendor': ['framer-motion', 'gsap', '@gsap/react'],
          // 将图标库打包到一起
          'icons-vendor': ['lucide-react'],
          // 将工具库打包到一起
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          // 将 Radix UI 组件打包到一起
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-scroll-area',
          ],
          // 将图表库打包到一起
          'charts-vendor': ['recharts'],
          // 将粒子效果库打包到一起
          'particles-vendor': ['@tsparticles/react', '@tsparticles/slim'],
        },
        // 优化 chunk 文件名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
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
    // 压缩选项 - 使用 esbuild 替代 terser
    minify: 'esbuild',
    // 启用 source map 用于生产调试（可选）
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
      'framer-motion',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [],
  },
  // CSS 配置
  css: {
    devSourcemap: true,
  },
});
