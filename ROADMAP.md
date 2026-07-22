# SAKURAIN-TECH 升级改造路线图（ROADMAP）

> 版本：v1.0 · 2026-07-22
> 本文档是 Next.js 重构与个人品牌大规模升级的合并设计基准，后续所有开发以本文档为准。
> 目标定位：**技术创作者的个人品牌门户** —— 有用（Tools）、有料（Blog/Docs）、有趣（EarthOnline/展厅）。

---

## 第一部分：现状关键事实（迁移输入）

### 路由表（React Router → App Router 1:1 映射）

| 现有路径 | 组件 | Next.js 目标 | 渲染策略 |
|---|---|---|---|
| `/` | `src/App.tsx`（首页 1629 行） | `app/page.tsx` | SSG + 客户端特效 islands |
| `/blog` | `src/pages/Blog/index.tsx` | `app/blog/page.tsx` | SSG |
| `/blog/:slug` | `src/pages/Blog/[slug].tsx` | `app/blog/[slug]/page.tsx` | SSG + generateStaticParams |
| `/notes` | `src/pages/Notes/index.tsx` | `app/notes/page.tsx` | SSG（后续加详情页） |
| `/docs` 四级参数 | `src/pages/Docs/index.tsx` | `app/docs/[[...slug]]/page.tsx` | SSG catch-all |
| `/friends` | `src/pages/Friends/index.tsx` | `app/friends/page.tsx` | SSG |
| `/friends-circle` | `src/pages/Feed/index.tsx` | `app/friends-circle/page.tsx` | CSR 为主 |
| `/about` `/studio` `/resume` | 对应 pages | 同名 app 路由 | SSG |
| `/earth-online` | `src/pages/EarthOnline/` | 同名 | 整页 dynamic ssr:false |
| `/algo-viz` | `src/pages/AlgoViz/`（90+ 算法文件） | 同名（**保留**，与 AlgoStage 并存） | 整页 dynamic ssr:false |
| `/tools`、`/tools/:toolId` | `src/pages/Tools/` + registry | `app/tools/`、`app/tools/[toolId]/` | SSG 独立页面（SEO 长尾） |
| `*` | NotFound | `app/not-found.tsx` | 内建 |

### 已知问题清单（迁移中顺手处理）

- **密钥泄露**：`VITE_API_SECRET_KEY` 打进前端 bundle（`src/lib/api-auth.ts:1`）→ Phase 3b 改服务端持钥
- **硬编码域名**：`src/pages/Feed/index.tsx:1214-1344`、`src/components/effects/DanmakuSatellite.tsx:8` 硬编码 `https://sakurain.net` → 改相对路径
- **硬编码 Cesium Ion token**：`src/components/effects/CesiumGlobe.tsx:154-155`，且 `CESIUM_BASE_URL='/'` → token 移环境变量，base URL 改 `/cesium/`
- **防缓存 hack**：全站 fetch 带 `?v=${Date.now()}` + `cache:'no-store'`（如 `src/hooks/useConfig.ts:19`）→ 迁移后全部删除
- **死依赖**：`recharts`、`next-themes`（src 零引用）
- **死路由**：`src/pages/DevLog/` 存在但无 Route 指向（`main.tsx` 的 showNavPaths 里有 `/dev-log`）
- **双实现**：`edge-functions/comments.js`（旧版 336 行）与 `edge-functions/api/comments/index.js` 并存，线上生效版本待确认
- **手写 frontmatter 解析器**：`src/pages/Blog/utils.ts:37-75` 脆弱 → gray-matter 替代
- **手写解析器可能掩盖脏数据**：全量 md 需 lint
- SPA hack（`public/404.html` + `spa-redirect` + `_middleware.js`）→ Next 下整体删除

### EdgeOne 平台事实（官方文档已确认）

- Next.js 支持版本 13.5+/14/15/16；**目标 Next.js 15**（App Router）
- App Router / SSR / SSG / ISR / RSC / 流式 / Middleware / Route Handlers / 图片优化 ✅
- **不支持 next.config 的 redirects/rewrites** → 用 `edgeone.json` 配置（`/feed`、`/feed/atom` 旧别名在此保留）
- Next 项目内可保留 `edge-functions/` 目录共存（API 层过渡形态零风险）
- KV：控制台绑定命名空间+变量名，代码内以变量名直接访问；最终一致性（边缘缓存 ≤60s）
- 构建机 Node 版本需在项目设置固定 **20.18.0**
- 5 个 KV 命名空间：`KV_SECRET`、`RATE_LIMIT_KV`、`DANMAKU_KV`、`COMMENTS_KV`、`FEED_KV`

---

## 第二部分：Next.js 迁移方案

### 目标架构

```
next-app/
├── app/
│   ├── layout.tsx              # <html>/<body>、Metadata、beforeInteractive 脚本、Providers、ClientEffects
│   ├── page.tsx                # 首页（server shell + 客户端 islands）
│   ├── not-found.tsx
│   ├── sitemap.ts / robots.ts
│   ├── feed.xml/route.ts、atom.xml/route.ts、feed.json/route.ts
│   ├── blog/page.tsx、blog/[slug]/page.tsx
│   ├── notes/page.tsx
│   ├── docs/[[...slug]]/page.tsx
│   ├── about|friends|friends-circle|studio|resume|earth-online|algo-viz/page.tsx
│   ├── tools/page.tsx、tools/[toolId]/page.tsx
│   ├── lab/                    # 炫技展厅（Wave 2+）
│   └── api/                    # Phase 3b：danmaku/comments/feed Route Handlers（edge runtime）
├── content/                    # blog/posts、notes/posts、docs（从 public 迁入，Phase 2）
├── src/
│   ├── lib/content/            # gray-matter 统一管线：blog.ts / notes.ts / docs.ts
│   ├── lib/api/                # auth(HMAC)、rate-limit、kv 封装
│   ├── components/             # 原 src/components 迁入，逐步标 'use client'
│   ├── contexts/ hooks/        # 迁入并修 SSR guard
│   └── config/
├── public/                     # image、music、Assets(Cesium)、map-data
└── edge-functions/             # API 过渡形态：原样保留（Phase 3a）
```

### 内容管线选型（已定）

**自研 gray-matter + remark/rehype 管线**（不采用 next-mdx / contentlayer2）。
理由：现有渲染栈（react-markdown + remark-gfm + remark-math + rehype-katex）平移零风险；md 中有 MDX 不兼容 HTML 的风险；项目体量不需要 contentlayer 的抽象。

### 构建脚本处置

| 脚本 | 处置 |
|---|---|
| generate-blog-archive / generate-blog-tags / generate-notes-archive | **替代**：构建期 gray-matter 聚合（`src/lib/content/`） |
| generate-feeds | **替代**：`app/feed.xml/route.ts` 等（`force-static`） |
| generate-sitemap | **替代**：`app/sitemap.ts` |
| submit-sitemap | **保留**为独立 npm script / CI 步骤（扩展 IndexNow + 百度主动推送） |
| check-friends-connectivity | **保留**为独立脚本，不挂 build |
| generate-deployment-config | **删除** |
| generate-security-config | 改为静态 ts 常量 |

### 迁移 Phase

- **Phase 0 准备**：清死依赖（recharts、next-themes）；确认 comments 双实现；记录 DevLog 死路由（暂不删）
- **Phase 1 骨架平移**：`next-app/` 路由 1:1；页面整页 'use client' 务实起步；数据仍 fetch 现有 `public/*.json`（脚本全保留）；`next/navigation` 批量替换 react-router；Cesium 静态资产 CopyPlugin 方案 + `CESIUM_BASE_URL=/cesium/`；**API 不动**（edge-functions 原样）
- **Phase 2 内容内聚**：`content/` 迁移 + gray-matter 管线；blog/notes/docs 改 SSG + generateStaticParams；sitemap.ts、feed routes 上线；删 5 个生成脚本；删全站 `?v=Date.now()`
- **Phase 3a API 共存上线**：保留 edge-functions，Next 站点先上线（吃 SSG/SEO 收益）
- **Phase 3b API 迁移（可选优化）**：Route Handlers + 服务端持钥修密钥泄露；前端调用点改相对路径
- **Phase 4 SEO 收尾**：Metadata API；删 404.html/spa-redirect/_middleware.js；edgeone.json 配置旧 feed 别名；Lighthouse 对比

### 'use client' 边界原则

1. 页面入口保持 Server Component，数据服务端注入 props
2. 第一批整页 'use client'，后续逐页下沉边界
3. 布局级特效（光标/星星/Lenis/MusicPlayer/ContextMenu/DebugProtection）收进 `app/components/ClientEffects.tsx`，在 layout 挂载
4. Cesium/R3F 一律 `dynamic(() => import(...), { ssr: false })`
5. Navigation 按路径白名单显隐 → 'use client' 小组件 + `usePathname()`

---

## 第三部分：品牌升级方案

### 定位三支柱

- **有用**：Tools / AlgoViz → 搜索长尾流量
- **有料**：Blog / Docs → 内容权威 + 订阅关系
- **有趣**：EarthOnline / Lab 展厅 → 记忆点与传播

### 新页面

- `/now`：我现在在做什么/读什么/学什么
- `/uses`：装备、软件、工作流清单
- About 重做：时间线叙事 + GitHub 热力图（已有组件）+ 技能雷达 + 实时状态（由最新 note 驱动）
- `/stats`：公开访问统计（自建 analytics）

### 内容升级

- 每篇文章 OG 图动态生成（Route Handler + ImageResponse），统一品牌视觉
- Newsletter 邮件订阅（边缘函数 + KV 存邮箱，或 Resend/Buttondown）
- notes 加详情页/permalink；mood 聚合"心情曲线"年度回顾页
- docs 课程加进度标记（localStorage）
- sitemap 分层提交；IndexNow + 百度主动推送

### 炫技展厅 /lab（核心投入）

> 标杆：EarthOnline = 实时数据 + 3D 渲染 + 边缘计算。以下按优先级排序。

| # | 模块 | 概念 | 技术栈 | 优先级 |
|---|---|---|---|---|
| 1 | **EdgePulse 全球边缘网络可视化** | 访客请求链路实时上地球；全站访客分布；边缘函数执行热图——"网站展示自己的神经系统" | Cesium 复用 + 边缘函数节点信息 + SSE | ⭐ 最高（与 EarthOnline 共享 90% 基建） |
| 2 | **PixelWar 像素战争** | 全站访客实时协作像素画布（缩小版 r/place），冷却限流，历史延时回放 | edge-functions + KV + SSE + Canvas/WebGL | 高（弹幕的进化形态） |
| 3 | **终端模式** | `` ` `` 键切换全站 CLI 皮肤，命令行遍历站点，藏彩蛋 | xterm.js 或自研，命令映射路由 | 高（成本最低，极客人设） |
| 4 | **NeuralPlayground** | 浏览器内 3D 神经网络训练可视化（调参、看梯度流动） | Three.js/R3F + TF.js/WebGPU | 中高（与 ML 博文互相印证） |
| 5 | **WebGPU 渲染实验室** | 百万粒子、ray marching SDF、流体模拟 | WebGPU，优雅降级 WebGL2 | 中（图形学肌肉秀） |
| 6 | **手势控制地球** | MediaPipe 手势操控 EarthOnline 相机 | MediaPipe Hands + Cesium | 中（演示效果炸裂） |

**叙事闭环**：Blog 写原理 ↔ 展厅做实现（ML 推导文 ↔ NeuralPlayground；图形学文 ↔ WebGPU 实验室；EdgeOne 架构文 ↔ EdgePulse）——文章证明懂理论，展厅证明能实现。

### 增长飞轮

```
Tools/AlgoViz（搜索入口）→ Blog/Docs（权威）→ Newsletter/RSS（沉淀）→ Lab/访客地球（传播）→ 新搜索流量
```

---

## 第四部分：Wave 路线图

| Wave | 内容 | 标志性交付 |
|---|---|---|
| **1** | Next.js 迁移（Phase 0-2）+ SEO 基建 + Tools 独立 URL + OG 图生成 | 地基 + 搜索流量入口 |
| **2** | Phase 3a 上线 + EdgePulse + EarthOnline 弹幕升级 + `/now` `/uses` + notes 详情页 | 王牌增强 |
| **3** | PixelWar + 终端模式 + Newsletter + 自建 analytics + `/stats` | 社交粘性 + 订阅关系 |
| **4** | NeuralPlayground + WebGPU 实验室 + 课程进度 | 深度炫技 |
| **5** | 手势控制、AI 站内问答（RAG）、多语言、Phase 3b | 锦上添花 + 安全收尾 |

---

## 第五部分：风险登记

1. ~~EdgeOne Next.js 支持度~~ → 已确认全绿；残余：上线前实测 Route Handlers + KV（不阻塞，edge-functions 共存兜底）
2. Cesium 374MB 静态资产平移（dev 体验 / CDN 决策）
3. Markdown 脏数据被 gray-matter 暴露（Phase 2 前全量 lint）
4. comments 双实现线上确认
5. 主题/移动端 SSR 首帧闪烁（beforeInteractive 脚本时序实测）
6. EdgeOne 不支持 next.config redirects/rewrites（一律走 edgeone.json）
7. 开放问题：DevLog 页补路由还是删除？Notes 详情页设计？多环境域名治理？
