/**
 * 个人项目数据层 —— /projects 页面的唯一数据源。
 * Server Component (app/projects/page.tsx) 直接读取，
 * 序列化后传给客户端组件 ProjectsGrid / ProjectModal。
 */
export interface Project {
  id: string; // slug
  name: string;
  tagline: string; // 一句话简介
  description: string; // 模态框完整介绍（支持多段，\n\n 分段）
  tech: string[]; // 技术栈标签
  category: 'Web' | 'Tool' | 'Visualization' | 'Other';
  status: 'active' | 'maintained' | 'archived' | 'wip';
  period: string; // 如 "2025 — 至今"
  demoUrl?: string; // 可选
  githubUrl?: string; // 可选
  highlights: string[]; // 模态框里的亮点列表
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: 'sakurain-tech',
    name: 'SAKURAIN-TECH',
    tagline: '个人品牌门户 —— 有用、有料、有趣的技术创作者站点',
    description:
      '本站。一个以 React 19 + Next.js 15 为基座的全栈个人品牌门户，集博客、文档、3D 地球、算法可视化与社交功能于一体。\n\n前端采用 App Router + Tailwind CSS + Framer Motion，全站 SSG 静态生成；后端依赖 Cloudflare 边缘函数与 KV 存储，实现无服务器的评论、弹幕与朋友圈数据读写。',
    tech: [
      'Next.js 15',
      'React 19',
      'TypeScript',
      'Tailwind CSS',
      'Framer Motion',
      'Cesium',
      'Cloudflare Workers',
      'Edge KV',
    ],
    category: 'Web',
    status: 'active',
    period: '2025 — 至今',
    demoUrl: 'https://sakurain.net',
    githubUrl: 'https://github.com/IYeaSakura/SAKURAIN-TECH',
    highlights: [
      'Cesium 3D 地球：实时卫星追踪与全球弹幕可视化',
      'AlgoViz 算法可视化模块：排序 / 图论 / 动态规划动画演示',
      '边缘 KV 驱动的评论系统与朋友圈时间线，零自建服务器',
      '全站 SSG + 边缘缓存，首屏秒开，Lighthouse 全绿',
    ],
    featured: true,
  },
  {
    id: 'algostage',
    name: 'AlgoStage',
    tagline: '独立算法可视化平台 —— 让每一步推导都看得见',
    description:
      '从本站 AlgoViz 模块独立演进而来的算法可视化平台，面向教学与自学场景，提供可交互、可单步调试的算法动画播放器。\n\n目标是让任何算法讲解文章都能内嵌一个"可暂停、可回退、可变速"的执行现场，而不是一张静态配图。',
    tech: ['React', 'TypeScript', 'Vite', 'Canvas', 'Web Workers'],
    category: 'Visualization',
    status: 'wip',
    period: '2025 — 至今',
    highlights: [
      '单步执行引擎：逐指令推进，支持断点与回退',
      '伪代码同步高亮：动画与代码行实时对应',
      '可嵌入播放器：iframe / Web Component 两种嵌入方式',
    ],
  },
  {
    id: 'coming-soon',
    name: 'Next Big Thing',
    tagline: '下一个项目，正在酝酿',
    description: '酝酿中……',
    tech: [],
    category: 'Other',
    status: 'wip',
    period: '待定',
    highlights: [],
  },
];
