# SAKURAIN Tech

[![Website](https://img.shields.io/badge/Website-sakurain.net-blue)](https://sakurain.net)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Personal portfolio and blog website built with modern web technologies. Features a modern, animated UI with 3D visualizations, a comprehensive blog system, documentation, algorithm visualizations, and developer tools.

**Live Site**: [https://sakurain.net](https://sakurain.net)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Performance](#performance)
- [Security](#security)
- [API Reference](#api-reference)
- [Content Management](#content-management)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Homepage
- ASCII art logo animation with typewriter effect
- Tech stack evolution timeline with interactive charts
- Service showcase section with hover effects
- Staggered loading animations with performance optimization
- Background particle effects with GPU acceleration

### Blog System
- Markdown-based content with frontmatter support
- GitHub Flavored Markdown (GFM) and math expression support
- Tags and archive organization with filtering
- RSS/Atom/JSON feed generation and auto-submission
- Comment system with moderation and spam protection
- Featured post highlighting and related posts recommendation
- Full-text search capability with instant results
- Reading time estimation and word count

### Documentation
- Course materials and tutorials (React TSX, WebGL, Site Tech)
- Technical articles and coding guidelines
- Organized by category (courses, rules, services)
- Interactive code examples with syntax highlighting
- Table of contents generation for long articles

### Algorithm Visualizer
- Interactive sorting algorithm animations (Bubble, Quick, Merge, Heap, etc.)
- Graph algorithm visualizations (BFS, DFS, Dijkstra, A*, etc.)
- Dynamic programming demonstrations
- Step-by-step execution control with play/pause
- Speed adjustment and customization options
- Pseudocode display synchronized with animation
- Data size and array type customization

### Developer Tools
- JSON formatter and validator with tree view
- Base64 encoder/decoder for text and files
- Color converter (HEX, RGB, HSL, CMYK) with picker
- Regular expression tester with match highlighting
- Hash generator (MD5, SHA-1, SHA-256, SHA-512)
- QR code generator with customization options
- Timestamp converter and date formatter
- URL encoder/decoder and parser
- HTML entity encoder/decoder
- UUID generator and validator
- Number base converter (Binary, Octal, Decimal, Hex)
- Text diff and comparison tool
- Markdown preview and editor

### 3D Earth Visualization
- Cesium-based interactive globe with high-resolution imagery
- Satellite orbit visualization with TLE data support
- Real-time satellite position tracking and prediction
- Danmaku (bullet comments) overlay system
- China map data visualization with regional boundaries
- Camera controls and animation paths
- Day/night cycle visualization
- Starfield background and atmospheric effects

### Notes System
- Micro-blogging/note-taking with markdown support
- Mood tracking (happy, neutral, sad) with visual indicators
- Timeline view with infinite scroll
- Quick publishing workflow via API
- Auto-generated archive pages

### Friends Links
- Friends link aggregation with avatar and description
- RSS feed aggregation with auto-refresh
- Connectivity status checking with health indicators
- Link exchange management and categorization

### Music Player
- Global floating music player with playlist support
- Visual audio spectrum analyzer
- Playback controls and progress tracking
- Volume control and mute toggle
- Playlist management and shuffle/repeat modes

---

## Tech Stack

### Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.9.x |
| Build Tool | Vite | 7.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui | Latest |
| Animation | Framer Motion | 12.x |
| Animation | GSAP | 3.x |
| 3D Graphics | Three.js | Latest |
| 3D React | React Three Fiber | 9.x |
| 3D Globe | CesiumJS | 1.x |
| Icons | Lucide React | Latest |
| Routing | React Router | 7.x |

### Additional Libraries

- **Markdown Rendering**: `react-markdown` with `remark-gfm`, `remark-math`, `rehype-katex`
- **Charts**: Recharts, custom SVG charts
- **Carousel**: Embla Carousel
- **Smooth Scroll**: Lenis
- **PDF Generation**: html2pdf.js
- **Syntax Highlighting**: react-syntax-highlighter
- **UI State**: next-themes, vaul
- **Notifications**: sonner
- **Form Validation**: zod
- **Date Handling**: date-fns

---

## Project Structure

```
SAKURAIN-TECH/
├── src/                         # Main source code
│   ├── components/              # React components
│   │   ├── atoms/               # Atomic components (Button, Card, Badge, GlowBadge)
│   │   ├── ui/                  # shadcn/ui components (Button, Dialog, Dropdown, etc.)
│   │   ├── effects/             # Visual effects (particles, glow, mouse effects, 3D globe)
│   │   ├── sections/            # Page sections (Hero, Footer, Navigation, etc.)
│   │   └── MusicPlayer/         # Global music player with controls and playlist
│   ├── pages/                   # Page components (lazy-loaded for performance)
│   │   ├── Blog/                # Blog system (list, post, tags, archives)
│   │   ├── Docs/                # Documentation system with categories
│   │   ├── AlgoViz/             # Algorithm visualizer with multiple algorithms
│   │   ├── Tools/               # Developer tools registry and individual tools
│   │   ├── Friends/             # Friends links and RSS aggregation
│   │   ├── Notes/               # Micro-blog system with mood tracking
│   │   ├── EarthOnline/         # Cesium 3D globe and satellite tracking
│   │   └── ...                  # Other pages (About, Timeline, etc.)
│   ├── hooks/                   # Custom React hooks (useTheme, useMobile, usePerformance)
│   ├── contexts/                # React contexts (Theme, Performance, Mobile)
│   ├── lib/                     # Utility functions (utils, animations, api-auth)
│   ├── types/                   # TypeScript type definitions
│   └── styles/                  # Global CSS styles and animations
├── public/                      # Static assets (served directly)
│   ├── blog/                    # Blog posts, generated archives and tags
│   ├── notes/                   # Notes posts and generated archives
│   ├── docs/                    # Documentation markdown files
│   ├── data/                    # JSON data files (site-data, friends, docs index)
│   ├── config/                  # Runtime configuration files
│   ├── map-data/                # China map GeoJSON data
│   ├── Assets/                  # Cesium assets and textures
│   └── image/                   # Website images and icons
├── edge-functions/              # Edge Function APIs (EdgeOne/Cloudflare)
│   ├── api/                     # API endpoints (danmaku, comments, feeds)
│   └── _utils/                  # Shared utilities for edge functions
├── scripts/                     # Build automation scripts
│   ├── generate-deployment-config.js
│   ├── generate-security-config.js
│   ├── check-friends-connectivity.js
│   ├── generate-blog-tags.js
│   ├── generate-blog-archive.js
│   ├── generate-notes-archive.js
│   ├── generate-feeds.js
│   ├── generate-sitemap.js
│   └── submit-sitemap.js
├── dist/                        # Build output (generated by Vite)
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration with manual chunks
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript base configuration
├── tsconfig.app.json            # TypeScript app configuration
└── tsconfig.node.json           # TypeScript node configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: 20.18.0 or higher (recommended: 22.x LTS)
- **npm**: 10.x or higher (or pnpm 9.x)
- **Git**: For version control

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SAKURAIN-TECH

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env with your configuration
# See Environment Variables section below
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# Required for API write operations
# ============================================
VITE_API_SECRET_KEY=your-32-byte-secret-key-here

# ============================================
# Optional: Search Engine Submission
# ============================================
BAIDU_PUSH_TOKEN=your-baidu-token
BING_API_KEY=your-bing-api-key
```

**Security Note**: Never commit the `.env` file to version control. The `.env` file is already listed in `.gitignore`.

---

## Development

### Start Development Server

```bash
npm run dev
```

The development server will start at `http://localhost:5173` (or another available port) with hot module replacement (HMR) enabled.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Full production build with all optimizations |
| `npm run build:fast` | Fast build without pre-build scripts |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npx tsc --noEmit` | Type check without emitting files |

### Code Style

The project uses strict TypeScript configuration with the following conventions:

#### Import Patterns

```typescript
// Use @/ alias for src/ imports
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks';
import { formatDate } from '@/lib/utils';

// Use type keyword for type-only imports
import type { SiteData, Post } from '@/types';
import type { ReactNode } from 'react';
```

#### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BlogCard.tsx`, `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useTheme.ts`, `useMobile.ts` |
| Utilities | camelCase | `utils.ts`, `formatDate.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `DEFAULT_TIMEOUT` |
| CSS Classes | Tailwind utilities; custom in kebab-case | `btn-primary`, `card-hover` |

#### Component Structure

```typescript
// Props interface
interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

// Functional component with explicit return type
export function MyComponent({ title, children }: MyComponentProps): JSX.Element {
  return (
    <div className="p-4">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

### Performance Guidelines

- Use `React.lazy()` for route-based code splitting
- Use `useMemo` and `useCallback` for expensive computations
- Respect `prefers-reduced-motion` for accessibility
- Use `will-change` sparingly and only on animated elements
- Prefer `transform` and `opacity` for animations (GPU accelerated)

---

## Build & Deployment

### Production Build

```bash
# Full production build (recommended)
npm run build
```

The build process runs multiple stages in sequence:

| Stage | Script | Description |
|-------|--------|-------------|
| 1 | `generate-deployment-config.js` | Generate deployment mode configuration |
| 2 | `generate-security-config.js` | Generate security feature toggles |
| 3 | `check-friends-connectivity.js` | Check friends link connectivity status |
| 4 | `generate-blog-tags.js` | Extract and generate blog tags |
| 5 | `generate-blog-archive.js` | Generate blog archive pages |
| 6 | `generate-notes-archive.js` | Generate notes archive pages |
| 7 | `generate-feeds.js` | Generate RSS/Atom/JSON feeds |
| 8 | `generate-sitemap.js` | Generate sitemap.xml |
| 9 | `submit-sitemap.js` | Submit sitemap to search engines |
| 10 | `tsc -b` | TypeScript compilation |
| 11 | `vite build` | Vite production build |

### Build Output

The build output is located in `dist/` with the following structure:

```
dist/
├── index.html              # Entry HTML file
├── assets/                 # Static assets
│   ├── index-*.js         # Main JS bundle
│   ├── react-vendor-*.js  # React vendor chunk
│   ├── framer-motion-*.js # Framer Motion chunk
│   └── ...                # Other chunks
├── blog/                  # Blog static files
├── notes/                 # Notes static files
└── ...                    # Other public assets
```

### Deployment Platforms

#### EdgeOne (Primary)

The project is primarily deployed on Tencent Cloud EdgeOne. Configuration is in `edgeone.json`.

#### Vercel

Alternative deployment on Vercel is supported via `vercel.json`.

```bash
# Deploy to Vercel
vercel --prod
```

### Cache Configuration

| Resource Type | Cache Duration |
|---------------|----------------|
| JS/CSS Assets | 30 days |
| Images/Music | 30 days |
| Data/Content | 60 seconds |
| RSS Feeds | 5 minutes |
| HTML | No cache |

---

## Performance

### Build Optimizations

The project implements several build-time optimizations:

#### Code Splitting

Manual chunks are configured in `vite.config.ts`:

| Chunk | Contents |
|-------|----------|
| `react-vendor` | React, React DOM, React Router |
| `framer-motion` | Framer Motion |
| `gsap` | GSAP + @gsap/react |
| `lucide` | Lucide React icons |
| `utils` | clsx, tailwind-merge, class-variance-authority |
| `charts` | Recharts |
| `three-core` | Three.js |
| `react-three` | React Three Fiber, Drei |

#### Other Build Optimizations

- CSS code splitting enabled
- esbuild minification with console/debugger removal in production
- Source maps disabled in production
- Tree shaking for dead code elimination

### Runtime Optimizations

- **Route-based lazy loading**: Pages loaded on demand
- **Staggered effect loading**: Animations start at different times to reduce initial load
- **Performance context**: Detects device capability and adjusts quality
- **Reduced motion support**: Respects `prefers-reduced-motion` user preference
- **GPU acceleration**: Uses `transform` and `will-change` appropriately
- **Image optimization**: WebP format preferred for images

### Performance Metrics

The project targets the following performance metrics:

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.8s |
| Cumulative Layout Shift (CLS) | < 0.1 |

---

## Security

### Client-side Protection

The project includes optional client-side security features (configurable via build scripts):

- Debug detection and protection
- F12/developer tools blocking (optional, configurable)
- Source code obfuscation via build process
- Console output removal in production

### API Security

All write operations to Edge Functions require:

- **HMAC-SHA256** signature authentication
- **Timestamp validation** (5-minute tolerance window)
- **Nonce validation** to prevent replay attacks
- **Rate limiting** (60 requests/minute per IP address)

### API Authentication Example

```typescript
import { generateApiSignature } from '@/lib/api-auth';

const payload = {
  content: 'Comment content',
  postId: 'post-slug',
  timestamp: Date.now(),
  nonce: crypto.randomUUID()
};

const signature = generateApiSignature(payload, API_SECRET_KEY);

await fetch('/api/comments', {
  method: 'POST',
  headers: {
    'X-Signature': signature,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

### Environment Variables Security

Sensitive variables that should never be committed:

| Variable | Purpose |
|----------|---------|
| `VITE_API_SECRET_KEY` | API signing key |
| `BAIDU_PUSH_TOKEN` | Baidu search submission |
| `BING_API_KEY` | Bing webmaster API |

---

## API Reference

### Edge Functions

Located in `edge-functions/api/`, deployed to EdgeOne/Cloudflare.

#### Danmaku API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/danmaku/list` | GET | No | Get satellite danmaku list |
| `/api/danmaku/add` | POST | Yes | Add new danmaku |
| `/api/danmaku/delete` | POST | Yes | Delete danmaku (admin only) |

#### Comments API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/comments` | GET | No | Get comments for a post |
| `/api/comments` | POST | Yes | Post a new comment |

#### Feed API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/feed/get` | GET | No | Get RSS feed data |
| `/api/feed/refresh` | POST | Yes | Refresh RSS feed cache |
| `/api/feed/batch-get` | GET | No | Batch get multiple feeds |
| `/api/feed/batch-refresh` | POST | Yes | Batch refresh feeds |

### Request/Response Format

All APIs use JSON format. Successful responses:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

---

## Content Management

### Blog Posts

Blog posts are stored as Markdown files in `public/blog/posts/`.

#### Frontmatter Format

```markdown
---
title: "Post Title"
description: "Brief description of the post"
date: "2026-02-08"
author: "SAKURAIN"
tags: ["React", "TypeScript", "Web Development"]
cover: "/image/logo.webp"
featured: true
---

# Content starts here

Write your post content in Markdown...
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `description` | Yes | Brief description for SEO and previews |
| `date` | Yes | Publication date (YYYY-MM-DD) |
| `author` | No | Author name (defaults to "SAKURAIN") |
| `tags` | No | Array of tag strings |
| `cover` | No | Cover image path |
| `featured` | No | Whether to feature on homepage |

#### Workflow

1. Create markdown file in `public/blog/posts/`
2. Add proper frontmatter
3. Run `npm run build` to regenerate indices and feeds
4. Images should be placed in `public/blog/assets/`

### Notes (Micro-blog)

Notes are stored in `public/notes/posts/` with timestamp-based filenames.

#### Frontmatter Format

```markdown
---
title: "Note Title"
date: "2026-02-08 14:30"
mood: "happy"  # Options: happy, neutral, sad
---

Note content here...
```

#### Workflow

1. Create markdown file with timestamp filename (e.g., `20260302001351.md`)
2. Add frontmatter with title, date, and mood
3. Run `npm run build` to regenerate archives

### Documentation

Documentation is stored in `public/docs/` organized by category:

```
public/docs/
├── courses/          # Tutorial series
│   ├── react-tsx/   # React TypeScript course
│   ├── webgl/       # WebGL tutorials
│   └── site-tech/   # Website technology guides
├── rules/           # Coding standards and guidelines
└── services/        # Service documentation
```

### Adding a Developer Tool

1. Create tool component in `src/pages/Tools/tools/my-tool.tsx`:

```typescript
export function MyTool() {
  return (
    <div>
      <h1>My Tool</h1>
      {/* Tool UI */}
    </div>
  );
}
```

2. Register in `src/pages/Tools/registry.ts`:

```typescript
import { MyTool } from './tools/my-tool';

registerTool({
  id: 'my-tool',
  name: 'My Tool',
  description: 'Description of what the tool does',
  component: MyTool,
  icon: WrenchIcon,
  category: 'Converter'  // or 'Generator', 'Formatter', 'Utility'
});
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Opera | 76+ | Full support |

### Mobile Support

| Platform | Support Level |
|----------|--------------|
| iOS Safari | Full support (iOS 14+) |
| Android Chrome | Full support (Android 10+) |
| Android Firefox | Full support |

### Features with Limited Support

| Feature | Fallback |
|---------|----------|
| WebGL 3D Globe | Static image fallback |
| CSS Grid/Flexbox | Standard layout |
| CSS Variables | Inline styles fallback |
| Intersection Observer | Scroll event fallback |

---

## Troubleshooting

### Build Failures

**Problem**: `npm run build` fails with TypeScript errors

**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Ensure Node.js version is 20.18.0+
node --version

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Build fails during script execution

**Solution**:
```bash
# Run individual scripts to identify the issue
node scripts/generate-blog-tags.js
node scripts/generate-feeds.js

# Check that all required directories exist
ls -la public/blog/posts/
ls -la public/notes/posts/
```

### Development Issues

**Problem**: Hot reload not working

**Solution**:
- Check that `vite.config.ts` HMR is enabled
- Ensure no syntax errors in the file being edited
- Try refreshing the browser manually

**Problem**: Environment variables not loading

**Solution**:
- Ensure `.env` file exists in project root
- Variable names must start with `VITE_` to be exposed to client
- Restart the dev server after changing `.env`

### Edge Function Issues

**Problem**: API returns 401 Unauthorized

**Solution**:
- Check that `VITE_API_SECRET_KEY` is set correctly
- Verify timestamp is within 5-minute window
- Ensure nonce is unique and not reused

**Problem**: KV storage errors

**Solution**:
- Verify KV namespace bindings are configured
- Check that KV namespaces exist in EdgeOne/Cloudflare dashboard

---

## Changelog

### [1.0.0] - 2026-03-25

- Initial release
- Homepage with animated UI and 3D globe
- Blog system with Markdown support
- Documentation system
- Algorithm visualizer
- Developer tools collection
- Notes system with mood tracking
- Friends links with RSS aggregation
- Music player with visualizer

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and ensure build passes: `npm run build`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality Requirements

Before submitting a PR, ensure:

- [ ] `npm run lint` passes without errors
- [ ] `npx tsc --noEmit` has no TypeScript errors
- [ ] `npm run build` completes successfully
- [ ] All new code follows the project's style conventions
- [ ] Components respect `usePrefersReducedMotion()` for accessibility
- [ ] No `console.log` statements in production code

### Reporting Issues

When reporting bugs, please include:

- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console error messages

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 SAKURAIN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

This project is built with the help of many open-source projects:

- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [React](https://react.dev/) - The library for web and native user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Framer Motion](https://www.framer.com/motion/) - Production-ready motion library
- [GSAP](https://greensock.com/gsap/) - Professional-grade JavaScript animation
- [Cesium](https://cesium.com/) - Open-source platform for 3D geospatial data
- [Three.js](https://threejs.org/) - JavaScript 3D library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

## Contact

- **Website**: [https://sakurain.net](https://sakurain.net)
- **Email**: [contact@sakurain.net](mailto:contact@sakurain.net)
- **GitHub**: [https://github.com/yourusername](https://github.com/yourusername)

---

<p align="center">
  Made by SAKURAIN
</p>
