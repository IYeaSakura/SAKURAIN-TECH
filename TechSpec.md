# SAKURAIN 技术团队网站 - 技术规范

## 组件清单

### shadcn/ui 组件
| 组件 | 用途 | 定制需求 |
|------|------|----------|
| Button | CTA按钮、导航按钮 | 添加磁吸效果、自定义变体 |
| Card | Bento Grid卡片、定价卡片 | 添加悬浮动画、边框效果 |
| Badge | 技术标签、属性标签 | 自定义颜色变体 |
| Input | 联系表单输入框 | 浮动标签样式、底部线条动画 |
| Textarea | 联系表单留言框 | 同上 |
| Dialog | 服务详情弹窗 | 自定义进入/退出动画 |
| Tabs | 定价视图切换 | 滑动指示器动画 |
| Sheet | 移动端导航菜单 | 全屏覆盖、stagger动画 |
| Separator | 分隔线 | 无 |

### 第三方组件
| 组件 | 来源 | 用途 |
|------|------|------|
| @number-flow/react | npm | 数字滚动动画 |

### 自定义组件

#### UI 原子组件
| 组件 | 功能 | 复杂度 |
|------|------|--------|
| MagneticButton | 磁吸效果按钮 | 高 |
| RevealText | 文字入场动画 | 高 |
| AnimatedCard | 悬浮动画卡片 | 中 |
| FloatingLabelInput | 浮动标签输入框 | 中 |
| TechBadge | 技术标签（渐变填充） | 低 |
| CountUpNumber | 数字计数动画 | 中 |

#### 特效组件
| 组件 | 功能 | 复杂度 |
|------|------|--------|
| FluidBackground | WebGL流体背景 | 极高 |
| ScrollProgress | 顶部滚动进度条 | 低 |
| SmoothScroll | Lenis平滑滚动封装 | 中 |
| ParallaxContainer | 视差容器 | 中 |
| GridLines | Bento网格线动画 | 中 |
| GlowPath | SVG发光路径 | 中 |

#### Section 组件
| 组件 | 功能 | 复杂度 |
|------|------|--------|
| Navigation | 玻璃态导航栏 | 高 |
| Hero | 首屏展示 | 极高 |
| Stats | 信任指标 | 中 |
| Services | Bento Grid服务展示 | 高 |
| TechStack | 技术栈展示 | 高 |
| Pricing | 定价矩阵 | 高 |
| Process | 工作流程时间线 | 高 |
| Cases | 案例展示 | 中 |
| Contact | 联系表单 | 中 |
| Footer | 页脚（Reveal效果） | 中 |

## 动画实现表

| 动画 | 库 | 实现方式 | 复杂度 |
|------|-----|----------|--------|
| 平滑滚动 | Lenis | Lenis实例 + RAF循环 | 中 |
| 滚动进度条 | GSAP | ScrollTrigger监听 | 低 |
| 文字Reveal | GSAP + SplitType | 文字拆分 + 逐字符动画 | 高 |
| 磁吸按钮 | 原生JS | 鼠标位置追踪 + transform | 中 |
| 流体背景 | Three.js/React-Three-Fiber | 着色器材质 + 噪声函数 | 极高 |
| Bento网格线 | GSAP | SVG stroke-dashoffset | 中 |
| 卡片悬浮 | Framer Motion | whileHover + spring | 低 |
| 数字计数 | @number-flow/react | 内置动画 | 低 |
| 视差效果 | GSAP ScrollTrigger | scrub模式 | 中 |
| 导航隐藏/显示 | Framer Motion | useScroll + AnimatePresence | 中 |
| 页脚Reveal | CSS + GSAP | fixed定位 + margin-bottom | 中 |
| 时间线发光路径 | GSAP ScrollTrigger | stroke-dashoffset同步滚动 | 中 |
| 技术栈3D云 | Three.js | 球面分布 + 拖拽旋转 | 高 |
| 定价标签切换 | GSAP Flip | layout动画 | 中 |
| 表单提交动画 | Framer Motion | layoutId + 形态变化 | 中 |

## 项目文件结构

```
public/
├── data/
│   ├── site.json          # 团队信息、导航、Footer
│   ├── theme.json         # 设计Token
│   ├── hero.json          # 首屏内容
│   ├── stats.json         # 信任指标
│   ├── services.json      # 服务模块
│   ├── tech-stack.json    # 技术栈
│   ├── pricing.json       # 定价矩阵
│   ├── process.json       # 工作流程
│   ├── cases.json         # 案例
│   └── navigation.json    # 菜单与社交链接
├── images/
│   └── cases/             # 案例截图
└── textures/              # WebGL纹理

src/
├── components/
│   ├── ui/                # shadcn/ui组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── sheet.tsx
│   │   └── separator.tsx
│   ├── atoms/             # 原子组件
│   │   ├── MagneticButton.tsx
│   │   ├── RevealText.tsx
│   │   ├── AnimatedCard.tsx
│   │   ├── FloatingLabelInput.tsx
│   │   ├── TechBadge.tsx
│   │   └── CountUpNumber.tsx
│   ├── effects/           # 特效组件
│   │   ├── FluidBackground.tsx
│   │   ├── ScrollProgress.tsx
│   │   ├── SmoothScroll.tsx
│   │   ├── ParallaxContainer.tsx
│   │   ├── GridLines.tsx
│   │   └── GlowPath.tsx
│   └── sections/          # 页面区块
│       ├── Navigation.tsx
│       ├── Hero.tsx
│       ├── Stats.tsx
│       ├── Services.tsx
│       ├── TechStack.tsx
│       ├── Pricing.tsx
│       ├── Process.tsx
│       ├── Cases.tsx
│       ├── Contact.tsx
│       └── Footer.tsx
├── hooks/
│   ├── useConfig.ts       # JSON配置读取
│   ├── useScrollProgress.ts
│   ├── useMagnetic.ts
│   ├── useInView.ts
│   ├── useLenis.ts        # Lenis初始化
│   └── useWindowSize.ts
├── types/
│   └── index.ts           # TypeScript接口
├── lib/
│   ├── utils.ts           # cn()函数
│   └── animations.ts      # 动画变体定义
├── styles/
│   └── globals.css
├── App.tsx
└── main.tsx
```

## 依赖列表

### 核心依赖
```bash
# 动画库
npm install gsap @gsap/react lenis framer-motion

# 数字动画
npm install @number-flow/react

# 图标
npm install lucide-react

# 工具
npm install clsx tailwind-merge
```

### 开发依赖
- TypeScript 5+
- Vite 5+
- Tailwind CSS 3.4+
- PostCSS
- Autoprefixer

## 配置系统

### theme.json 结构
```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    primaryHover: string;
    surface: string;
    background: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    accent: string;
    border: string;
    borderHover: string;
    success: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    heroSize: string;
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
    lineHeightTight: number;
    lineHeightNormal: number;
  };
  spacing: {
    section: string;
    container: string;
    gridGap: string;
    cardPadding: string;
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
      stagger: number;
    };
    easing: {
      smooth: number[];
      bounce: number[];
      spring: { stiffness: number; damping: number };
    };
    parallax: {
      backgroundSpeed: number;
      contentSpeed: number;
      floatSpeed: number;
    };
  };
  effects: {
    glassBg: string;
    glassBlur: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowHover: string;
  };
}
```

### 数据接口定义
```typescript
// types/index.ts

export interface TeamInfo {
  name: string;
  slogan: string;
  description: string;
  founded: string;
  location: string;
  email: string;
  social: {
    github: string;
    telegram?: string;
    wechat?: string;
  };
}

export interface HeroContent {
  greeting: string;
  title: string;
  subtitle: string;
  backgroundEffect: 'fluid' | 'mesh' | 'particles';
  cta: Array<{
    text: string;
    link: string;
    style: 'primary' | 'secondary';
  }>;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  size: 'large' | 'medium' | 'small';
  priceRange: string;
  delivery: string;
  features: string[];
  techStack: string[];
  caseIds: string[];
  popular?: boolean;
}

export interface PricingCategory {
  id: string;
  name: string;
  description: string;
  items: PricingItem[];
}

export interface PricingItem {
  name: string;
  price: number;
  priceType: 'fixed' | 'range' | 'negotiable';
  specs: string[];
  technicalParams: Record<string, string>;
  negotiable: boolean;
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Case {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  result: string;
  image?: string;
  demo?: boolean;
}
```

## 动画规范详解

### 1. 入场动画变体
```typescript
// lib/animations.ts

export const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};
```

### 2. GSAP ScrollTrigger 配置
```typescript
// 视差效果
gsap.to(element, {
  y: -100,
  ease: 'none',
  scrollTrigger: {
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});

// 文字Reveal
gsap.from(chars, {
  y: '100%',
  opacity: 0,
  stagger: 0.05,
  duration: 0.8,
  ease: 'power4.out',
  scrollTrigger: {
    trigger: textElement,
    start: 'top 80%',
    toggleActions: 'play none none none'
  }
});
```

### 3. Lenis 平滑滚动配置
```typescript
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
```

## 性能优化策略

### 1. 动画性能
- 仅使用 `transform` 和 `opacity`
- 动画元素添加 `will-change`，结束后移除
- 使用 `Intersection Observer` 暂停视口外动画
- 复杂动画使用 `requestAnimationFrame`

### 2. 加载优化
- 图片懒加载（Intersection Observer）
- JSON数据缓存（SWR或React Query）
- 组件代码分割（React.lazy + Suspense）
- WebGL纹理压缩

### 3. 可访问性
- `prefers-reduced-motion` 媒体查询
- 键盘导航支持
- 语义化HTML标签
- 足够的颜色对比度

## 响应式断点

```typescript
const breakpoints = {
  sm: '640px',   // 手机横屏
  md: '768px',   // 平板
  lg: '1024px',  // 小桌面
  xl: '1280px',  // 桌面
  '2xl': '1536px' // 大桌面
};
```

### 动画降级策略
- **Desktop**: 全功能动画
- **Tablet**: 简化视差，保留悬浮效果
- **Mobile**: 禁用复杂WebGL，简化入场动画
- **Reduced Motion**: 仅保留淡入淡出
