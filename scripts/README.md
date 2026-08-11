# Scripts Documentation

This directory contains custom scripts for the SAKURAIN-TECH Next.js project. They are orchestrated by `package.json` during the build process or run manually for auxiliary maintenance tasks.

For the main project documentation, see [README.md](../README.md) or [README_zh.md](../README_zh.md).

## Build Process

The npm build workflow is defined in `package.json` and runs the following steps automatically:

```bash
npm run build
```

1. `node scripts/generate-playlist.js`
   - Scans `public/music/mp3/`, `public/music/lyric/` and `public/music/music-covers/`.
   - Writes `content/data/playlist.json` with external COS URLs for audio, lyrics and cover art.

2. `node scripts/sync-content-to-public.js`
   - Copies all managed content from `content/` to `public/` so the static build can consume it.
   - Managed paths include `content/data/*`, `content/docs/*`, `content/config/*`, and `content/resume/*`.
   - Generates `public/data/docs.json` from `content/docs-index.json`; the index stores only metadata and file names, while the script fills in public paths.
   - Validates that every file referenced by `content/docs-index.json` exists under `content/docs` and warns about missing entries.
   - Preserves auto-generated friend link check info in `public/data/friends.json` when possible.
   - Auto-completes `process.steps[*].id` and `services[*].details.sections[*].total` in `site-data.json`.

3. `node scripts/check-friends-connectivity.js`
   - Checks the connectivity of friend links listed in `public/data/friends.json` and updates their `status` and `checkInfo` fields.
   - Uses multi-threaded workers and URL deduplication to avoid redundant HTTP checks.
   - Skips the check automatically when `SKIP_FRIEND_CHECK=true`.
   - Runs before `next build` so the friends page reflects the latest statuses.

4. `node scripts/build-next.js`
   - Wraps `next build` with `--max-old-space-size=3072` to avoid OOM on large builds.
   - Exports static pages and feeds to `dist/`.
   - Copies `.next/BUILD_ID`, `required-server-files.json`, and `export-detail.json` into `dist/` and adjusts paths for EdgeOne Pages.
   - In CI environments, removes the `.next` directory after the export to free tmpfs space.

5. `node scripts/submit-sitemap.js`
   - Submits the generated sitemap to search engines.
   - Supports Bing (primary via `BING_API_KEY`), Baidu (via `BAIDU_PUSH_TOKEN`), and Google Search Console (via `GOOGLE_SERVICE_ACCOUNT_JSON`).
   - Reads `dist/sitemap.xml` first, falling back to `.next/server/app/sitemap.xml.body` or `public/sitemap.xml` for legacy setups.

To skip all build scripts and run only `next build`, use:

```bash
npm run build:fast
```

## Auxiliary Scripts

### 1. `generate-playlist.js`

**Purpose**: Keep the music playlist JSON in sync with the files in `public/music/` while pointing the player at the external COS bucket.

**Usage**: Automatically runs as the first step of `npm run build`, or manually:

```bash
node scripts/generate-playlist.js
```

**Input**: Local media arranged as three sibling directories under `public/music/`:
- `public/music/mp3/` — audio files
- `public/music/lyric/` — `.lrc` lyric files
- `public/music/music-covers/` — optional cover image files (also auto-populated by extracting embedded covers from MP3s)

These files remain local as build-time material but are not committed.

**Output**: `content/data/playlist.json` with:
- `src`: external audio URL (`https://cos.sakurain.net/mp3/<url-encoded filename>`)
- `lyricUrl`: external lyric URL (`https://cos.sakurain.net/lyric/<url-encoded filename>.lrc`)
- `cover`: external cover URL (`https://cos.sakurain.net/music-covers/<url-encoded filename>.<ext>`)

---

### 2. `sync-content-to-public.js`

**Purpose**: Copy managed content from `content/` to `public/` before the static build, and generate derived catalogs that are not stored in `content/`.

**Usage**: Automatically runs as the first step of `npm run build`.

**Input**: `content/data/*`, `content/docs/*`, `content/config/*`, `content/resume/*`, plus `content/docs-index.json`.

**Output**: Corresponding paths under `public/`. `public/data/docs.json` is generated from `content/docs-index.json`. All generated files are listed in `.gitignore` and should not be edited directly.

**Validation**: After generating `public/data/docs.json`, the script verifies that every file referenced by `content/docs-index.json` exists under `content/docs`. Missing files are reported with warnings so broken links can be fixed before the static build.

---

### 3. `check-friends-connectivity.js`

**Purpose**: Check the connectivity status of friend links and update their online/offline/maintenance status.

**Usage**: Automatically runs during `npm run build`. Skipped when `SKIP_FRIEND_CHECK=true`.

**Input**: `public/data/friends.json`

**Output**: Updates `public/data/friends.json` with `status` and `checkInfo` fields for each friend entry.

**Optimizations**:
- Normalizes URLs and groups friend entries by normalized URL to avoid duplicate checks.
- Distributes checks across `worker_threads` workers (capped by CPU count and friend count).
- Falls back to `curl` when Node.js HTTP requests fail.

---

### 4. `build-next.js`

**Purpose**: Wrap `next build` for the EdgeOne Pages static-export workflow.

**Usage**: Automatically runs as the fourth step of `npm run build`.

**What it does**:
- Runs `next build` with increased Node heap memory.
- Copies required EdgeOne metadata files from `.next/` into `dist/`.
- Adjusts paths inside `export-detail.json` and `required-server-files.json` to match the `dist/` layout.
- Removes `.next` in CI to avoid ENOSPC on tmpfs builds.

---

### 5. `submit-sitemap.js`

**Purpose**: Submit sitemap URLs to search engines. Primary engine is Bing; Baidu and Google Search Console are also supported.

**Usage**: Automatically runs as the final step of `npm run build`, or manually:

```bash
# Submit to Bing (primary)
BING_API_KEY=<key> node scripts/submit-sitemap.js

# Submit to multiple engines
SEARCH_ENGINE_SUBMIT=bing,baidu,google BING_API_KEY=<key> BAIDU_PUSH_TOKEN=<token> GOOGLE_SERVICE_ACCOUNT_JSON='{...}' node scripts/submit-sitemap.js
```

**Input**: `dist/sitemap.xml` (generated by static export). Falls back to `.next/server/app/sitemap.xml.body` or `public/sitemap.xml` for legacy setups.

**Environment Variables**:
- `BING_API_KEY`: Bing Webmaster URL Submission API key (required for Bing).
- `BAIDU_PUSH_TOKEN`: Baidu push token (required for Baidu).
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Google service-account JSON string with `client_email` and `private_key` (required for Google).
- `SEARCH_ENGINE_SUBMIT`: Comma-separated list of engines (default: `bing,baidu`).

## Build Integration

The automatic build integration is defined in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "node scripts/generate-playlist.js && node scripts/sync-content-to-public.js && node scripts/check-friends-connectivity.js && node scripts/build-next.js && node scripts/submit-sitemap.js",
    "build:fast": "next build",
    "generate-playlist": "node scripts/generate-playlist.js",
    "submit-sitemap": "node scripts/submit-sitemap.js",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## Notes

- Scripts use ES modules syntax (`import`/`export`). `"type": "module"` is set in `package.json`.
- The `&&` chain in the `build` script ensures that each step succeeds before the next one starts. If a step fails, npm exits with a non-zero status code and prints the error.
- `submit-sitemap.js` is intentionally placed after `next build` because it depends on the generated sitemap output.
- `public/data/friends.json` is generated from `content/data/friends.json`. Friend link statuses are overwritten by `check-friends-connectivity.js` on every full build, so always edit the source file under `content/`.
