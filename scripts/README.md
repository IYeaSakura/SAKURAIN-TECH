# Scripts Documentation

This directory contains custom build scripts for the SAKURAIN project. These scripts are automatically executed during the build process.

## Build Process

The build process runs the following scripts in order:

1. `generate-deployment-config.js` - Generate deployment configuration
2. `generate-security-config.js` - Generate security configuration
3. `check-friends-connectivity.js` - Check friends link connectivity
4. `generate-blog-tags.js` - Generate blog tags
5. `generate-blog-archive.js` - Generate blog archive
6. `generate-notes-archive.js` - Generate notes archive
7. `generate-feeds.js` - Generate RSS/Atom/JSON Feed

## Scripts

### 1. generate-deployment-config.js

**Purpose**: Generate deployment configuration based on the deployment mode setting.

**Usage**: Automatically runs during build process.

**Configuration File**: `public/config/deployment.json`

```json
{
  "mode": "edgeone",
  "description": "Deployment mode configuration: 'local' for development with navigate, 'edgeone' for Tencent Cloud EdgeOne deployment with window.location.href"
}
```

**Available Modes**:
- `local`: Use React Router's `navigate` for navigation (development mode)
- `edgeone`: Use `window.location.href` for navigation (EdgeOne deployment mode)

**Generated Output**: `src/config/deployment-config.ts`

---

### 2. generate-security-config.js

**Purpose**: Generate security configuration for the application.

**Usage**: Automatically runs during build process.

**Configuration File**: `public/config/security-config.json`

```json
{
  "disableF12": true,
  "disableViewSource": true,
  "disableDebugger": true,
  "disableSelection": false,
  "disableCopy": false,
  "disablePaste": false
}
```

**Configuration Options**:
- `disableF12`: Disable F12 key to open developer tools
- `disableViewSource`: Disable view source shortcuts (Ctrl+U, Ctrl+Shift+I)
- `disableDebugger`: Disable debugger detection
- `disableSelection`: Disable text selection on the page
- `disableCopy`: Disable copy functionality
- `disablePaste`: Disable paste functionality

**Generated Output**: `src/config/security-config.ts`

---

### 3. check-friends-connectivity.js

**Purpose**: Check the connectivity status of friend links and update their online/offline status.

**Usage**: Automatically runs during build process.

**Configuration File**: `public/data/friends.json`

```json
{
  "title": "友链",
  "subtitle": "我的朋友们",
  "description": "这里是一些我很欣赏的博客和网站",
  "categories": [
    {
      "id": "tech",
      "name": "技术",
      "icon": "Code",
      "description": "技术博客和项目"
    }
  ],
  "friends": [
    {
      "id": "friend1",
      "name": "Friend Name",
      "url": "https://example.com",
      "icon": "https://example.com/icon.png",
      "description": "Friend description",
      "category": "tech",
      "featured": true
    }
  ]
}
```

**Friend Object Properties**:
- `id`: Unique identifier for the friend
- `name`: Display name
- `url`: Website URL (will be checked for connectivity)
- `icon`: Icon URL
- `description`: Description text
- `category`: Category ID (must match a category in `categories`)
- `featured`: Whether to feature this friend

**Generated Output**: Updates `public/data/friends.json` with `status` field added to each friend (`online` or `offline`)

---

### 4. generate-blog-tags.js

**Purpose**: Generate blog tags from all blog posts.

**Usage**: Automatically runs during build process.

**Input**: Reads all markdown files from `public/blog/posts/`

**Blog Post Frontmatter Format**:

```markdown
---
title: "Blog Post Title"
date: "2026-02-08"
description: "Post description"
tags: ["React", "TypeScript", "Tutorial"]
featured: true
---
```

**Generated Output**: `public/blog/tags.json`

```json
{
  "tags": [
    {
      "name": "React",
      "count": 5
    },
    {
      "name": "TypeScript",
      "count": 3
    }
  ],
  "total": 8,
  "generatedAt": "2026-02-08T00:00:00.000Z"
}
```

---

### 5. generate-blog-archive.js

**Purpose**: Generate blog archive by month and create index files.

**Usage**: Automatically runs during build process.

**Input**: Reads all markdown files from `public/blog/posts/`

**Blog Post Frontmatter Format**:

```markdown
---
title: "Blog Post Title"
date: "2026-02-08"
description: "Post description"
tags: ["React", "TypeScript"]
featured: true
---
```

**Generated Outputs**:
1. `public/blog/index.json` - Main index with featured posts
2. `public/blog/archive.json` - Archive summary by month
3. `public/blog/archives/index-YYYY-MM.json` - Monthly index files

**Archive Structure**:

```json
{
  "months": [
    "2026-02",
    "2025-02"
  ],
  "total": 15,
  "generatedAt": "2026-02-08T00:00:00.000Z"
}
```

**Monthly Index Structure**:

```json
{
  "month": "2026-02",
  "posts": [
    {
      "slug": "post-slug",
      "title": "Post Title",
      "date": "2026-02-08",
      "description": "Description",
      "tags": ["React", "TypeScript"],
      "featured": true
    }
  ],
  "count": 5,
  "generatedAt": "2026-02-08T00:00:00.000Z"
}
```

---

### 6. generate-notes-archive.js

**Purpose**: Generate notes archive by month.

**Usage**: Automatically runs during build process.

**Input**: Reads all markdown files from `public/notes/posts/`

**Note Post Frontmatter Format**:

```markdown
---
title: "Note Title"
date: "2026-02-08 14:30"
mood: "happy"
---
```

**Mood Options**:
- `happy`: Happy mood (green icon)
- `neutral`: Neutral mood (yellow icon)
- `sad`: Sad mood (red icon)

**Generated Outputs**:
1. `public/notes/archive.json` - Archive summary by month
2. `public/notes/archives/index-YYYY-MM.json` - Monthly index files

**Archive Structure**:

```json
{
  "months": [
    "2026-02",
    "2025-02"
  ],
  "total": 20,
  "generatedAt": "2026-02-08T00:00:00.000Z"
}
```

**Monthly Index Structure**:

```json
{
  "month": "2026-02",
  "notes": [
    {
      "id": "note-id",
      "slug": "note-slug",
      "title": "Note Title",
      "date": "2026-02-08",
      "mood": "happy",
      "content": "Note content preview..."
    }
  ],
  "count": 10,
  "generatedAt": "2026-02-08T00:00:00.000Z"
}
```

---

### 7. generate-feeds.js

**Purpose**: Generate RSS 2.0, Atom, and JSON Feed for blog subscription.

**Usage**: Automatically runs during build process.

**Input**: Reads blog posts from `public/blog/archives/index-YYYY-MM.json`

**Site Data**: Reads site information from `public/data/site-data.json`

**Generated Outputs**:
1. `public/feed.xml` - RSS 2.0 feed
2. `public/atom.xml` - Atom feed
3. `public/feed.json` - JSON Feed

**Feed URLs**:
- RSS 2.0: `https://sakurain.tech/feed.xml`
- Atom: `https://sakurain.tech/atom.xml`
- JSON Feed: `https://sakurain.tech/feed.json`

**Feed Auto-discovery**: The following `<link>` tags are automatically added to `index.html`:

```html
<link rel="alternate" type="application/rss+xml" title="SAKURAIN 博客 (RSS 2.0)" href="/feed.xml" />
<link rel="alternate" type="application/atom+xml" title="SAKURAIN 博客 (Atom)" href="/atom.xml" />
<link rel="alternate" type="application/feed+json" title="SAKURAIN 博客 (JSON Feed)" href="/feed.json" />
```

**RSS 2.0 Structure**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SAKURAIN 博客</title>
    <link>https://sakurain.tech</link>
    <description>...</description>
    <item>
      <title>Post Title</title>
      <link>https://sakurain.tech/blog/slug</link>
      <pubDate>...</pubDate>
      <category>Tag</category>
    </item>
  </channel>
</rss>
```

**JSON Feed Structure**:

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "SAKURAIN 博客",
  "items": [
    {
      "id": "https://sakurain.tech/blog/slug",
      "title": "Post Title",
      "date_published": "2026-02-08T00:00:00.000Z",
      "tags": ["React", "TypeScript"]
    }
  ]
}
```

---

## Manual Execution

You can run any script individually using Node.js:

```bash
# Generate deployment configuration
node scripts/generate-deployment-config.js

# Generate security configuration
node scripts/generate-security-config.js

# Check friends connectivity
node scripts/check-friends-connectivity.js

# Generate blog tags
node scripts/generate-blog-tags.js

# Generate blog archive
node scripts/generate-blog-archive.js

# Generate notes archive
node scripts/generate-notes-archive.js

# Generate blog feeds (RSS/Atom/JSON)
node scripts/generate-feeds.js
```

---

## Configuration Files Location

All configuration files are located in the `public/config/` directory:

- `deployment.json` - Deployment mode configuration
- `security-config.json` - Security features configuration

---

## Data Files Location

Data files are located in the `public/data/` directory:

- `site-data.json` - Site-wide configuration
- `friends.json` - Friends links data
- `docs.json` - Documentation structure

---

## Content Files Location

Content files are organized as follows:

- `public/blog/posts/` - Blog post markdown files
- `public/notes/posts/` - Note markdown files

---

## Error Handling

All scripts include error handling and will:
- Display error messages in red with ✘ prefix
- Exit with non-zero status code on failure
- Provide helpful error messages for common issues

---

## Build Integration

All scripts are automatically executed during the build process defined in `package.json`:

```json
{
  "scripts": {
    "build": "node scripts/generate-deployment-config.js && node scripts/generate-security-config.js && node scripts/check-friends-connectivity.js && node scripts/generate-blog-tags.js && node scripts/generate-blog-archive.js && node scripts/generate-notes-archive.js && node scripts/generate-feeds.js && tsc -b && vite build"
  }
}
```

---

## Notes

- All generated files should not be manually edited as they will be overwritten on the next build
- Configuration files in `public/config/` should be edited to change behavior
- Scripts use ES modules syntax (`import`/`export`)
- Generated TypeScript files are type-safe and include proper type definitions
