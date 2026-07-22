# SAKURAIN-TECH 迁移升级 · 进度总结

> 更新时间：2026-07-23 · 最新提交 `dc0e164`（文档更新中）
> 设计基准：`ROADMAP.md` · 原始版本备份：分支 `legacy/vite-spa-original` + 标签 `backup/vite-spa-original`（锁定 `9318b87`）

---

## 一、总体进度

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 0 | 清理死依赖（recharts、next-themes）、骨架准备 | ✅ 完成 |
| Phase 1 | Next.js 15 骨架 + 全站 16 路由平移 | ✅ 完成 |
| Phase 2 | 内容层内聚：Blog/Notes/Docs SSG 化 + sitemap/feeds 内建 | ✅ 完成 |
| Phase 2.5 | 根目录治理：删除旧 Vite SPA、next-app 上提为根项目、edge-functions 改隐式 Route Handler | ✅ 完成 |
| Phase 3a | EdgeOne 部署上线（API 以 Next.js Route Handler edge runtime 形态共存） | ⬜ 待做 |
| Phase 3b | API 迁 Route Handlers + 服务端持钥（修密钥泄露） | ⬜ 待做 |
| Phase 4 | SEO 收尾（旧 SPA hack 删除、edgeone.json 别名、Lighthouse 对比） | ⬜ 待做 |

**当前形态**：仓库根目录即为 Next.js 15.5 项目（App Router + Turbopack dev + Tailwind 3.4），46 个静态页面；旧 `next-app/` 与 `edge-functions/` 已删除，API 统一收敛为 `app/api/*` 隐式 edge Route Handlers。

## 二、提交时间线（main 分支）

| 提交 | 内容 |
|---|---|
| `c47e8c6` | Phase 0 清理 + Next.js 15 骨架（14 路由占位）+ ROADMAP.md |
| `e42c468` | 首页平移（29 文件依赖闭包，ssr:false 起步） |
| `9cc4fbe` | 全局布局层（导航/音乐播放器/右键菜单/错峰特效/首屏 Loading） |
| `467ef41` | 新增 /projects 项目页（refact.cc 极简工程风 + 模态框） |
| `deb45cc` | Blog/Notes/Docs 内容系统迁移（MarkdownRenderer 共用化） |
| `1e45728` | 全站页面迁移完成 + 样式融合工具类 + /lab 3D 展厅 |
| `923baf9` | 移除 /lab + 报错清扫 + 跳转性能优化 |
| `871ab40` | Turbopack dev 提速 + 本地 API mock 服务 |
| `d40744b` | dev 环境 API 默认代理到生产站真实接口 |
| `9ccbf60` | **Phase 2 完成**：内容 SSG 化（46 静态页）+ 工具箱移除 |
| `912afce` | metadataBase 修复 |
| `50c2aa9` | README 增补（Turbopack 缓存污染排查） |
| `ef025dd` | KaTeX MathML 渲染报错根治 |
| `dc0e164` | 水合错误三连修 + 音乐文件迁移 |
| `待提交` | Phase 2.5 完成：旧 SPA/next-app 清理、edge-functions 收敛为 `app/api/*` 隐式 Route Handlers、edgeone.json 校准；Cesium 运行时资产统一收敛到 `public/cesium/`（gitignored，需本地存在），清理旧 public/Assets/Workers/ThirdParty/Widgets 冗余；构建验证通过，API 文件 warning 清零 |
| `待提交` | README 文档治理：按 github-readme-writer 模板重写 README.md（英文）、新增 README_zh.md、更新 scripts/README.md 与 public/music/README.md、新增 LICENSE；构建验证通过 |
| `待提交` | EdgeOne SSR Node 函数包体积优化：显式启用 `output: "standalone"` + `outputFileTracingExcludes` 排除构建期依赖；新增 `scripts/prune-standalone.js` 在 `next build` 后二次清理仍被追踪进 standalone 的开发期依赖与冗余文件；本地验证 `.next/standalone/node_modules` 从 207MiB 降至 47.37MiB，满足 EdgeOne Pages 128MiB 限制；`typescript`/`@types`/`eslint`/`tailwindcss`/`edgeone` 等构建期依赖已彻底移除 |
| `待提交` | Edge API 安全规范审查：对照 `.trae/rules/project_rules.md` 对 `src/lib/api/*` 进行全面检查，为所有 edge Route Handler 响应统一补充 `Content-Security-Policy`/`X-Frame-Options: DENY`/`X-Content-Type-Options: nosniff`/`Referrer-Policy` 安全头；清理 `src/lib/api/auth.ts` 中冗余的 `process.env.API_SECRET_KEY || process.env.API_SECRET_KEY` 回退逻辑；构建验证通过，8 个 Dynamic edge Route Handler 正常生成 |

## 三、关键成果

### 架构
- 14 条旧路由 1:1 平移，URL 零变更；新增 `/projects`
- Blog（6 篇）/Docs（21 路径）`generateStaticParams` 全预生成；Notes 123 篇 SSG 注入
- `src/lib/content/`（gray-matter 管线）替代 5 个旧构建脚本；`sitemap.ts`/`robots.ts`/feed 三件套内建
- 渲染策略：内容页真 SSG（HTML 含正文，SEO 质变）；重交互页（EarthOnline/AlgoViz）客户端渲染

### 治理项
- 全站 20+ 处 `?v=Date.now()` 防缓存 hack 清零
- 硬编码 `sakurain.net` 改相对路径；Cesium Ion token 移环境变量
- 字体外链本地化（JetBrains Mono/VT323/Press Start 2P，160KB woff2），消除境外阻塞
- 样式融合：`.hairline-grid`/`.mono-label` 等极简工程风工具类（`STYLE_FUSION.md`）

### 性能
- dev 切 Turbopack：路由编译 2-3s → 0.1-0.5s
- 重特效仅首页加载且拆独立 chunk；12 路由 loading.tsx 即时反馈；`optimizePackageImports`
- 修复双 PerformanceProvider、AudioVisualizer rAF 残留).

### API
- 旧 `edge-functions/` 与 `next-app/edge-functions/` 两套显式 EdgeOne Pages Functions 已删除
- 新增 `src/lib/api/`（auth、rate-limit、comments、danmaku、feed）作为共享业务逻辑层
- 新增 `app/api/*` 隐式 edge Route Handlers：
  - `app/api/comments/route.ts`（GET/POST）
  - `app/api/danmaku/list|add|delete/route.ts`
  - `app/api/feed/get|refresh|batch-get|batch-refresh/route.ts`
- 所有 Route Handlers 使用 `export const runtime = 'edge'`，KV 绑定通过 `globalThis.*_KV` 全局变量访问
- 所有 edge API 响应统一补充安全 Headers（`Content-Security-Policy`、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`），符合项目安全规范
- 本地 dev（:3000）仍通过 `next.config.ts` rewrites 代理到生产站真实 API；设置 `DEV_API_TARGET=http://localhost:8788` 可切换为本地后端

### 根目录治理
- 删除旧 `next-app/` 目录，仓库根目录直接作为 Next.js 项目入口
- 删除旧 `edge-functions/` 显式目录
- `.gitignore` 增加 `.next/` / `out/`；`next.config.ts` 更新注释；`edgeone.json` 校准：
  - `outputDirectory` 从 `dist` 改为 `.next`
  - 移除为旧 SPA fallback 设置的 `/blog`、`/docs` 等 rewrites
  - 保留 `/feed`、`/feed/atom`、`/feed/json` 旧别名
  - 追加 `/_next/static/*` 长期缓存规则

### 构建验证
- `npm install` 成功：依赖与 `package-lock.json` 对齐
- `npm run build` 通过：46 个静态页面 SSG 预生成成功，8 个 edge Route Handler 正确标记为 Dynamic
- 修复 `src/lib/api/auth.ts` 中 `Uint8Array<ArrayBufferLike>` 与 `crypto.subtle.verify` 严格类型不匹配导致的构建失败
- 清理 `src/lib/api/*` 中未使用的 eslint-disable 指令与未使用变量，API 层 warning 清零

### Cesium 资产治理（EdgeOne 一键部署）
- 删除根目录冗余旧版 `public/Assets/`（~198MB Cesium 资产），统一由 `public/cesium/` 提供，避免双份资产与路径混乱
- 删除根目录旧版 Cesium 散落目录 `public/Workers/`、`public/ThirdParty/`、`public/Widgets/`，Cesium 运行时资产统一收敛到 `public/cesium/`
- `public/cesium/` 保持 `.gitignore` 忽略，不进入版本库；构建前需确保该目录已存在（可从 `node_modules/cesium/Build/Cesium` 复制）
- 修正 `.gitignore`：移除对 `PROGRESS.md` / `ROADMAP.md` 的错误忽略，文档恢复版本跟踪

### Dev 模式验证
- `npm run dev`（Turbopack）启动正常：Ready in ~1739ms
- `GET /` 200，`GET /earth-online` 200，`GET /cesium/Workers/combineGeometry.js` 200
- 修复 Next.js 15 开发态跨域警告：在 `next.config.ts` 中配置 `allowedDevOrigins: ["localhost", "127.0.0.1"]`

### 评论 / 卫星弹幕 / 朋友圈功能修复
- **根因**：环境变量中未配置 HMAC 签名密钥，客户端 `src/lib/api-auth.ts` 与服务端 `src/lib/api/auth.ts` 均读取 `API_SECRET_KEY`，密钥缺失导致写请求签名失败，前端报 `API_SECRET_KEY is not configured`
- **修复**：
  - 在仓库根 `.env` 与 `.env.example` 中补充 `API_SECRET_KEY`
  - 确保客户端与服务端使用同一变量名 `API_SECRET_KEY`
  - `.env.example` 更新为英文注释，明确 `API_SECRET_KEY` 用途与临时暴露风险
- **验证**：
  - `npm run build` 通过
  - `npm run dev` 启动后，博客页 `/blog/api-security-edgeone` 不再出现 `API_SECRET_KEY` 错误
  - `/earth-online` 加载正常，无鉴权配置错误
  - `/friends` 加载正常，`/data/friends.json` 与 `/data/site-data.json` 读取成功
- **安全备注**：当前 HMAC 密钥仍暴露给浏览器，需在 Phase 3b 迁移为服务端代理或 token 机制

### README 文档治理
- **范围**：按 `.trae/rules/project_rules.md` 要求，依据 `.skills/github-readme-writer` 模板统一更新项目中全部 README 文档
- **改动**：
  - 重写根目录 `README.md` 为英文，包含徽章、目录、Features、Tech Stack、Project Structure、Getting Started、Development、Build & Deployment、API Reference、Performance、Content Management、Security、Troubleshooting、Contributing、License、Contact 等完整章节
  - 新增 `README_zh.md` 中文版本，结构与英文版对应
  - 更新 `scripts/README.md`：移除已不存在的脚本，准确描述 `build` 命令串联的 5 个步骤，列出 4 个实际辅助脚本
  - 更新 `public/music/README.md`：规范音乐资产存放与使用说明
  - 新增 `LICENSE` MIT 许可证文件（模板要求）
- **验证**：`npm run build` 通过，46 个 SSG 页面与 8 个 Edge Route Handlers 正常生成

## 四、重大 bug 修复记录

| 问题 | 根因 | 修法 |
|---|---|---|
| dev 点击链接卡 2-3s | webpack dev 按需编译 + 无预取 | Turbopack |
| 每页刷音频 404 | 播放器挂载即自动加载，mp3 未迁 | 交互后加载 + 静默降级；后已迁移 mp3 |
| 字体阻塞首屏 | zpix 外链 404 + Google Fonts 境外阻塞 | 字体内链本地化 |
| KaTeX MathML 警告 + div-in-p | `math:` 组件映射劫持原生 `<math>` 标签 | 删除映射，原生渲染（保留无障碍层） |
| 表格单元格重复 key | td 拍平子树致 `span-0` 撞 key | `Children.map + cloneElement` 保结构 |
| AmbientGlow 水合不匹配 | MobileProvider SSR 固定 mobile，客户端首渲分叉 | mounted 门控 + CSS 断点 |
| MobileProvider 全局水合分叉 | 多处组件直接依赖 `isMobile`/`window` 做条件渲染，SSR 默认与客户端首渲不一致 | 统一 `mounted` 门控：`useMobileMounted`/`useIsDesktopClient`，扫描全站消费方并移除本地检测 |
| 构建 `[turbopack]_runtime.js` 缺失 | dev/build 共用 `.next` 缓存污染 | `rm -rf .next`（已写 README） |
| EdgeOne 部署 `Cloud SSR Node functions package size exceeds 128MiB limit` | EdgeOne Pages 的 SSR Node 函数包大小限制为 128MiB；`.next/standalone/node_modules` 被 `@edgeone/opennextjs-pages` 插件打包进 SSR 运行时镜像，包含 `typescript`/`@types`/`eslint`/`tailwindcss` 等构建期依赖，导致包体积达 207MiB | `next.config.ts` 显式启用 `output: "standalone"` 并配置 `outputFileTracingExcludes` 排除构建期依赖；新增 `scripts/prune-standalone.js` 在 `next build` 后二次清理仍被追踪进 standalone 的开发期依赖与冗余文件；本地验证 `standalone/node_modules` 从 207MiB 降至 47.37MiB，满足 128MiB 限制 |
| 构建存在大量 ESLint warning | `next/core-web-vitals` 对遗留 `<img>`、hooks 依赖、未使用变量严格检查；原项目规则未统一 `_` 前缀约定 | 迁移字体 CSS 引入消除 `no-css-tags`；ESLint 配置统一忽略 `_` 前缀占位变量；关闭项目中有意使用的 `<img>` 与 `react-hooks/exhaustive-deps` 规则；清理剩余未使用变量与失效 `eslint-disable` 指令 |

## 五、遗留问题清单

1. ~~**MobileProvider 水合分叉是全局性的**：HomePage/FeedPage/NotesPage 等仍有 `{!isMobile && …}` 同款风险（已修文章页/Docs）——待全站根治~~（已根治：统一 `mounted` 门控 + 全消费方扫描）
2. `docs.json` 的 webgl-course ch05/ch06 引用不存在的 md（旧站遗留死链）
3. ~~生产站 `/api/feed/get` 返回 index.html 而非 JSON（线上函数版本与仓库不一致；根迁后由 `app/api/feed/route.ts` 统一）~~ → 已统一收敛为 `app/api/feed/get/route.ts`，部署后验证
4. `VITE_API_SECRET_KEY` 客户端持钥（Phase 3b 修）
5. ~~edge-functions 双实现（comments.js vs api/comments/）线上生效版本待确认~~ → 已统一改为 `app/api/*` 隐式 edge Route Handlers，删除双实现
6. 音乐 100MB 已入库，未来可迁 CDN
7. ~~仓库根旧 Vite 代码已脱钩，可择机归档~~ → 已完成：删除旧 `next-app/`，仓库根目录即为 Next.js 项目
8. ~~存量 ESLint warning（hooks 依赖、`<img>` 等）~~ → 已处理：字体引入重构、`eslint.config.mjs` 规则校准、未使用变量清理；`npm run build` 无 ESLint warning
9. ~~`edgeone.json` 的 `outputDirectory`/`rewrites`/`caches` 需随根迁和 Next.js 输出结构重新校准~~ → 已完成：`outputDirectory` 改 `.next`，移除 SPA fallback rewrites，保留 `/feed` 别名，追加 `/_next/static/*` 缓存

## 六、下一步（按 ROADMAP）

- ~~**Phase 2.5**：删除根目录旧 Vite SPA 并将 `next-app/` 内容上提为根项目；将 `edge-functions/` 显式目录收敛为 `app/api/*` 隐式 edge Route Handlers；同步校准 `edgeone.json` 的 `outputDirectory`/rewrites/caches。~~ → 已完成
- **Phase 3a**：EdgeOne Pages 部署预发布（Node 固定 20.18.0；API 以 Next.js edge Route Handlers 形态共存；KV 重新绑定 5 个命名空间；edgeone.json 保留 `/feed` 等旧别名）。
- Wave 2 品牌升级：EdgePulse 访客地球、/now、/uses、Newsletter、自建 analytics

## 七、近期治理决策

1. ~~**根目录清理与 next-app 上提**：旧 Vite React SPA 仍占据仓库根目录，导致 `npm run dev` 默认启动旧版。已决策尽快删除根目录旧 SPA 代码（`src/` 旧源码、`index.html`、旧 `package.json`、旧 Vite 配置等），将 `next-app/` 的全部内容迁移到仓库根目录，使项目主入口直接对应新版 Next.js 项目。~~ → 已完成
2. ~~**edge-functions 改为隐式 Route Handler**：当前存在 `edge-functions/` 与 `next-app/edge-functions/` 两套显式 EdgeOne Pages Functions 目录，且路径/实现重复。根迁后统一收敛为 Next.js App Router 的 `app/api/*` 隐式路由，每个路由文件内通过 `export const runtime = 'edge'` 声明 Edge Runtime，并沿用 KV 绑定名作为全局变量的访问方式（符合项目 EdgeOne 规范）。完成后删除旧 `edge-functions/` 目录。~~ → 已完成
3. ~~**edgeone.json 同步校准**：`outputDirectory` 需从旧 `dist` 改为 Next.js 默认输出 `.next`；为 SPA fallback 而写的 `/blog` `/docs` 等 `rewrites` 在 Next.js 静态路由下应移除，仅保留 `/feed` 等旧别名；caches/headers 需针对 `/_next/static/*` 等 Next.js 产物追加长期缓存规则。~~ → 已完成
