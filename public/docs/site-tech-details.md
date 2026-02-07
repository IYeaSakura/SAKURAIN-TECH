# SAKURAIN TEAM 网站技术详解

## 一、技术栈全景

### 1.1 核心技术矩阵

| 层级 | 技术选型 | 版本 | 选型理由 |
|-----|---------|------|---------|
| **框架层** | React | 19.x | 并发渲染、Server Components支持 |
| **语言层** | TypeScript | 5.6+ | 类型安全、IDE体验 |
| **构建层** | Vite | 7.x | 原生ESM、极速HMR |
| **样式层** | Tailwind CSS + CSS Variables | 3.4+ | 原子化CSS、动态主题 |
| **动画层** | Framer Motion + GSAP | 11.x / 3.x | 声明式动画 + 精确时序控制 |
| **3D渲染** | Three.js + React Three Fiber | 0.170+ | WebGL抽象、React集成 |
| **地理可视化** | CesiumJS | 1.114+ | 工业级地球渲染 |
| **UI组件** | Radix UI + Shadcn UI | 最新 | 无障碍基础 + 样式灵活 |
| **路由** | React Router | v7 | 数据API、嵌套路由 |
| **终端** | XTerm.js + Wasmer SDK | 5.3+ | 终端模拟 + WASM运行时 |
| **Markdown** | React Markdown + Remark GFM | 最新 | 可扩展渲染管线 |
| **图表** | Recharts | 2.x | React原生、响应式 |
| **粒子效果** | tsParticles | 最新 | 高性能粒子系统 |
| **表单** | React Hook Form + Zod | 最新 | 性能优先 + 类型安全验证 |
| **主题** | next-themes | 最新 | 系统偏好同步 |
| **滚动** | Lenis | 最新 | 平滑滚动、ScrollTrigger集成 |

---

## 二、核心功能模块详解

### 2.1 3D地球可视化系统 (CesiumGlobe)

#### 架构设计

```
┌─────────────────────────────────────────┐
│           渲染管线架构                   │
├─────────────────────────────────────────┤
│  影像层 → 矢量层 → 特效层 → UI叠加层      │
│  (瓦片)   (标记)   (后处理)  (HTML)      │
└─────────────────────────────────────────┘
```

#### 关键技术实现

**瓦片流式加载**
- 接入高德地图Web服务（`webst{s}.is.autonavi.com`）
- 基于视锥体的LOD选择：根据相机高度动态计算所需层级
- LRU缓存管理：限制内存中瓦片数量，离屏异步卸载

**动态光照系统**
```typescript
// 物理参数配置
scene.globe.enableLighting = true;
scene.globe.lightingFadeOutDistance = 100000000;  // 光照淡出距离
scene.globe.lightingFadeInDistance = 100000;      // 光照淡入距离
scene.globe.dynamicAtmosphereLighting = true;      // 动态大气光照
scene.globe.atmosphereLightIntensity = 2.0;        // 增强对比
```

**贸易航线渲染（贝塞尔曲线）**
```typescript
// 二次贝塞尔插值生成大圆航线
const midPoint = Cesium.Cartesian3.add(start, end, new Cesium.Cartesian3());
Cesium.Cartesian3.multiplyByScalar(mid, 0.5, mid);
const distance = Cesium.Cartesian3.distance(start, end);
const height = Math.min(distance * 0.3, 2000000);  // 最大弧高2000km

// 曲线采样
for (let t = 0; t <= 1; t += 0.05) {
  const oneMinusT = 1 - t;
  const point = new Cesium.Cartesian3(
    oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * mid.x + t * t * end.x,
    // ... y, z同理
  );
}
```

**性能优化策略**
| 技术 | 实现 | 效果 |
|-----|------|------|
| `requestRenderMode` | 仅在相机移动时渲染 | 静态时GPU占用趋近于0 |
| `resolutionScale` | 动态调整渲染分辨率 | 高DPI设备性能适配 |
| `SceneMode.PERFORMANCE` | 禁用非必要特效 | 提升复杂场景帧率 |
| 实体聚合 | 距离过近标记合并 | 减少Draw Call |

---

### 2.2 3D中国地图系统 (ChinaMap3D)

#### 技术架构

**数据流**
```
阿里云DataV GeoJSON → 自定义投影 → Three.js几何体 → WebGL渲染
```

**投影算法（优化墨卡托）**
```typescript
const PROJECTION_CONFIG = {
  centerLon: 105,  // 以陕西为中心，优化中国区域变形
  centerLat: 36,
  scale: 1.1,      // 补偿东西向拉伸
};

function project(lon: number, lat: number): [number, number] {
  const x = (lon - centerLon) * scale;
  const y = (lat - centerLat) * scale;
  return [x, -y];  // Y轴取反确保北向在上
}
```

**多边形处理管线**

| 步骤 | 算法 | 输出 |
|-----|------|------|
| 坐标转换 | 投影算法 | 平面坐标数组 |
| 三角化 | 耳切法(Ear Clipping) | 索引化三角形 |
| 孔洞处理 | 桥接边合并 | 单一外轮廓 |
| 质心计算 | 面积加权Shoelace公式 | 标记点位置 |
| 几何生成 | Three.js BufferGeometry | GPU可渲染数据 |

**激光柱视觉效果**
```typescript
// 四层叠加实现发光效果
<group position={[x, MAP_HEIGHT, z]}>
  <mesh> {/* 核心层：高不透明实体 */} </mesh>
  <mesh> {/* 光晕层：低不透明体积光 */} </mesh>
  <mesh> {/* 顶部光束：锥体渐变 */} </mesh>
  <mesh> {/* 底部环：双环脉冲动画 */} </mesh>
</group>
```

**交互系统**
- **OrbitControls**: 旋转、缩放、平移（限制极角防止翻转）
- **Raycaster**: 鼠标悬停检测，支持复杂多边形
- **相机动画**: 下钻时平滑过渡，使用缓动函数

---

### 2.3 弹幕卫星系统 (DanmakuSatellite)

#### 物理模型

**轨道力学（简化开普勒模型）**

| 参数 | 物理意义 | 数值范围 |
|-----|---------|---------|
| 半长轴 *a* | 轨道能量 | 6578-42164 km（地心距）|
| 偏心率 *e* | 轨道形状 | 0（圆形简化）|
| 倾角 *i* | 轨道倾斜 | -90° ~ +90° |
| 升交点赤经 Ω | 轨道平面方向 | 0° ~ 360° |
| 角速度 ω | 运动快慢 | 由高度决定 |

**角速度计算（开普勒第三定律）**
```typescript
const calculateAngularVelocity = (altitude: number): number => {
  const radius = EARTH_RADIUS + altitude;
  const referenceRadius = EARTH_RADIUS + 400000;  // 400km参考轨道
  const referenceOmega = 0.0012;  // rad/s

  // ω ∝ r^(-3/2)
  const omega = referenceOmega * Math.pow(referenceRadius / radius, 1.5);
  return omega * 50;  // 视觉加速因子
};
```

**3D位置计算**
```typescript
// 考虑倾角和RAAN的完整变换
const calculatePosition = (d: Danmaku, elapsed: number) => {
  const radius = EARTH_RADIUS + d.altitude;
  const angle = d.angle + d.speed * elapsed;

  // 轨道平面坐标
  const xOrb = Math.cos(angle) * radius;
  const yOrb = Math.sin(angle) * radius;

  // 倾角旋转（绕X轴）
  const yIncl = yOrb * Math.cos(d.inclination);
  const zIncl = yOrb * Math.sin(d.inclination);

  // RAAN旋转（绕Z轴）
  const cosR = Math.cos(d.raan), sinR = Math.sin(d.raan);
  return new Cesium.Cartesian3(
    xOrb * cosR - yIncl * sinR,
    xOrb * sinR + yIncl * cosR,
    zIncl
  );
};
```

#### 渲染优化

| 技术 | 实现 | 效果 |
|-----|------|------|
| CallbackProperty | Cesium属性回调 | 实时更新位置无需重建实体 |
| 对象池 | 复用Entity实例 | 减少GC压力 |
| 视距缩放 | `scaleByDistance` | 远距离自动缩小避免遮挡 |
| 深度测试禁用 | `disableDepthTestDistance` | 确保文字始终可见 |

---

### 2.4 Web终端系统 (WebTerminal)

#### 架构分层

```
┌─────────────────────────────────────────┐
│  UI层：XTerm.js 终端模拟器               │
│  - VT100协议支持、256色、鼠标事件         │
├─────────────────────────────────────────┤
│  运行时层：Wasmer SDK                   │
│  - WASM模块加载、WASI系统接口            │
├─────────────────────────────────────────┤
│  语言运行时：预编译WASM模块              │
│  - Python、Node.js、Ruby、Bash等         │
└─────────────────────────────────────────┘
```

#### 安全沙箱模型

| 能力 | 默认状态 | 控制方式 |
|-----|---------|---------|
| 文件系统 | 只读虚拟FS | WASI预打开目录 |
| 网络访问 | 禁用 | 显式能力授权 |
| 环境变量 | 受限集合 | 白名单过滤 |
| 内存使用 | 128MB上限 | 线性内存页限制 |
| CPU时间 | 协作式调度 | 检查点超时 |

#### 终端配置

```typescript
const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
  theme: {
    background: 'rgba(30, 30, 30, 0.95)',
    foreground: '#d4d4d4',
    cursor: 'var(--accent-primary)',
    selectionBackground: 'rgba(38, 139, 210, 0.3)',
    // 16色ANSI配色...
  },
  allowTransparency: true,
  scrollback: 1000,
});
```

---

### 2.5 动画系统

#### Framer Motion（组件级动画）

**核心特性**
- 声明式API：`initial` → `animate` → `exit`
- 布局动画：自动处理位置/大小变化
- 手势支持：拖拽、悬停、点击

```typescript
// 典型用法：淡入上移动画
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1]  // 自定义贝塞尔曲线
  }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

#### GSAP + ScrollTrigger（复杂时间轴）

**ScrollTrigger配置**
```typescript
gsap.to(element, {
  scrollTrigger: {
    trigger: element,
    start: 'top 80%',      // 元素顶部到达视口80%位置
    end: 'bottom 20%',     // 元素底部到达视口20%位置
    scrub: 1,              // 平滑跟随滚动
    markers: false,        // 调试标记
    toggleActions: 'play none none reverse',
  },
  y: -100,
  opacity: 1,
  duration: 1,
});
```

#### 性能优化

| 策略 | 实现 | 场景 |
|-----|------|------|
| `useReducedMotion` | 检测系统偏好 | 无障碍支持 |
| `will-change` | GPU层提升 | 复杂动画元素 |
| `transform`优先 | 避免布局抖动 | 位移动画 |
| `requestAnimationFrame` | 与渲染同步 | 自定义动画 |

---

### 2.6 主题系统

#### 架构设计

```
next-themes (状态管理)
    ↓
CSS Variables (动态值)
    ↓
Tailwind CSS (工具类)
```

#### 主题变量定义

```css
:root {
  /* 基础色 */
  --bg-primary: #0a0a0f;
  --bg-secondary: #151520;
  --bg-tertiary: #1a1a2e;

  /* 强调色 */
  --accent-primary: #0E639C;
  --accent-secondary: #6A9955;
  --accent-tertiary: #9B59B6;
  --accent-glow: rgba(14, 99, 156, 0.3);

  /* 文字色 */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;

  /* Minecraft特色 */
  --mc-gold: #FFD700;
  --mc-green: #55FF55;
  --mc-red: #FF5555;
}

[data-theme="light"] {
  --bg-primary: #f5f5f0;
  --text-primary: #1a1a2e;
  --accent-primary: #2563eb;
}
```

#### 切换动画

- **View Transitions API**：原生页面过渡（Chrome 126+）
- **CSS过渡**：`transition: background-color 0.3s ease`
- **持久化**：`localStorage`保存用户偏好

---

## 三、性能工程

### 3.1 加载优化

| 技术 | 实现 | 效果 |
|-----|------|------|
| 路由懒加载 | `React.lazy + Suspense` | 首包减小60%+ |
| 组件懒加载 | 动态`import()` | 非首屏按需获取 |
| 资源预加载 | `<link rel="preload">` | 关键资源优先 |
| 预取 | `<link rel="prefetch">` | 预测性加载 |
| 图片优化 | WebP格式、响应式srcset | 体积减小70% |

### 3.2 运行时优化

**React优化**
```typescript
// 1. 组件记忆化
const MemoComponent = memo(Component, (prev, next) =>
  prev.id === next.id
);

// 2. 计算缓存
const processed = useMemo(() =>
  expensiveCompute(data),
  [data]
);

// 3. 回调稳定
const handler = useCallback(() => {
  doSomething(dep);
}, [dep]);
```

**3D渲染优化**
- 对象池：复用几何体/材质实例
- 视锥剔除：仅渲染可见对象
- LOD系统：距离-based细节降级
- 纹理图集：减少状态切换

### 3.3 关键性能指标

| 指标 | 目标 | 当前 |
|-----|------|------|
| LCP | < 2.5s | ~1.8s |
| FID | < 100ms | ~50ms |
| CLS | < 0.1 | ~0.05 |
| TTFB | < 600ms | ~200ms |
| FCP | < 1.8s | ~1.2s |

---

## 四、工程架构

### 4.1 项目结构

```
src/
├── components/
│   ├── atoms/           # 原子组件（Button, Card, Badge）
│   │   └── 设计令牌驱动，无业务逻辑
│   ├── effects/         # 特效组件（3D, 动画, 粒子）
│   │   ├── CesiumGlobe.tsx
│   │   ├── ChinaMap3D.tsx
│   │   ├── DanmakuSatellite.tsx
│   │   ├── WebTerminal.tsx
│   │   └── ...（粒子、光效、文字动画）
│   ├── sections/        # 页面区块（Hero, Services, Contact）
│   │   └── 业务逻辑聚合，组合atoms/effects
│   └── ui/              # shadcn/ui 基础组件
│       └── Radix UI封装 + 主题适配
├── hooks/               # 自定义Hooks
│   ├── useTheme.ts      # 主题状态
│   ├── useLenis.ts      # 平滑滚动
│   ├── usePerformance.ts # 性能监控
│   └── ...
├── lib/                 # 工具库
│   ├── utils.ts         # 通用函数
│   ├── animations.ts    # 动画配置
│   └── performance.ts   # 性能工具
├── pages/               # 路由页面
│   ├── Docs/            # 文档系统（Markdown渲染）
│   ├── Friends/         # 友链页面
│   └── NotFound/        # 404页面
├── styles/              # 全局样式
│   ├── globals.css      # Tailwind + CSS变量
│   └── minecraft-theme.css # 主题特定样式
└── types/               # TypeScript类型定义
    └── index.ts         # 全局类型
```

### 4.2 文档系统架构

**渲染管线**
```
Markdown原文
    ↓
react-markdown (解析)
    ↓
remark-gfm (GitHub扩展)
    ↓
rehype-highlight (代码高亮)
    ↓
自定义组件映射 (h1→Title, code→CodeBlock)
    ↓
React组件树
```

**PlantUML支持**
- 客户端编码：`plantuml-encoder`
- 实时渲染：PlantUML Web服务
- 支持图表：时序图、类图、流程图、组件图

**目录生成**
- 解析AST提取标题层级
- 生成锚点ID（slug化）
- 滚动监听高亮当前章节

---

## 五、部署与运维

### 5.1 构建流程

```
TypeScript源码
    ↓
Vite构建
    ├── ESBuild (快速转译)
    ├── Rollup (打包优化)
    │   ├── 代码分割
    │   ├── Tree Shaking
    │   └── 压缩(Minify)
    └── 静态资源处理
        ├── 图片优化
        ├── 字体子集化
        └── 哈希文件名
    ↓
dist/ (静态文件)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   ├── vendor-[hash].js
    │   └── ...
    └── 404.html (SPA路由适配)
    ↓
CDN分发 (全球边缘节点)
```

### 5.2 SPA路由适配

**问题**：静态托管刷新404

**解决方案**
```html
<!-- 404.html -->
<script>
  // 保存原始路径
  sessionStorage.setItem('redirect', location.pathname);
  // 重定向到首页
  location.href = '/';
</script>
```

```typescript
// App.tsx 挂载时
useEffect(() => {
  const redirect = sessionStorage.getItem('redirect');
  if (redirect) {
    sessionStorage.removeItem('redirect');
    navigate(redirect);
  }
}, []);
```

---

## 六、浏览器兼容性

| 特性 | Chrome | Firefox | Safari | Edge | 降级策略 |
|-----|--------|---------|--------|------|---------|
| WebGL 2.0 | 56+ | 51+ | 15+ | 79+ | 2D Canvas |
| WebAssembly | 57+ | 52+ | 14+ | 16+ | 纯JS实现 |
| View Transitions | 126+ | ⚠️ | ⚠️ | 126+ | CSS过渡 |
| CSS Variables | 49+ | 31+ | 9.1+ | 15+ | 硬编码值 |
| Container Queries | 105+ | 110+ | 16+ | 105+ | Media Queries |

---

## 七、技术演进路线

### 近期（3个月内）
- [ ] WebGPU迁移：替代WebGL，释放计算着色器能力
- [ ] 边缘AI：TensorFlow.js轻量模型推理
- [ ] 实时协作：OT算法实现多人同步编辑

### 中期（6-12个月）
- [ ] WebXR支持：VR/AR沉浸式体验
- [ ] 微前端架构：模块独立部署
- [ ] 边缘渲染：云端渲染 + 视频流推送

### 远期（1年+）
- [ ] 数字孪生：完整业务系统3D映射
- [ ] 生成式AI：智能内容生成助手
- [ ] 自治系统：AI驱动的性能自优化

---

## 八、总结

SAKURAIN TEAM 的技术架构体现了现代Web应用的前沿实践：

| 维度 | 核心策略 | 技术体现 |
|-----|---------|---------|
| **性能** | 预算驱动 | 代码分割、懒加载、GPU优化 |
| **体验** | 渐进增强 | 3D可视化、平滑动画、主题切换 |
| **工程** | 类型安全 | TypeScript、Zod验证、自动化测试 |
| **创新** | 技术融合 | GIS + 游戏引擎 + WebAssembly |
| **可持续** | 边缘原生 | Serverless、CDN分发、低运维成本 |

所有技术选择均服务于**技术演示与学习**的核心目标。

---

*文档版本: 2.0*
*更新日期: 2026-02-07*