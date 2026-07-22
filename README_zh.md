# SAKURAIN-TECH

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.18-339933?logo=node.js)](https://nodejs.org/)
[![EdgeOne](https://img.shields.io/badge/EdgeOne%20Pages-Deploy-0052D9?logo=tencent-qq)](https://pages.edgeone.ai/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

基于 Next.js 15 App Router 构建的个人品牌门户，部署于腾讯云 EdgeOne Pages。站点整合了技术博客、文档课程、交互式算法可视化、3D 地球实时动态、友情链接、作品集展厅等功能，采用 SSG 优先的架构，并通过边缘计算实现可交互 API。

[功能特性](#功能特性) | [技术栈](#技术栈) | [项目结构](#项目结构) | [快速开始](#快速开始) | [开发指南](#开发指南) | [构建与部署](#构建与部署) | [API 参考](#api-参考) | [性能优化](#性能优化) | [内容管理](#内容管理) | [安全](#安全) | [故障排查](#故障排查) | [贡献指南](#贡献指南) | [许可证](#许可证) | [联系方式](#联系方式)

**线上站点**: [https://sakurain.net](https://sakurain.net)

---

## 功能特性

### 内容与发布

- **博客**: 基于 Markdown 与 frontmatter 的文章，支持 KaTeX 数学公式、语法高亮、GFM 表格与 OG 图片。
- **随笔**: 带时间戳与心情标签的短内容，自动生成按月归档索引。
- **文档**: 多级文档课程与规范，通过 catch-all SSG 路由统一渲染。
- **订阅源**: 内建 RSS 2.0、Atom、JSON Feed，分别位于 `/feed.xml`、`/atom.xml`、`/feed.json`。
- **站点地图**: 通过 Next.js Metadata Route API 自动生成 `sitemap.xml` 与 `robots.txt`。

### 交互体验

- **EarthOnline**: 基于 Cesium 的 3D 地球，展示实时卫星轨道与可交互的卫星弹幕层。
- **AlgoViz**: 浏览器端算法可视化，包括图遍历、排序、网格寻路等。
- **朋友圈**: 社交订阅聚合页，支持批量刷新与卡片缓存渲染。
- **音乐播放器**: 持久化的背景音乐播放器，支持播放列表与播放状态管理。

### 架构与开发体验

- **Next.js 15 App Router**: 默认 Server Components，重交互部分以客户端岛屿形式存在。
- **SSG 优先**: 构建期预渲染 46 个页面；写操作通过动态边缘 API 处理。
- **EdgeOne Edge Functions**: 写操作 API（`/api/comments`、`/api/danmaku/*`、`/api/feed/*`）位于 `edge-functions/`，作为 EdgeOne Pages Functions 部署，使 Next.js 产物不含 Node.js 运行时依赖。
- **静态导出**: `next.config.ts` 使用 `output: "export"` 与 `distDir: "dist"`；EdgeOne Pages 直接部署 `dist/` 目录，彻底规避 SSR Node 函数包体积限制。
- **Turbopack 开发**: 按需编译，冷启动快，路由首次访问后即可即时响应。
- **Mounted 门控模式**: 通过 `MobileContext` 与 `useMobileMounted` 统一防止水合不匹配。

---

## 技术栈

### 核心技术

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 15.5.21 |
| UI 库 | React | 19.2.0 |
| 语言 | TypeScript | 5.9.3 |
| 样式 | Tailwind CSS | 3.4.17 |
| 运行时 | Node.js | 20.18.0 |
| 部署平台 | 腾讯云 EdgeOne Pages | - |

### 附加库

- **内容管线**: gray-matter、react-markdown、remark-gfm、remark-math、rehype-katex
- **3D 与图形**: Cesium、Three.js、@react-three/fiber、@react-three/drei
- **动画**: framer-motion、gsap
- **UI 工具**: lucide-react、clsx、tailwind-merge、sonner
- **边缘运行时**: Web Crypto API、通过全局变量访问的 KVNamespace

---

## 项目结构

```
SAKURAIN-TECH/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 根布局、元数据、字体、Providers
│   ├── page.tsx                      # 首页
│   ├── not-found.tsx                 # 404 页面
│   ├── globals.css                   # 全局样式
│   ├── robots.ts                     # robots.txt 路由
│   ├── sitemap.ts                    # sitemap.xml 路由
│   ├── feed.xml/route.ts             # RSS 订阅源路由
│   ├── atom.xml/route.ts             # Atom 订阅源路由
│   ├── feed.json/route.ts            # JSON Feed 路由
│   ├── blog/                         # 博客列表与文章页
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── notes/                        # 随笔列表页
│   ├── docs/                         # 文档 catch-all
│   │   └── [[...slug]]/page.tsx
│   ├── friends/                      # 友情链接页
│   ├── friends-circle/               # 朋友圈页
│   ├── earth-online/                 # 3D 地球页
│   ├── algo-viz/                     # 算法可视化页
│   ├── about/                        # 关于页
│   ├── studio/                       # 作品集展厅
│   ├── projects/                     # 项目展示页
│   └── resume/                       # 简历页
├── edge-functions/                   # EdgeOne Pages Functions（写操作 API）
│   ├── lib/                          # 边缘函数共享逻辑（鉴权、限流、KV）
│   └── api/                          # 函数入口
│       ├── comments.js               # /api/comments
│       ├── danmaku/
│       │   ├── list.js               # /api/danmaku/list
│       │   ├── add.js                # /api/danmaku/add
│       │   └── delete.js             # /api/danmaku/delete
│       └── feed/
│           ├── get.js                # /api/feed/get
│           ├── refresh.js            # /api/feed/refresh
│           ├── batch-get.js          # /api/feed/batch-get
│           └── batch-refresh.js      # /api/feed/batch-refresh
├── content/                          # 所有托管内容的单一可信源
│   ├── blog/posts/                   # 博客文章源文件
│   ├── notes/posts/                  # 随笔源文件
│   ├── docs/                         # 文档 Markdown 文件
│   ├── data/                         # JSON 数据文件（友链、播放列表、站点数据等）
│   ├── config/                       # 运行时配置文件
│   └── resume/                       # 简历数据
├── src/                              # 应用源码
│   ├── components/                   # React 组件
│   ├── contexts/                     # React Context（MobileContext 等）
│   ├── hooks/                        # 自定义 React Hooks
│   ├── lib/                          # 工具库
│   │   ├── content/                  # gray-matter 内容管线
│   │   ├── api/                      # 边缘 API 共享逻辑（鉴权、限流、KV）
│   │   └── api-auth.ts               # 客户端 HMAC 签名
│   └── config/                       # 自动生成的部署配置
├── public/                           # 静态资源
│   ├── blog/                         # 博客公开资源（文章由 content/ 生成）
│   ├── docs/                         # 文档静态文件（由 content/ 生成）
│   ├── image/                        # 站点图片
│   ├── music/                        # 音频文件
│   ├── fonts/                        # 自托管字体
│   ├── map-data/                     # GeoJSON 地图数据
│   ├── data/                         # JSON 数据文件（由 content/ 生成）
│   ├── config/                       # 运行时配置文件（由 content/ 生成）
│   ├── resume/                       # 简历数据（由 content/ 生成）
│   └── cesium/                       # 生成的 Cesium 运行时资产（gitignored）
├── scripts/                          # 构建与辅助脚本
│   ├── sync-content-to-public.js     # 将托管内容从 content/ 复制到 public/
│   ├── check-friends-connectivity.js # 友链连通性检查
│   └── submit-sitemap.js             # 搜索引擎站点地图提交
├── edgeone.json                      # EdgeOne Pages 部署配置
├── next.config.ts                    # Next.js 配置
├── postcss.config.mjs                # PostCSS 配置
├── eslint.config.mjs                 # ESLint 配置
├── package.json                      # npm 脚本与依赖
├── .env.example                      # 环境变量模板
└── README.md                         # 英文说明文档
```

---

## 快速开始

### 前置要求

- **Node.js**: 20.18.0（EdgeOne Pages 构建环境固定版本）
- **npm**: 10.x 或更高
- **Git**: 任意近期版本

### 安装

```bash
# 克隆仓库
git clone https://github.com/IYeaSakura/SAKURAIN-TECH.git
cd SAKURAIN-TECH

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 填入你的配置
```

### 环境变量

在项目根目录创建 `.env.local`：

```env
# 后端 API 基础地址（留空表示同源相对路径）
API_BASE_URL=

# 写操作 API 的共享 HMAC-SHA256 签名密钥。
# 客户端用其签名请求，EdgeOne Edge Functions 用其验签。
# 长度至少 32 字节（64 个十六进制字符）。
# 注意：该密钥会暴露给浏览器。Phase 3b 将改为服务端代理或 token 机制。
API_SECRET_KEY=

# Cesium Ion 访问令牌（Ion 资产的备用方案）
NEXT_PUBLIC_CESIUM_ION_TOKEN=

# 开发环境 API 代理目标（默认：https://sakurain.net）
# 设为 http://localhost:8788 可使用本地模拟服务。
DEV_API_TARGET=
```

**安全提示**: 切勿提交 `.env` 或 `.env.local`，二者均已加入 `.gitignore`。

---

## 开发指南

### 启动开发服务器

```bash
npm run dev
```

Next.js 开发服务器在 `http://localhost:3000` 启动，默认启用 Turbopack。首次访问未编译路由会有短暂编译等待，之后该路由即时响应。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 使用 Turbopack 启动 Next.js 开发服务器 |
| `npm run build` | 执行所有构建脚本，然后执行 `next build` |
| `npm run build:fast` | 仅执行 `next build`，跳过所有构建脚本 |
| `npm run submit-sitemap` | 将生成的站点地图提交给搜索引擎 |
| `npm run start` | 启动生产预览服务器 |
| `npm run lint` | 运行 ESLint |

### 本地 API 开发

默认情况下，`next.config.ts` 会在开发环境将 `/api/:path*` 重写到线上站点（`https://sakurain.net`），无需本地后端即可读取真实评论、弹幕和友链数据。

> **警告**: 默认模式下的写操作会调用生产 API 并修改线上数据。

如需本地开发边缘函数，请使用 EdgeOne CLI（`edgeone dev`）或部署到预览环境。`edge-functions/` 目录不由 `next dev` 提供服务，Next.js 开发服务器只负责静态前端。

### 代码风格

- 启用 TypeScript 严格模式。
- ESLint 采用 Next.js 推荐配置。
- 客户端 Hooks 与浏览器 API 在条件渲染中必须通过 `mounted` 门控保护。
- EdgeOne Edge Functions 使用 Web Standard `Request`/`Response` 对象，并通过全局变量访问 KV 命名空间。

---

## 构建与部署

### 生产构建

```bash
npm run build
```

构建流程按顺序执行以下步骤，前一步成功才会继续下一步：

1. **`copy-cesium.mjs`**：将 Cesium 运行时资产从 `node_modules/cesium/Build/Cesium` 复制到 `public/cesium/`。
2. **`sync-content-to-public.js`**：将托管内容（`content/data/*`、`content/docs/*`、`content/config/*`、`content/resume/*`）复制到 `public/`，并根据 `content/docs-index.json` 生成 `public/data/docs.json`。
3. **`check-friends-connectivity.js`**：更新 `public/data/friends.json` 中友链的在线/离线状态。
4. **`next build`**：将 54 个静态页面与 RSS/Atom/JSON 订阅源导出到 `dist/`。
5. **`submit-sitemap.js`**：将生成的站点地图提交给搜索引擎。

由于项目使用 `output: "export"`，不再生成 SSR Node 函数包。`edge-functions/` 中的 EdgeOne Pages Functions 单独部署，不属于 Next.js 构建产物。

如需跳过脚本仅执行 `next build`：

```bash
npm run build:fast
```

### 构建阶段

| 阶段 | 说明 |
|------|------|
| 1. 内容同步 | 将 `content/` 复制到 `public/` |
| 2. 友链检查 | 检查友链连通性 |
| 3. 编译 | TypeScript 编译与打包优化 |
| 4. 静态生成 | 46 个页面导出为静态 HTML 到 `dist/` |
| 5. 站点地图提交 | 提交 sitemap 给搜索引擎 |
| 6. 追踪与优化 | 收集构建追踪并 finalize 输出 |

### EdgeOne Pages 部署

本项目部署于腾讯云 EdgeOne Pages。`edgeone.json` 关键配置：

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `nodeVersion`: `20.18.0`
- Rewrites: 保留 `/feed`、`/feed/atom`、`/feed/json` 等旧别名
- Caches: `/_next/static/*`、`/image/*`、`/music/*` 长期缓存；`/data/*`、`/blog/*`、`/notes/*`、订阅源短缓存
- Headers: 为静态资源与订阅源配置安全与内容类型响应头

**KV 命名空间**: 在 EdgeOne 控制台绑定以下命名空间：

- `KV_SECRET` - nonce 重放保护
- `RATE_LIMIT_KV` - 限流
- `DANMAKU_KV` - 卫星弹幕存储
- `COMMENTS_KV` - 博客评论存储
- `FEED_KV` - 朋友圈订阅缓存

在边缘函数中，这些绑定以全局变量形式直接访问，例如 `await COMMENTS_KV.get(key)`。

---

## API 参考

所有 API 端点均以 Next.js Edge Route Handlers 形式实现于 `app/api/*`，写操作通过 `X-Timestamp`、`X-Nonce`、`X-Signature` 头共享 HMAC 认证。

### 认证

写操作端点需要 HMAC-SHA256 签名：

```
X-Timestamp: <毫秒时间戳>
X-Nonce: <UUID>
X-Signature: <hex(HMAC-SHA256("<timestamp>:<nonce>", API_SECRET_KEY))>
```

### 评论

| 端点 | 方法 | 需认证 | 说明 |
|------|------|--------|------|
| `/api/comments` | GET | 否 | 列出某篇文章的评论（`?postId=<slug>`） |
| `/api/comments` | POST | 是 | 为某篇文章添加评论 |

### 弹幕

| 端点 | 方法 | 需认证 | 说明 |
|------|------|--------|------|
| `/api/danmaku/list` | GET | 否 | 列出所有卫星弹幕 |
| `/api/danmaku/add` | POST | 是 | 新增弹幕消息 |
| `/api/danmaku/delete` | POST | 是 | 按 ID 删除弹幕消息 |

### 朋友圈订阅

| 端点 | 方法 | 需认证 | 说明 |
|------|------|--------|------|
| `/api/feed/get` | GET | 否 | 获取缓存的订阅条目 |
| `/api/feed/batch-get` | GET | 否 | 批量获取多个源 |
| `/api/feed/refresh` | POST | 是 | 刷新单个订阅源 |
| `/api/feed/batch-refresh` | POST | 是 | 刷新所有订阅源 |

### 响应格式

成功：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "error": "Invalid signature"
}
```

---

## 性能优化

### 优化策略

- **SSG 优先渲染**: 构建期预渲染 46 个页面，降低内容页运行时服务器负载。
- **Turbopack 开发**: 开发环境冷启动快、按需编译。
- **优化包导入**: `next.config.ts` 中为 `lucide-react`、`framer-motion`、`@react-three/drei` 配置 `optimizePackageImports`，减少打包体积。
- **自托管字体**: JetBrains Mono、VT323、Press Start 2P 等字体本地化，避免境外网络阻塞。
- **图片优化**: 尽量使用 Next.js Image 组件；大型音频文件作为静态资源提供。
- **Mounted 门控模式**: 重型客户端特效延迟到水合后执行，避免布局偏移与水合不匹配。

### 性能指标

| 指标 | 目标 |
|------|------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| 构建耗时 | < 90s |
| 静态页面数量 | 46 |
| Edge Route Handlers 数量 | 8 |

### 打包注意事项

- Cesium 运行时资产存放于 `public/cesium/`，作为静态文件提供，不打入 JavaScript 包。该目录已加入 `.gitignore`；若缺失，请从 `node_modules/cesium/Build/Cesium` 手动复制后再构建。
- Three.js 与 Cesium 仅在需要它们的页面通过 `ssr: false` 动态导入。
- `/earth-online`、`/algo-viz` 等重交互页面标记为 dynamic，避免阻塞静态生成。

---

## 内容管理

### 内容管线

项目使用基于 `gray-matter` 与 `react-markdown` 的自定义内容管线：

- **源文件**: 博客与随笔 Markdown 分别位于 `content/blog/posts/` 与 `content/notes/posts/`。
- **Frontmatter**: 每篇文章包含标题、日期、描述、标签与可选的 featured 标记。
- **渲染**: `react-markdown` 配合 `remark-gfm`、`remark-math`、`rehype-katex` 处理 GitHub 风格 Markdown 与 KaTeX 数学公式。
- **静态生成**: `app/blog/[slug]/page.tsx` 与 `app/docs/[[...slug]]/page.tsx` 通过 `generateStaticParams` 预渲染所有内容路径。

### 添加博客文章

1. 在 `content/blog/posts/` 下新建 Markdown 文件。
2. 顶部添加 frontmatter：

```markdown
---
title: "文章标题"
date: "2026-07-23"
description: "简短描述"
tags: ["Next.js", "EdgeOne"]
featured: true
---
```

3. 使用 Markdown 编写正文。
4. 运行 `npm run build`，新文章将纳入 SSG 与订阅源。

### 添加随笔

1. 在 `content/notes/posts/` 下使用时间戳文件名格式 `YYYYMMDDHHMMSS.md` 创建文件。
2. 添加 frontmatter：

```markdown
---
title: "随笔标题"
date: "2026-07-23 14:30"
mood: "happy"
---
```

---

## 安全

### 认证

- 写请求使用 HMAC-SHA256 签名，附带时间戳与 nonce。
- 通过 `KV_SECRET` 实现 nonce 重放保护，TTL 为 5 分钟。
- 时间戳容差为 5 分钟，防止重放攻击。

### API 安全

- 基于 `RATE_LIMIT_KV` 按 IP 限流。
- 所有写操作端点均进行输入校验与长度限制。
- 配置 CORS 响应头以支持跨域访问。
- 错误响应仅返回模糊信息，不暴露堆栈或敏感配置。

### 响应头

Edge Route Handlers 在响应中包含以下安全头：

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- 根据路由配置的 `Content-Security-Policy` 指令

### 已知限制

- `API_SECRET_KEY` 目前会暴露给浏览器，因为客户端直接签名请求。Phase 3b 将迁移为服务端代理或 token 机制，以消除客户端密钥暴露。

---

## 故障排查

### 构建失败：`Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`

**原因**: Turbopack dev 缓存与 webpack 生产构建共用 `.next/`，导致缓存污染。

**解决**:

```bash
rm -rf .next
npm run build
```

### 开发服务器跨域警告

**原因**: Next.js 15 在通过 `127.0.0.1` 访问 `localhost` 时会发出跨域警告。

**解决**: 已在 `next.config.ts` 中配置：

```ts
allowedDevOrigins: ["localhost", "127.0.0.1"]
```

### `npm run build` 卡在友链检查

**原因**: `check-friends-connectivity.js` 会向每个友链发起 HTTPS 请求。

**解决**: 网络较慢时可增加超时，或本地迭代时使用 `npm run build:fast` 跳过。CI/CD 环境需确保允许出站 HTTPS。

### 写 API 返回 `Invalid signature`

**原因**: 客户端与边缘处理器的 `API_SECRET_KEY` 不一致，或系统时间偏差过大。

**解决**:

- 确保 `.env.local` 与 EdgeOne 环境配置相同的 `API_SECRET_KEY`。
- 校验系统时间准确。
- 检查请求是否携带 `X-Timestamp`、`X-Nonce`、`X-Signature` 头。



## 贡献指南

欢迎贡献。请遵循以下流程：

1. Fork 仓库。
2. 创建功能分支：`git checkout -b feature/your-feature`。
3. 按照代码风格指南进行修改。
4. 运行构建：`npm run build`。
5. 提交：`git commit -m 'feat: add new feature'`。
6. 推送：`git push origin feature/your-feature`。
7. 发起 Pull Request。

### 代码质量要求

提交 PR 前请确认：

- [ ] `npm run build` 无错误通过。
- [ ] `npm run lint` 通过，或仅引入可接受的警告。
- [ ] 新增环境变量已在 `.env.example` 与 README 中说明。
- [ ] Edge Route Handlers 包含输入校验与 KV 操作的 try-catch。
- [ ] 未提交任何密钥或 `.env` 文件。

---

## 更新日志

迁移时间线与关键决策详见 [PROGRESS.md](PROGRESS.md)。

---

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE)。

---

## 致谢

本项目得益于以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [React](https://react.dev/) - UI 库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先 CSS 框架
- [Cesium](https://cesium.com/) - 3D 地球与地图
- [Three.js](https://threejs.org/) - 3D 图形库
- [EdgeOne Pages](https://pages.edgeone.ai/) - 边缘部署平台

---

## 联系方式

- **作者**: Yuyang.Wang
- **网站**: [https://sakurain.net](https://sakurain.net)
- **邮箱**: [Yae_SakuRain@outlook.com](mailto:Yae_SakuRain@outlook.com)
- **GitHub**: [https://github.com/IYeaSakura](https://github.com/IYeaSakura)

---

<p align="center">
  Made by Yuyang.Wang
</p>
