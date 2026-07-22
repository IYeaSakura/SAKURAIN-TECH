# STYLE FUSION — refact.cc 极简工程风 × SAKURAIN-TECH 像素工程风

本文件说明本次全站样式融合新增的**语义化工具类**及其用法，供后续逐页迁移时参考。

- 改动文件：`app/globals.css`（文末新增 `@layer components` 分区）、`tailwind.config.ts`
- 原则：**只增不删**。shadcn 语义色变量、像素风 `mc-*` 类、全部动画 keyframes 原样保留，新旧风格可自由混用。
- 设计取向：在保留像素/工程混合风（Zpix 字体、`mc-btn`、`mc-panel`）的基础上，引入 refact.cc 式「发丝线分隔 + 等宽标注 + 编号徽章 + 极简卡片」的克制工程感，用于内容型分区（项目列表、博客索引、文档导航、页脚等）。

---

## 一、tailwind.config.ts 变更说明

| 变更 | 内容 | 兼容性 |
|---|---|---|
| 语义色补 `<alpha-value>` | 所有 shadcn 色（`border`/`primary`/`muted`/`background`…）改为 `hsl(var(--x) / <alpha-value>)` | 旧写法 `bg-border` 渲染结果不变；**新增** `bg-border/40`、`text-primary/80` 等透明度修饰符可用 |
| `borderWidth.hairline` | `border-hairline` = 1px | 纯新增 |
| `letterSpacing.widest` | 0.1em → **0.12em** | ⚠️ 全站 `tracking-widest` 轻微变宽（0.02em 差异，视觉上几乎不可察觉，属有意微调）；如需旧值可在元素上用 `tracking-[0.1em]` |
| `container` / `screens` | 补全显式配置：container 居中 + 响应式 padding（1rem → 2.5rem），screens 与 Tailwind 默认值一致（2xl 容器限宽 1400px） | 此前未配置，纯新增；现有未使用 `container` 类的布局不受影响 |

## 二、新工具类速查

### `.hairline-grid` — 发丝线网格容器

`grid gap-px border border-border/40 bg-border/40`：利用 1px 间隙 + 容器背景色形成发丝分隔线。**子项必须自带底色**（`bg-background` / `bg-card`）线条才会显现。

```tsx
<div className="hairline-grid sm:grid-cols-2 lg:grid-cols-3">
  {projects.map((p) => (
    <div key={p.id} className="bg-background p-6">…</div>
  ))}
</div>
```

适合替换：现有用 `grid gap-4` + 每卡片独立 `border`/`mc-panel` 的项目列表、特性网格。换成发丝线网格后卡片之间共享分隔线，更像工程图纸表格。

### `.hairline-b` / `.hairline-t` — 分区发丝线

`border-b|t border-border/40`。用于 section 之间、sticky header 之下、footer 之上，替代较重的 `border-b-2` / `mc-navbar` 式 3px 描边。

```tsx
<header className="hairline-b sticky top-0 bg-background/80 backdrop-blur">…</header>
<footer className="hairline-t mt-24">…</footer>
```

### `.mono-label` — 等宽大写小标签

`font-mono text-xs uppercase tracking-widest text-muted-foreground`。工程图纸式标注，放在分区标题上方或卡片角落。

```tsx
<span className="mono-label">Projects / 01</span>
<span className="mono-label">Last updated · 2025-01</span>
```

适合替换：各处手写的 `text-xs uppercase tracking-widest text-muted-foreground` 组合、`.text-label` / `.text-caption` 的非像素风用法。

### `.section-head` — 分区头部

`flex flex-wrap items-end justify-between gap-4`：左侧标题组、右侧「查看全部 →」类链接，基线对齐。与 `.mono-label` + `.hairline-b` 是标准三件套：

```tsx
<div className="section-head hairline-b pb-4">
  <div>
    <span className="mono-label">01 — Notes</span>
    <h2 className="text-section mt-2">最近笔记</h2>
  </div>
  <Link href="/notes" className="mono-label hover:text-foreground transition-colors">
    全部笔记 →
  </Link>
</div>
```

### `.num-badge` — 编号徽章

`border-primary/20 bg-primary/10 text-primary font-mono` 的小号编号块，用于列表序号、步骤编号、版本标记。

```tsx
<span className="num-badge">01</span>
<span className="num-badge">v0.3</span>
```

适合替换：博客/项目列表里手写的序号 `<span>`、`.mc-badge` 的非像素风场景。

### `.card-minimal` — 极简卡片

`border border-border/40 bg-background/50 transition-colors duration-200`，hover 时 `border-border/60 bg-muted/10`。无阴影、无圆角依赖（跟随 `--radius`），与 `.mc-panel` 的重像素描边形成「轻重两级」卡片体系：

```tsx
<Link href={`/blog/${slug}`} className="card-minimal block p-6">
  <span className="mono-label">{date}</span>
  <h3 className="text-card-title mt-2">{title}</h3>
</Link>
```

适合替换：博客/笔记/文档索引页的列表卡片（当前多为 `rounded-lg border bg-card shadow-sm` 或手写玻璃拟态）。

## 三、逐页迁移建议（优先级从高到低）

1. **Blog / Notes / Docs 索引页**：列表项 → `.card-minimal`；分区头 → `.section-head` + `.mono-label`；页脚上方 → `.hairline-t`。
2. **/projects 项目页**：项目网格 → `.hairline-grid`（子项 `bg-background`），项目序号 → `.num-badge`。
3. **首页次要分区**（最新文章、项目精选等非 hero 区）：分区头三件套；hero 区保留现有像素/特效风格不动。
4. **页脚**：`.hairline-t` + `.mono-label` 排版版权/链接标注。
5. **保留不动**：导航栏 `mc-navbar`、像素按钮 `mc-btn`、hero 特效、音乐播放器——像素风是全站品牌识别，极简风只用于「内容陈列层」。

## 四、混用守则

- **重像素元素（mc-btn / mc-panel / font-pixel）每屏至多一处焦点**，其余分区用极简类承载，避免风格打架。
- 发丝线颜色统一走 `border-border/40`，不要再发明新的灰；hover 加深用 `/60`。
- 等宽标注一律 `.mono-label`，不要混用 `font-pixel` 做小标签（像素字体小字号可读性差）。
- 卡片二选一：交互重的入口卡片用 `.mc-panel`，内容索引卡片用 `.card-minimal`；同一列表内不混用。
