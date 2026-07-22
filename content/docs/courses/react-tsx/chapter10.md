## 第10章 构建时优化与加载策略：工程化性能保障

### 10.1 Tree Shaking与副作用消除

Tree Shaking是构建时优化的核心技术，它可以消除未使用的代码，减少包体积。

#### 10.1.1 ES Module的静态分析

Tree Shaking依赖于ES Module的静态结构，这使得构建工具可以在编译时确定模块的依赖关系。

**Webpack vs Rollup vs esbuild vs Turbopack的DCE算法差异与性能基准**

```
Tree Shaking实现对比：

| 工具 | DCE算法 | 分析深度 | 副作用检测 | 构建速度 |
|-----|---------|---------|-----------|---------|
| Webpack | 基于AST | 中等 | 需要标记 | 较慢 |
| Rollup | 基于AST | 深 | 自动检测 | 中等 |
| esbuild | 基于AST | 浅 | 有限 | 极快 |
| Turbopack | 基于AST | 深 | 自动检测 | 快 |
| SWC | 基于AST | 中等 | 需要标记 | 快 |

副作用检测方式：
- 自动检测：分析代码确定是否有副作用
- 需要标记：依赖package.json中的sideEffects字段
- 有限：仅支持基本的副作用检测
```

```typescript
// sideEffects配置示例
// package.json
{
  "name": "my-library",
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfill.js"
  ]
}

// 无副作用的模块标记
// 在文件顶部添加注释
/*#__PURE__*/
export function pureFunction() {
  return 'pure';
}

// 有副作用的代码
console.log('side effect');  // 这行代码不会被tree shake

// 纯函数调用标记
const result = /*#__PURE__*/pureFunction();  // 如果result未使用，会被tree shake
```

#### 10.1.2 React的__PURE__注解

React使用`__PURE__`注解来帮助构建工具识别纯函数调用。

**UglifyJS/Terser的函数标记与副作用推断**

```typescript
// React JSX转换后的代码
// 原始JSX
const element = <div className="app">Hello</div>;

// 转换后（带PURE标记）
const element = /*#__PURE__*/ React.createElement(
  'div',
  { className: 'app' },
  'Hello'
);

// 如果element未被使用，整个调用会被tree shake

// babel-plugin-transform-react-pure-annotations源码原理
/*
该Babel插件会自动为以下调用添加PURE注释：
1. React.createElement
2. React.cloneElement
3. React.Children.map/foreach/etc
4. 自定义组件调用（如果组件被标记为纯函数）
*/

// 配置示例
// babel.config.js
module.exports = {
  plugins: [
    'babel-plugin-transform-react-pure-annotations',
  ],
};
```

#### 10.1.3 组件库的Tree Shaking优化

组件库需要特别注意Tree Shaking配置，以确保用户只打包使用的组件。

**Babel Runtime Helpers的按需引入与lodash-es的对比分析**

```typescript
// 问题：全量引入
import _ from 'lodash';
const result = _.map([1, 2, 3], x => x * 2);  // 打包整个lodash

// 优化1：按需引入
import map from 'lodash/map';
const result = map([1, 2, 3], x => x * 2);  // 只打包map函数

// 优化2：使用lodash-es
import { map } from 'lodash-es';
const result = map([1, 2, 3], x => x * 2);  // Tree shaking友好

// 优化3：使用babel-plugin-lodash
// 自动转换 import { map } from 'lodash' 为按需引入

// Barrel Files的反模式与优化
// 问题：barrel文件阻碍tree shaking
// components/index.ts
export * from './Button';
export * from './Input';
export * from './Select';
export * from './Table';  // 即使只使用Button，也会分析所有导出

// 优化：直接导入
// 不要 import { Button } from './components';
// 而是 import { Button } from './components/Button';

// 组件库优化配置
// package.json
{
  "name": "my-ui-library",
  "sideEffects": [
    "*.css",
    "*.less",
    "es/**/style/*",
    "lib/**/style/*",
    "*.scss"
  ],
  "module": "es/index.js",  // ES Module入口
  "main": "lib/index.js",    // CommonJS入口
}
```

### 10.2 代码分割与模块联邦

代码分割允许将应用拆分为多个小块，按需加载，减少初始加载时间。

#### 10.2.1 React.lazy与Suspense

React.lazy和Suspense提供了声明式的代码分割方案。

**动态导入(import())的边界确定与错误边界(Error Boundary)的级联设计**

```typescript
// 基础用法
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}

// 带错误边界
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Loading />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

// 预加载策略
const LazyComponentWithPreload = Object.assign(
  React.lazy(() => import('./HeavyComponent')),
  {
    preload: () => import('./HeavyComponent'),
  }
);

// 路由分割
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./pages/Dashboard')),
  },
  {
    path: '/settings',
    component: React.lazy(() => import('./pages/Settings')),
  },
];

// 预加载当前路由的下一个可能路由
function useRoutePreload(currentPath: string) {
  useEffect(() => {
    const nextRoutes = getLikelyNextRoutes(currentPath);
    nextRoutes.forEach(route => {
      route.component.preload?.();
    });
  }, [currentPath]);
}
```

#### 10.2.2 Module Federation的依赖共享

Module Federation允许在运行时共享模块，是微前端架构的核心技术。

**Singleton与StrictVersion的冲突解决算法与运行时版本对齐**

```typescript
// Module Federation配置
// webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js',
        app2: 'app2@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,        // 强制单例
          requiredVersion: '^18.0.0',
          strictVersion: true,    // 版本必须匹配
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        lodash: {
          eager: false,           // 不预加载
        },
      },
    }),
  ],
};

// 共享依赖的TS类型共享与类型合并
declare module 'app1/Component' {
  import { ComponentType } from 'react';
  const Component: ComponentType<{
    title: string;
    onAction: () => void;
  }>;
  export default Component;
}

// 使用远程组件
const RemoteComponent = React.lazy(() => import('app1/Component'));

function HostApp() {
  return (
    <Suspense fallback={<Loading />}>
      <RemoteComponent
        title="From Host"
        onAction={() => console.log('action')}
      />
    </Suspense>
  );
}
```

#### 10.2.3 微前端架构的CSS隔离与JS沙箱

微前端需要解决样式和JavaScript的隔离问题。

**Shadow DOM的样式封装与Qiankun的ProxySandbox原理**

```typescript
// Shadow DOM样式隔离
function ShadowComponent({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  
  useEffect(() => {
    if (hostRef.current && !shadowRoot) {
      const shadow = hostRef.current.attachShadow({ mode: 'open' });
      setShadowRoot(shadow);
    }
  }, []);
  
  return (
    <div ref={hostRef}>
      {shadowRoot && createPortal(children, shadowRoot)}
    </div>
  );
}

// Qiankun的ProxySandbox
/*
ProxySandbox原理：
1. 创建一个假的window对象
2. 使用Proxy拦截所有属性访问
3. 读写操作都在假window上进行
4. 卸载时直接丢弃假window

优点：
- 完全隔离
- 性能较好
- 支持多实例

缺点：
- 一些全局API可能无法完全隔离
- 需要处理一些边界情况
*/

// 快照沙箱（单例模式）
class SnapshotSandbox {
  private windowSnapshot: Record<string, any> = {};
  private modifyPropsMap: Record<string, any> = {};
  
  active() {
    // 保存当前window状态
    this.windowSnapshot = {};
    for (const key in window) {
      this.windowSnapshot[key] = (window as any)[key];
    }
    
    // 恢复之前的修改
    Object.keys(this.modifyPropsMap).forEach(key => {
      (window as any)[key] = this.modifyPropsMap[key];
    });
  }
  
  inactive() {
    // 记录修改
    this.modifyPropsMap = {};
    for (const key in window) {
      if ((window as any)[key] !== this.windowSnapshot[key]) {
        this.modifyPropsMap[key] = (window as any)[key];
        (window as any)[key] = this.windowSnapshot[key];
      }
    }
  }
}
```

### 10.3 资源加载优先级与关键渲染路径

优化资源加载优先级可以显著提升首屏加载性能。

#### 10.3.1 关键CSS内联与异步加载

关键CSS内联可以减少首次渲染的阻塞时间。

**Critical CSS提取与剩余CSS的非阻塞加载策略**

```typescript
// Critical CSS提取工具配置
// critical.config.js
const critical = require('critical');

critical.generate({
  base: 'dist/',
  src: 'index.html',
  target: {
    css: 'critical.css',
    html: 'index.critical.html',
  },
  width: 1300,
  height: 900,
});

// HTML中的Critical CSS内联
/*
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 内联的关键CSS */
    body { margin: 0; font-family: sans-serif; }
    header { background: #333; color: white; }
    /* ... */
  </style>
  
  <!-- 异步加载剩余CSS -->
  <link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/styles/main.css"></noscript>
</head>
<body>...</body>
</html>
*/

// React中的Critical CSS
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';

function renderWithStyles(Component: React.ComponentType) {
  const sheet = new ServerStyleSheet();
  
  try {
    const html = renderToString(sheet.collectStyles(<Component />));
    const styleTags = sheet.getStyleTags();
    
    return { html, styleTags };
  } finally {
    sheet.seal();
  }
}
```

#### 10.3.2 图片懒加载与LCP优化

图片通常是页面中最大的资源，优化图片加载对LCP指标至关重要。

**Intersection Observer API的阈值计算与模糊占位技术**

```typescript
// 图片懒加载Hook
function useLazyImage(
  src: string,
  options?: IntersectionObserverInit
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',  // 提前50px开始加载
        threshold: 0,
        ...options,
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [options]);
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  return {
    ref: imgRef,
    src: isInView ? src : undefined,
    isLoaded,
    isInView,
    onLoad: handleLoad,
  };
}

// 渐进式图片加载组件
function ProgressiveImage({
  src,
  placeholder,
  alt,
}: {
  src: string;
  placeholder: string;  // 低分辨率占位图
  alt: string;
}) {
  const { ref, src: lazySrc, isLoaded } = useLazyImage(src);
  
  return (
    <div ref={ref} className="image-container">
      {/* 占位图 */}
      <img
        src={placeholder}
        alt=""
        className="placeholder"
        style={{ filter: isLoaded ? 'blur(0)' : 'blur(10px)' }}
      />
      
      {/* 实际图片 */}
      {lazySrc && (
        <img
          src={lazySrc}
          alt={alt}
          className="actual-image"
          style={{ opacity: isLoaded ? 1 : 0 }}
          onLoad={() => {}}
        />
      )}
    </div>
  );
}

// WebP/AVIF格式适配
function ResponsiveImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const baseName = src.replace(/\.[^/.]+$/, '');
  
  return (
    <picture>
      {/* AVIF - 最佳压缩 */}
      <source
        srcSet={`${baseName}.avif`}
        type="image/avif"
      />
      {/* WebP - 良好支持 */}
      <source
        srcSet={`${baseName}.webp`}
        type="image/webp"
      />
      {/* JPEG fallback */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
      />
    </picture>
  );
}
```

#### 10.3.3 字体加载的FOIT/FOUT策略

字体加载策略影响文本的可见性和页面体验。

**Font Display API与React组件的字体闪屏消除**

```typescript
// 字体加载Hook
function useFontLoader(fontFamily: string, fontUrl: string) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  useEffect(() => {
    const font = new FontFace(fontFamily, `url(${fontUrl})`);
    
    font.load()
      .then(() => {
        document.fonts.add(font);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [fontFamily, fontUrl]);
  
  return status;
}

// useFont Hook封装
function useFont(fontConfig: { family: string; url: string }[]) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const promises = fontConfig.map(({ family, url }) => {
      const font = new FontFace(family, `url(${url})`);
      return font.load().then(() => {
        document.fonts.add(font);
      });
    });
    
    Promise.all(promises)
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true));  // 即使失败也继续
  }, [fontConfig]);
  
  return loaded;
}

// 字体加载策略组件
function FontProvider({
  children,
  fonts,
}: {
  children: React.ReactNode;
  fonts: { family: string; url: string }[];
}) {
  const fontsLoaded = useFont(fonts);
  
  return (
    <div
      style={{
        fontFamily: fontsLoaded
          ? fonts.map(f => f.family).join(', ')
          : 'system-ui, sans-serif',
        opacity: fontsLoaded ? 1 : 0.9,
        transition: 'opacity 0.3s',
      }}
    >
      {children}
    </div>
  );
}

// CSS font-display策略
/*
font-display取值：
- auto: 浏览器默认行为
- block: 短暂不可见(FOIT)，然后显示
- swap: 立即显示后备字体(FOUT)，加载后替换
- fallback: 短暂block，然后swap
- optional: 类似fallback，但可能不加载字体

推荐策略：
- 关键字体：fallback
- 非关键字体：optional
- 图标字体：block
*/

// @font-face配置
/*
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: fallback;  // 推荐策略
}
*/
```

---

本章探讨了构建时优化和加载策略，从Tree Shaking到代码分割，从资源优先级到关键渲染路径优化。这些工程化手段是保障应用性能的基础。

在下一部分中，我们将探讨状态管理架构和数据流工程化，建立可扩展的应用状态管理方案。
