# SAKURAIN-TECH（Next.js 15 迁移版）

个人品牌站的 Next.js 15（App Router）版本，部署目标为 EdgeOne Pages。

## 本地开发

### 启动前端

```bash
npm install
npm run dev        # http://localhost:3000（next dev --turbopack）
```

### 关于 dev 模式的编译延迟

- **首次访问某个路由会有编译等待，属正常现象**。dev 模式下 Next.js 按需编译：
  点击链接跳转到一个尚未编译过的路由时，等待的其实是该路由的实时编译时间。
- 本项目已默认启用 **Turbopack**（`next dev --turbopack`，Next 15.5 已稳定），
  冷编译约 0.5–1s，远快于 webpack dev 的 2–3s；编译过的路由再次访问即时响应。
- **生产模式没有这个问题**：`npm run build && npm start` 下所有页面在构建期
  预编译完毕，运行时无编译延迟。
- Turbopack 注意事项：不支持 CSS 中的根绝对路径 `@import url('/...')`
  （server-relative import）。因此本地化字体 `/fonts/google/fonts.css`
  通过 `app/layout.tsx` 的 `<link>` 标签引入，而不是 `globals.css` 里的 `@import`。

### 本地 API：默认直连生产（推荐）

`next.config.ts` 中配置了**仅开发态生效**的 rewrites（`NODE_ENV === 'development'`
条件判断，生产构建输出不含 rewrites——EdgeOne 部署不支持 next.config
rewrites，线上一律走 `edgeone.json`），把 `/api/:path*` 代理到
`DEV_API_TARGET` 环境变量指定的目标：

- **不设置（默认）= `https://sakurain.net`**：dev 下所有 `/api/*` 请求
  直接穿透到线上站的生产真实接口（CORS 已全开），读到的评论、弹幕、
  友链缓存都是真实数据。
- **设置为 `http://localhost:8788`**：切回本地 mock（见下一节）。

因此日常开发只需：

```bash
npm run dev        # 或 npm run dev -- -p 3100
```

前端代码里直接请求 `/api/comments`、`/api/danmaku/list` 等相对路径即可，
dev 下自动穿透到生产 API。

> [!WARNING]
> **⚠️ 默认模式下写操作会真实写入生产 KV！**
> 在 dev 页面上发评论、发弹幕、删弹幕、刷新友链缓存，都会通过
> HMAC 签名（`NEXT_PUBLIC_API_SECRET_KEY`）直接调用线上接口，
> **内容会真实出现在 https://sakurain.net 上，线上访客立即可见**。
> 调试写接口前请确认这是你想要的效果；否则切到下一节的本地 mock 方案。

验证（默认模式）：

```bash
curl "http://localhost:3100/api/comments?postId=<真实文章slug>"
# -> {"success":true,"comments":[...真实评论...],...}
curl http://localhost:3100/api/danmaku/list
# -> [...真实弹幕...]
```

### 备选：本地 mock API（edge-functions）

`edge-functions/` 是从仓库根旧 Vite 项目复制的 EdgeOne Pages Functions
（弹幕 / 评论 / 友链 RSS），**代码零改动**，本地通过
`scripts/dev-api-server.mjs`（EdgeOne Pages 运行时的纯本地模拟）运行。
适合调试写接口、改函数代码、离线开发等场景。

> 为什么不用官方 `edgeone pages dev`：官方 CLI（npm 包 `edgeone`）的本地
> 沙箱启动时强制要求 `EDGEONE_PAGES_API_TOKEN`（腾讯云登录/鉴权），无法离线
> 使用。已安装为 devDependency 备查；若日后完成登录，可改用官方 CLI。

切换到本地 mock：

1. 在 `.env.local` 中添加（该文件已有注释示例）：

   ```
   DEV_API_TARGET=http://localhost:8788
   ```

2. 开两个终端：

   ```bash
   # 终端 1：前端（端口 3100 为例）
   npm run dev -- -p 3100

   # 终端 2：本地函数服务（默认端口 8788，EDGE_API_PORT 可覆盖）
   npm run dev:api
   ```

3. 用完把 `.env.local` 里的 `DEV_API_TARGET` 注释掉即恢复默认（直连生产）。

#### 本地 KV 与环境变量

- 函数以裸全局变量引用 KV 绑定（`KV_SECRET` / `RATE_LIMIT_KV` /
  `DANMAKU_KV` / `COMMENTS_KV` / `FEED_KV`）。dev-api-server 在加载函数前
  把这些绑定注入 `globalThis`，底层是持久化到 `.edgeone-local/kv-store.json`
  的本地模拟（支持 `get/put/delete/list` 与 `expirationTtl`），
  重启后数据保留；删除该文件即可重置。
- 环境变量从 `.env.local` 读取并作为 `context.env` 传入。需要：

  ```
  VITE_API_SECRET_KEY=<与仓库根 .env 中相同的值>
  ```

  写接口（评论 POST、弹幕 add/delete、feed refresh）要求 HMAC 签名头
  `X-Timestamp` / `X-Nonce` / `X-Signature`，签名消息为
  `${timestamp}:${nonce}`，密钥即 `VITE_API_SECRET_KEY`。
- 前端自身的签名密钥走 `NEXT_PUBLIC_API_SECRET_KEY`（值同上，见
  `.env.example`）；两种 API 目标下前端签名逻辑完全一致。
- `.env.local`、`.edgeone-local/`、`.edgeone/` 均已 gitignore，不会提交。

## 构建与部署

```bash
npm run build
npm start
```

EdgeOne Pages 部署说明见仓库根 `edgeone.json` 与 `ROADMAP.md`。
