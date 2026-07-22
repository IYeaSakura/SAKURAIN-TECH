import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 独立于此目录的 flat config，避免 ESLint 向上匹配到旧 Vite 项目的配置
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Phase 1 迁移代码（Blog/Notes/Docs 内容系统）沿用旧版大量 any 类型
    // （react-markdown 组件 props 注入等），待 Phase 2 类型化后再收紧。
    files: [
      "src/components/blog/**/*.{ts,tsx}",
      "src/components/notes/**/*.{ts,tsx}",
      "src/components/docs/**/*.{ts,tsx}",
      "src/components/markdown/**/*.{ts,tsx}",
      "src/components/BlogTagCloud.tsx",
      "src/hooks/useBlogArchive.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
