# SAKURAIN-TECH 迁移升级 · 进度总结

> 更新时间：2026-07-22 23:07 · 最新提交 `dc0e164`
> 设计基准：`ROADMAP.md` · 原始版本备份：分支 `legacy/vite-spa-original` + 标签 `backup/vite-spa-original`（锁定 `9318b87`）

---

## 一、总体进度

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 0 | 清理死依赖（recharts、next-themes）、骨架准备 | ✅ 完成 |
| Phase 1 | Next.js 15 骨架 + 全站 16 路由平移 | ✅ 完成 |
| Phase 2 | 内容层内聚：Blog/Notes/Docs SSG 化 + sitemap/feeds 内建 | ✅ 完成 |
| Phase 3a | EdgeOne 部署上线（API 保留 edge-functions 共存） | ⬜ 下一步 |
| Phase 3b | API 迁 Route Handlers + 服务端持钥（修密钥泄露） | ⬜ 待做 |
| Phase 4 | SEO 收尾（旧 SPA hack 删除、edgeone.json 别名、Lighthouse 对比） | ⬜ 待做 |

**当前形态**：`next-app/` 为 Next.js 15.5（App Router + Turbopack dev + Tailwind 3.4），46 个静态页面，构建零 error。

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
- 修复双 PerformanceProvider、AudioVisualizer rAF 残留

### API（本地开发）
- `npm run dev`（:3000）+ dev rewrites 默认代理生产站真实 API；`DEV_API_TARGET=http://localhost:8788` + `npm run dev:api` 切回本地 mock（KV 文件持久化、HMAC 鉴权全模拟）

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

## 五、遗留问题清单

1. ~~**MobileProvider 水合分叉是全局性的**：HomePage/FeedPage/NotesPage 等仍有 `{!isMobile && …}` 同款风险（已修文章页/Docs）——待全站根治~~（已根治：统一 `mounted` 门控 + 全消费方扫描）
2. `docs.json` 的 webgl-course ch05/ch06 引用不存在的 md（旧站遗留死链）
3. 生产站 `/api/feed/get` 返回 index.html 而非 JSON（线上函数版本与仓库不一致）
4. `VITE_API_SECRET_KEY` 客户端持钥（Phase 3b 修）
5. edge-functions 双实现（comments.js vs api/comments/）线上生效版本待确认
6. 音乐 100MB 已入库，未来可迁 CDN
7. 仓库根旧 Vite 代码已脱钩，可择机归档
8. 存量 ESLint warning（hooks 依赖、`<img>` 等）

## 六、下一步（按 ROADMAP）

- **Phase 3a**：EdgeOne Pages 部署预发布（Node 固定 20.18.0；edge-functions 共存；KV 重新绑定 5 个命名空间；edgeone.json 配 feed 旧别名）
- Wave 2 品牌升级：EdgePulse 访客地球、/now、/uses、Newsletter、自建 analytics
