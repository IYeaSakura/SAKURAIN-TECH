---
title: React + TypeScript + Vite 快速上手指南
description: 从零开始搭建一个现代化的 React 开发环境，包含最佳实践和常用配置。
date: 2025-02-06
author: SAKURAIN
tags: React, TypeScript, Vite, 教程
cover: /image/logo.webp
featured: false
---

# React + TypeScript + Vite 快速上手指南

本指南将带你从零开始搭建一个现代化的 React 开发环境。

## 为什么选择这个技术栈？

### React 19

React 19 带来了许多改进：
- 更好的并发渲染
- 改进的 Hooks
- 更小的包体积

### TypeScript

提供类型安全，减少运行时错误：
- 智能代码提示
- 重构更安全
- 更好的文档

### Vite

极速的开发体验：
- 即时的热更新
- 开箱即用的配置
- 优化的生产构建

## 创建项目

使用以下命令创建新项目：

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

## 项目结构

推荐的项目结构：

```
src/
├── components/     # 可复用组件
│   ├── ui/        # 基础 UI 组件
│   └── features/   # 功能组件
├── pages/          # 页面组件
├── hooks/          # 自定义 Hooks
├── lib/            # 工具函数
├── types/          # TypeScript 类型
└── styles/         # 全局样式
```

## 最佳实践

### 1. 使用 TypeScript 严格模式

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### 2. 组件组织

```typescript
// 好的实践：组件职责单一
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### 3. 使用自定义 Hooks

```typescript
// hooks/useWindowSize.ts
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

## 常用配置

### ESLint + Prettier

```bash
npm install -D eslint prettier eslint-config-prettier
```

### Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Git Hooks (Husky)

```bash
npm install -D husky lint-staged
npx husky init
```

## 构建和部署

### 开发构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 总结

这个技术栈提供了：
- ⚡ 极速的开发体验
- 🛡️ 类型安全
- 🎨 灵活的样式方案
- 📦 优化的生产构建

开始你的开发之旅吧！

---

*本文发布于 2025-02-06*
