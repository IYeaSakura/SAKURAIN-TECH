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
    // Project-wide conventions that clean up legacy migration noise without
    // changing runtime behavior. Rules are intentionally conservative so that
    // dangerous patterns (e.g., real bugs) are still caught.
    rules: {
      // Allow intentionally unused variables/arguments when prefixed with _.
      // This is the standard TypeScript convention for placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // The site intentionally uses plain <img> tags for external URLs,
      // markdown-rendered images, and dynamically-computed src values where
      // next/image's optimization/loader constraints would add complexity.
      "@next/next/no-img-element": "off",
      // Phase 1 migration code contains many intentional dependency arrays
      // that do not list every closure dependency. Refactoring them in bulk
      // is high-risk, so we rely on careful manual review for new code.
      "react-hooks/exhaustive-deps": "off",
    },
  },
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
      // Phase 1 迁移的 AlgoViz 算法可视化模块沿用旧版大量 any 类型，
      // 待 Phase 2 类型化后再收紧。
      "src/components/algoviz/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
