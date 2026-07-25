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

A personal brand portal built with Next.js 15 App Router, deployed on Tencent Cloud EdgeOne Pages. The site combines a technical blog, documentation courses, interactive algorithm visualizations, a 3D Earth live feed, friend links, and a portfolio studio into a single SSG-first application with edge-computed interactive APIs.

[Features](#features) | [Tech Stack](#tech-stack) | [Project Structure](#project-structure) | [Getting Started](#getting-started) | [Development](#development) | [Build & Deployment](#build--deployment) | [API Reference](#api-reference) | [Security](#security) | [Troubleshooting](#troubleshooting) | [Contributing](#contributing) | [License](#license) | [Contact](#contact)

**Live Site**: [https://sakurain.net](https://sakurain.net)

---

## Features

### Content & Publishing

- **Blog**: Markdown-driven posts with frontmatter, KaTeX math, syntax highlighting, GFMs, and OG images.
- **Notes**: Short-form timestamped notes with mood tags and automatic archive indexes.
- **Docs**: Multi-level documentation courses and rules served through a catch-all SSG route.
- **Feeds**: Built-in RSS 2.0, Atom, and JSON Feed routes at `/feed.xml`, `/atom.xml`, and `/feed.json`.
- **Sitemap & Robots**: Auto-generated `sitemap.xml` and a static `public/robots.txt` gentleman's-agreement file. The build can push URLs to Bing (primary), Baidu, and Google Search Console via `scripts/submit-sitemap.js`.

### Interactive Experiences

- **EarthOnline**: A Cesium-powered 3D globe with live satellite orbits and an interactive danmaku layer.
- **AlgoViz**: Browser-based algorithm visualizations including graph traversal, sorting, and grid pathfinding.
- **Friends Circle**: A social feed aggregator with batch refresh and cached card rendering.
- **Music Player**: Persistent ambient music player with playlist management and playback state.

### Architecture & DX

- **Next.js 15 App Router**: Server Components by default, with client islands for heavy interactivity.
- **SSG-First**: ~57 pages prerendered at build time; dynamic edge APIs for write operations.
- **EdgeOne Edge Functions**: Write APIs (`/api/comments`, `/api/danmaku/*`, `/api/feed/*`) live in `edge-functions/` and are deployed as EdgeOne Pages Functions, keeping the Next.js bundle free of Node.js runtime dependencies.
- **Static Export**: `next.config.ts` uses `output: "export"` with `distDir: "dist"`; EdgeOne Pages deploys the `dist/` directory directly, eliminating the SSR Node function package entirely.
- **Turbopack Dev**: Fast cold-start dev server with on-demand route compilation.
- **Mounted Gate Pattern**: Unified hydration-mismatch prevention via `MobileContext` and `useMobileMounted`.

---

## Tech Stack

### Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 15.5.21 |
| UI Library | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Runtime | Node.js | 20.18.0 |
| Deployment | Tencent Cloud EdgeOne Pages | - |

### Additional Libraries

- **Content Pipeline**: gray-matter, react-markdown, remark-gfm, remark-math, rehype-katex
- **3D & Graphics**: Cesium, Three.js, @react-three/fiber, @react-three/drei
- **Animation**: framer-motion, gsap
- **UI Utilities**: lucide-react, clsx, tailwind-merge, sonner
- **Edge Runtime**: crypto Web API, KVNamespace via global bindings

### Skills Stack

The site showcases the following engineering skill groups (see `content/data/site-data.json`):

| Category | Key Skills |
|----------|------------|
| High-Performance Computing | C/C++, AVX512 SIMD, CUDA, OpenMP |
| Backend Development | Python, Go, FastAPI, Gin |
| Data Storage | ClickHouse, PostgreSQL, Redis, Kafka |
| Frontend Development | Vue3, React, TypeScript, TailwindCSS |
| Machine Learning | PyTorch, NumPy, Pandas, Scikit-learn |
| DevOps & Deployment | Docker, Kubernetes, Nginx, Linux |

---

## Project Structure

```
SAKURAIN-TECH/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout, metadata, fonts, providers
│   ├── page.tsx                      # Home page
│   ├── not-found.tsx                 # 404 page
│   ├── globals.css                   # Global styles
│   ├── sitemap.ts                    # sitemap.xml route
│   ├── robots.txt                    # static robots.txt (copied from public/)
│   ├── feed.xml/route.ts             # RSS feed route
│   ├── atom.xml/route.ts             # Atom feed route
│   ├── feed.json/route.ts            # JSON feed route
│   ├── blog/                         # Blog listing and post pages
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── notes/                        # Notes listing page
│   ├── docs/                         # Documentation catch-all
│   │   └── [[...slug]]/page.tsx
│   ├── friends/                      # Friend links page
│   ├── friends-circle/               # Social feed page
│   ├── earth-online/                 # 3D globe page
│   ├── algo-viz/                     # Algorithm visualization page
│   ├── about/                        # About page
│   ├── studio/                       # Portfolio studio
│   ├── projects/                     # Projects showcase
│   └── resume/                       # Resume page
├── edge-functions/                   # EdgeOne Pages Functions (write APIs)
│   ├── lib/                          # Shared edge logic (auth, rate-limit, KV)
│   └── api/                          # Function entrypoints
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
├── content/                          # Single source of truth for all managed content
│   ├── blog/                         # Blog post source files
│   ├── notes/posts/                  # Note source files
│   ├── docs/                         # Documentation markdown files
│   ├── data/                         # JSON data files (friends, playlist, site-data, etc.)
│   ├── config/                       # Runtime config files
│   └── resume/                       # Resume data
├── src/                              # Application source
│   ├── components/                   # React components
│   ├── contexts/                     # React contexts (MobileContext, etc.)
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utility libraries
│   │   ├── content/                  # gray-matter content pipeline
│   │   ├── api/                      # Edge API shared logic (auth, rate-limit, KV)
│   │   └── api-auth.ts               # Client-side HMAC signer
│   └── config/                       # Auto-generated deployment config
├── public/                           # Static assets
│   ├── blog/                         # Public blog assets (posts are generated from content/)
│   ├── docs/                         # Static docs files (generated from content/)
│   ├── image/                        # Site images
│   ├── music/                        # Audio files
│   ├── fonts/                        # Self-hosted fonts
│   ├── map-data/                     # GeoJSON map data
│   ├── data/                         # JSON data files (generated from content/)
│   ├── config/                       # Runtime config files (generated from content/)
│   ├── resume/                       # Resume data (generated from content/)
│   └── cesium/                       # Generated Cesium runtime assets (gitignored)
├── scripts/                          # Build and auxiliary scripts
│   ├── generate-playlist.js          # Scan music files and build playlist.json
│   ├── sync-content-to-public.js     # Copy managed content from content/ to public/
│   ├── check-friends-connectivity.js # Multi-threaded friend-link health checker
│   ├── build-next.js                 # Wrapped next build for EdgeOne Pages
│   └── submit-sitemap.js             # Multi-engine sitemap submission
├── edgeone.json                      # EdgeOne Pages deployment config
├── next.config.ts                    # Next.js configuration
├── postcss.config.mjs                # PostCSS configuration
├── eslint.config.mjs                 # ESLint configuration
├── package.json                      # npm scripts and dependencies
├── .env.example                      # Environment variable template
└── README.md                         # This file
```

---

## Getting Started

### Prerequisites

- **Node.js**: 20.18.0 (managed by EdgeOne Pages build environment)
- **npm**: 10.x or higher
- **Git**: any recent version

### Installation

```bash
# Clone the repository
git clone https://github.com/IYeaSakura/SAKURAIN-TECH.git
cd SAKURAIN-TECH

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Base URL for backend APIs (leave empty for same-origin relative paths)
API_BASE_URL=

# Shared HMAC-SHA256 signing key for write API requests.
# Client signs requests with this key; EdgeOne Edge Functions verify it.
# Must be at least 32 bytes (64 hex characters).
# NOTE: this is exposed to the browser. Phase 3b will replace client-side
# signing with a server-side proxy / token-based flow.
API_SECRET_KEY=

# Cesium Ion access token (optional fallback for Ion assets)
NEXT_PUBLIC_CESIUM_ION_TOKEN=

# Dev API proxy target (default: https://sakurain.net)
# Set to http://localhost:8788 to use the local mock server.
DEV_API_TARGET=

# Search engine sitemap submission tokens (optional).
# BING_API_KEY: Bing Webmaster URL Submission API key (primary engine).
# BAIDU_PUSH_TOKEN: Baidu ordinary push token.
# GOOGLE_SERVICE_ACCOUNT_JSON: Google service-account JSON for Search Console API.
# SEARCH_ENGINE_SUBMIT: Comma-separated engine list (default: bing,baidu).
BING_API_KEY=
BAIDU_PUSH_TOKEN=
GOOGLE_SERVICE_ACCOUNT_JSON=
SEARCH_ENGINE_SUBMIT=bing,baidu
```

**Security Note**: Never commit `.env`, `.env.local`, or service-account JSON. They are listed in `.gitignore`.

---

## Development

### Start Development Server

```bash
npm run dev
```

The Next.js dev server starts at `http://localhost:3000` with Turbopack enabled. The first visit to an uncompiled route incurs a short compilation delay; subsequent visits are instant.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server with Turbopack |
| `npm run build` | Run all build scripts, then `next build` |
| `npm run build:fast` | Run `next build` only, skipping all build scripts |
| `npm run submit-sitemap` | Submit the generated sitemap to configured search engines |
| `npm run generate-playlist` | Scan `public/music/` and generate `content/data/playlist.json` |
| `npm run start` | Start production preview server |
| `npm run lint` | Run ESLint |

### Local API Development

By default, `next.config.ts` rewrites `/api/:path*` to the production site (`https://sakurain.net`) during development. This lets you read real comments, danmaku, and friend data without running a local backend.

> **Warning**: Write operations in default mode hit the production API and modify live data.

To develop edge functions locally, use the EdgeOne CLI (`edgeone dev`) or deploy to a preview environment. The `edge-functions/` directory is not served by `next dev`; Next.js only handles the static frontend.

### Code Style

- TypeScript strict mode is enabled.
- ESLint uses the Next.js recommended config.
- Client-side hooks and browser APIs must be guarded by the `mounted` gate when used in conditional rendering.
- EdgeOne Edge Functions use Web Standard `Request`/`Response` objects and access KV namespaces as global variables.

---

## Build & Deployment

### Production Build

```bash
npm run build
```

The build workflow runs the following steps in order. Each step must succeed before the next one starts:

1. **`generate-playlist.js`**: Scans `public/music/` and generates `content/data/playlist.json`.
2. **`sync-content-to-public.js`**: Copies managed content (`content/data/*`, `content/docs/*`, `content/config/*`, `content/resume/*`) into `public/`, and generates `public/data/docs.json` from `content/docs-index.json`.
3. **`check-friends-connectivity.js`**: Multi-threaded friend-link health checker that updates `public/data/friends.json` with online/offline/maintenance status while deduplicating URLs.
4. **`build-next.js`**: Wraps `next build` with extra heap memory, exports static pages and feeds to `dist/`, and copies required metadata files for EdgeOne Pages.
5. **`submit-sitemap.js`**: Pushes the generated sitemap to Bing (primary), Baidu, and/or Google Search Console based on `SEARCH_ENGINE_SUBMIT`.

Because the project uses `output: "export"`, there is no SSR Node function package. EdgeOne Pages Functions in `edge-functions/` are deployed separately and are not part of the Next.js build output.

To skip the scripts and run only `next build`:

```bash
npm run build:fast
```

### Build Stages

| Stage | Description |
|-------|-------------|
| 1. Playlist Generation | Scan `public/music/` and write `content/data/playlist.json` |
| 2. Content Sync | Copy `content/` to `public/` |
| 3. Friends Check | Multi-threaded friend-link connectivity check with URL deduplication |
| 4. Compile | TypeScript compilation and bundle optimization |
| 5. Static Generation | ~57 pages exported as static HTML to `dist/` |
| 6. Sitemap Submit | Push URLs to Bing/Baidu or sitemap to Google Search Console |
| 7. Trace & Optimize | Collect build traces and finalize output |

### EdgeOne Pages Deployment

The project is deployed to Tencent Cloud EdgeOne Pages. Key configuration in `edgeone.json`:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `nodeVersion`: `20.18.0`
- Rewrites: legacy `/feed`, `/feed/atom`, `/feed/json` aliases
- Caches: long-term caching for `/_next/static/*`, `/image/*`, `/music/*`; short TTL for `/data/*`, `/blog/*`, `/notes/*`, feeds
- Headers: security and content-type headers for static assets and feeds

**KV Namespaces**: Bind the following namespaces in the EdgeOne console:

- `KV_SECRET` - nonce replay protection
- `RATE_LIMIT_KV` - rate limiting
- `DANMAKU_KV` - satellite danmaku storage
- `COMMENTS_KV` - blog comments storage
- `FEED_KV` - friends-circle feed cache

In edge functions, these bindings are accessed directly as global variables, for example `await COMMENTS_KV.get(key)`.

---

## API Reference

All write-capable API endpoints are implemented as EdgeOne Pages Functions under `edge-functions/api/`. They share HMAC authentication via `X-Timestamp`, `X-Nonce`, and `X-Signature` headers.

### Authentication

Write endpoints require HMAC-SHA256 signatures:

```
X-Timestamp: <milliseconds since epoch>
X-Nonce: <UUID>
X-Signature: <hex(HMAC-SHA256("<timestamp>:<nonce>", API_SECRET_KEY))>
```

### Comments

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/comments` | GET | No | List comments for a post (`?postId=<slug>`) |
| `/api/comments` | POST | Yes | Add a comment to a post |

### Danmaku

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/danmaku/list` | GET | No | List all satellite danmaku |
| `/api/danmaku/add` | POST | Yes | Add a new danmaku message |
| `/api/danmaku/delete` | POST | Yes | Delete a danmaku message by ID |

### Friends Circle Feed

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/feed/get` | GET | No | Get cached feed entries |
| `/api/feed/batch-get` | GET | No | Batch get feeds for multiple sources |
| `/api/feed/refresh` | POST | Yes | Refresh a single feed source |
| `/api/feed/batch-refresh` | POST | Yes | Refresh all feed sources |

### Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": "Invalid signature"
}
```

---

## Performance

### Optimization Strategies

- **SSG-First Rendering**: ~57 pages are prerendered at build time, eliminating runtime server load for content pages.
- **Turbopack Development**: Fast cold-start and on-demand compilation during development.
- **Optimize Package Imports**: `next.config.ts` configures `optimizePackageImports` for `lucide-react`, `framer-motion`, and `@react-three/drei` to reduce bundle size.
- **Self-Hosted Fonts**: JetBrains Mono, VT323, and Press Start 2P fonts are self-hosted to eliminate external network blocking.
- **Image Optimization**: Next.js Image component is used where possible; large audio files are served as static assets.
- **Mounted Gate Pattern**: Heavy client-side effects are deferred until after hydration to prevent layout shift and hydration mismatch.

### Performance Metrics

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| Build Time | < 90s |
| Static Pages | ~57 |
| Edge Route Handlers | 8 |

### Bundle Considerations

- Cesium runtime assets live under `public/cesium/` and are served as static files, not bundled into JavaScript. The directory is gitignored and generated automatically during the build; if it is missing locally, copy it from `node_modules/cesium/Build/Cesium`.
- Three.js and Cesium are loaded only on pages that need them via dynamic imports with `ssr: false`.
- Heavy interactive pages such as `/earth-online` and `/algo-viz` are marked dynamic to avoid blocking static generation.

---

## Content Management

### Content Pipeline

The project uses a custom content pipeline built on `gray-matter` and `react-markdown`:

- **Source Files**: Blog and notes markdown files live under `content/blog/` and `content/notes/posts/`.
- **Frontmatter**: Each file includes title, date, description, tags, and optional featured flag.
- **Rendering**: `react-markdown` with `remark-gfm`, `remark-math`, and `rehype-katex` handles GitHub-flavored markdown and KaTeX math.
- **Static Generation**: `generateStaticParams` in `app/blog/[slug]/page.tsx` and `app/docs/[[...slug]]/page.tsx` prerenders all content paths.

### Adding a Blog Post

1. Create a new markdown file under `content/blog/`.
2. Add frontmatter at the top:

```markdown
---
title: "Post Title"
date: "2026-07-23"
description: "Short description"
tags: ["Next.js", "EdgeOne"]
featured: true
---
```

3. Write content in Markdown.
4. Run `npm run build` to include the new post in SSG and feeds.

### Adding a Note

1. Create a new markdown file under `content/notes/posts/` using the timestamp filename format `YYYYMMDDHHMMSS.md`.
2. Add frontmatter:

```markdown
---
title: "Note Title"
date: "2026-07-23 14:30"
mood: "happy"
---
```

---

## Security

### Authentication

- HMAC-SHA256 signed requests with timestamp and nonce.
- Nonce replay protection via `KV_SECRET` with 5-minute TTL.
- Timestamp tolerance of 5 minutes to prevent replay attacks.

### API Security

- Rate limiting per IP via `RATE_LIMIT_KV`.
- Input validation and length limits on all write endpoints.
- CORS headers configured for cross-origin access.
- Error responses return generic messages; stack traces and sensitive config are never exposed.

### Headers

Edge Route Handlers include security headers in responses:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` directives appropriate for the route

### Known Limitations

- `API_SECRET_KEY` is currently exposed to the browser because the client signs requests directly. Phase 3b will migrate to a server-side proxy or token-based flow to eliminate client-side key exposure.

---

## Troubleshooting

### Build Failure: `Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`

**Cause**: Turbopack dev cache and webpack production build share `.next/`, causing cache pollution.

**Solution**:

```bash
rm -rf .next
npm run build
```

### Dev Server Cross-Origin Warning

**Cause**: Next.js 15 warns when accessing `localhost` via `127.0.0.1`.

**Solution**: Already configured in `next.config.ts`:

```ts
allowedDevOrigins: ["localhost", "127.0.0.1"]
```

### `npm run build` Hangs on Friend Link Checks

**Cause**: `check-friends-connectivity.js` makes outbound HTTPS requests to every friend link.

**Solution**: The script now uses multi-threaded workers and URL deduplication to speed up checks. On slow networks, use `npm run build:fast` for local iteration, or set `SKIP_FRIEND_CHECK=true` / `CI=true` to skip the check. For CI/CD, ensure outbound HTTPS is allowed.

### Write API Returns `Invalid signature`

**Cause**: `API_SECRET_KEY` mismatch between client and edge handler, or clock skew.

**Solution**:

- Ensure `.env.local` and EdgeOne environment both define the same `API_SECRET_KEY`.
- Verify system clock is accurate.
- Check that `X-Timestamp`, `X-Nonce`, and `X-Signature` headers are present.



## Contributing

Contributions are welcome. Please follow this workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make changes following the code style guidelines.
4. Run the build: `npm run build`.
5. Commit: `git commit -m 'feat: add new feature'`.
6. Push: `git push origin feature/your-feature`.
7. Open a Pull Request.

### Code Quality Requirements

Before submitting a PR:

- [ ] `npm run build` passes without errors.
- [ ] `npm run lint` passes or only introduces acceptable warnings.
- [ ] New environment variables are documented in `.env.example` and README.
- [ ] Edge Route Handlers include input validation and try-catch around KV operations.
- [ ] No secrets or `.env` files are committed.

---

## Changelog

See [PROGRESS.md](PROGRESS.md) for the detailed migration timeline and key decisions.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

This project is built with the help of many open-source projects:

- [Next.js](https://nextjs.org/) - React framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Cesium](https://cesium.com/) - 3D globe and mapping
- [Three.js](https://threejs.org/) - 3D graphics library
- [EdgeOne Pages](https://pages.edgeone.ai/) - Edge deployment platform

---

## Contact

- **Author**: Yuyang.Wang
- **Website**: [https://sakurain.net](https://sakurain.net)
- **Email**: [Yae_SakuRain@outlook.com](mailto:Yae_SakuRain@outlook.com)
- **GitHub**: [https://github.com/IYeaSakura](https://github.com/IYeaSakura)

---

<p align="center">
  Made by Yuyang.Wang
</p>
