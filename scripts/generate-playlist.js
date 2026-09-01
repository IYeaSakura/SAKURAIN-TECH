import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const MUSIC_DIR = path.join(PROJECT_ROOT, 'public', 'music', 'mp3');
const LYRIC_DIR = path.join(PROJECT_ROOT, 'public', 'music', 'lyric');
const COVER_DIR = path.join(PROJECT_ROOT, 'public', 'music', 'music-covers');
const PLAYLIST_PATH = path.join(PROJECT_ROOT, 'content', 'data', 'playlist.json');

const STATIC_SITE_DIR = path.join(PROJECT_ROOT, 'dist-music');
const STATIC_MP3_DIR = path.join(STATIC_SITE_DIR, 'music', 'mp3');
const STATIC_LYRIC_DIR = path.join(STATIC_SITE_DIR, 'music', 'lyric');
const STATIC_COVER_DIR = path.join(STATIC_SITE_DIR, 'music', 'music-covers');

const CDN_BASE_URL = (process.env.MUSIC_CDN_BASE_URL || 'https://music.sakurain.net/music').replace(/\/$/, '');
const CDN_MP3_PATH = '/mp3/';
const CDN_LYRIC_PATH = '/lyric/';
const CDN_COVERS_PATH = '/music-covers/';

/**
 * Ensure a directory exists, creating it recursively if necessary.
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Parse a filename in the form "Artist - Title.mp3" into artist and title.
 * Falls back to using the whole basename as the title when the delimiter is missing.
 */
function parseFilename(basename) {
  const separator = ' - ';
  if (basename.includes(separator)) {
    const [artist, ...titleParts] = basename.split(separator);
    return { artist: artist.trim(), title: titleParts.join(separator).trim() };
  }
  return { artist: 'Unknown Artist', title: basename.trim() };
}

/**
 * Parse an LRC file into a JSON lyrics array.
 * Supports multiple time tags on the same line and ignores metadata tags.
 */
function parseLrc(lrcPath) {
  const content = fs.readFileSync(lrcPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match all [mm:ss.xx] or [mm:ss.xxx] time tags at the start of the line.
    const timeTagPattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    const timeMatches = [...trimmed.matchAll(timeTagPattern)];
    if (timeMatches.length === 0) continue;

    const text = trimmed.replace(timeTagPattern, '').trim();
    for (const match of timeMatches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + centis / 1000;
      entries.push({ time, text });
    }
  }

  return entries.sort((a, b) => a.time - b.time);
}

/**
 * Determine a file extension for an embedded cover picture based on its MIME type.
 */
function getCoverExtension(format) {
  if (!format) return 'jpg';
  const mime = format.toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

/**
 * Build the external CDN URL for a cover file name.
 */
function buildCoverUrl(coverName) {
  return `${CDN_BASE_URL}${CDN_COVERS_PATH}${encodeURIComponent(coverName)}`;
}

/**
 * Look for an existing cover file in the local covers directory.
 * Returns its extension, or null when no matching file is found.
 */
function findExistingCoverExtension(basename) {
  if (!fs.existsSync(COVER_DIR)) return null;

  const entries = fs.readdirSync(COVER_DIR);
  const coverFile = entries.find(
    (name) => name.startsWith(`${basename}.`) && !name.toLowerCase().endsWith('.lrc')
  );

  return coverFile ? path.extname(coverFile).slice(1) : null;
}

/**
 * Extract the first embedded picture from an MP3 and write it to the cover directory.
 * Falls back to a pre-existing local cover file when no embedded picture is found.
 * Returns the external CDN URL, or null when no cover is available.
 */
async function extractCover(metadata, basename) {
  const pictures = metadata.common.picture;

  if (pictures && pictures.length > 0) {
    const picture = pictures[0];
    const ext = getCoverExtension(picture.format);
    const coverName = `${basename}.${ext}`;
    const coverPath = path.join(COVER_DIR, coverName);

    ensureDir(COVER_DIR);
    fs.writeFileSync(coverPath, picture.data);
    return buildCoverUrl(coverName);
  }

  const existingExt = findExistingCoverExtension(basename);
  if (existingExt) {
    return buildCoverUrl(`${basename}.${existingExt}`);
  }

  return null;
}

/**
 * Copy a file from src to dest if it exists, returning its size in bytes.
 */
function copyFileIfExists(src, dest) {
  if (!fs.existsSync(src)) return 0;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return fs.statSync(dest).size;
}

/**
 * Format a byte count as a human-readable string.
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Encode a path segment for use in a URL while preserving forward slashes.
 */
function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/%2F/g, '/');
}

/**
 * Generate a standalone static file-server site in dist-music. The directory
 * contains the mirrored media files and an index.html listing page suitable for
 * deployment to any static host or CDN.
 */
async function generateStaticSite(songs) {
  // Clean and recreate the static site directory so stale files from
  // previous runs (e.g. renamed covers or removed tracks) do not linger.
  if (fs.existsSync(STATIC_SITE_DIR)) {
    fs.rmSync(STATIC_SITE_DIR, { recursive: true, force: true });
  }
  ensureDir(STATIC_SITE_DIR);
  ensureDir(STATIC_MP3_DIR);
  ensureDir(STATIC_LYRIC_DIR);
  ensureDir(STATIC_COVER_DIR);

  const rows = [];

  for (const song of songs) {
    const mp3Src = path.join(MUSIC_DIR, `${song.id}.mp3`);
    const mp3Dest = path.join(STATIC_MP3_DIR, `${song.id}.mp3`);
    const mp3Size = copyFileIfExists(mp3Src, mp3Dest);

    const lrcSrc = path.join(LYRIC_DIR, `${song.id}.lrc`);
    const lrcDest = path.join(STATIC_LYRIC_DIR, `${song.id}.lrc`);
    const lrcSize = copyFileIfExists(lrcSrc, lrcDest);

    let coverFileName = null;
    let coverSize = 0;
    if (song.cover) {
      const coverUrl = new URL(song.cover);
      const coverNameEncoded = path.basename(coverUrl.pathname);
      coverFileName = decodeURIComponent(coverNameEncoded);
      const coverSrc = path.join(COVER_DIR, coverFileName);
      const coverDest = path.join(STATIC_COVER_DIR, coverFileName);
      coverSize = copyFileIfExists(coverSrc, coverDest);
    }

    const mp3Href = `music/mp3/${encodePathSegment(`${song.id}.mp3`)}`;
    const lrcHref = lrcSize
      ? `music/lyric/${encodePathSegment(`${song.id}.lrc`)}`
      : null;
    const coverHref = coverSize
      ? `music/music-covers/${encodePathSegment(coverFileName)}`
      : null;

    rows.push({
      ...song,
      mp3Href,
      mp3Size,
      lrcHref,
      lrcSize,
      coverHref,
      coverSize,
    });
  }

  const totalMp3Size = rows.reduce((sum, r) => sum + r.mp3Size, 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAKURAIN Music Mirror</title>
  <style>
    :root {
      --bg: #f4f4f0;
      --card: #ffffff;
      --text: #1a1a1a;
      --muted: #666666;
      --accent: #0e639c;
      --border: #1a1a1a;
      --shadow: #1a1a1a;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --card: #2a2a2a;
        --text: #f4f4f0;
        --muted: #aaaaaa;
        --accent: #4db8ff;
        --border: #444444;
        --shadow: #000000;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    header {
      max-width: 960px;
      margin: 0 auto 32px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: -0.5px;
    }
    .summary {
      color: var(--muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      gap: 16px;
      max-width: 960px;
      margin: 0 auto;
    }
    .card {
      background: var(--card);
      border: 2px solid var(--border);
      box-shadow: 4px 4px 0 var(--shadow);
      padding: 16px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .cover {
      width: 96px;
      height: 96px;
      object-fit: cover;
      border: 2px solid var(--border);
      background: var(--bg);
      flex-shrink: 0;
    }
    .cover.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }
    .info {
      flex: 1;
      min-width: 0;
    }
    .title {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
    }
    .artist {
      margin: 0 0 12px;
      color: var(--muted);
      font-size: 14px;
    }
    audio {
      width: 100%;
      height: 36px;
      margin-bottom: 12px;
    }
    .meta {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .links a {
      display: inline-block;
      padding: 4px 10px;
      border: 2px solid var(--border);
      background: var(--bg);
      color: var(--text);
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
    }
    .links a:hover {
      background: var(--accent);
      color: #fff;
    }
    footer {
      max-width: 960px;
      margin: 32px auto 0;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>SAKURAIN Music Mirror</h1>
    <div class="summary">${rows.length} tracks · ${formatFileSize(totalMp3Size)} total</div>
  </header>
  <main class="grid">
${rows
  .map(
    (row) => `    <article class="card">
      ${
        row.coverHref
          ? `<img class="cover" src="${row.coverHref}" alt="${escapeHtml(row.title)} cover" loading="lazy">`
          : `<div class="cover placeholder">No<br>Cover</div>`
      }
      <div class="info">
        <h2 class="title">${escapeHtml(row.title)}</h2>
        <div class="artist">${escapeHtml(row.artist)}</div>
        <audio controls preload="none" src="${row.mp3Href}"></audio>
        <div class="meta">
          MP3: ${formatFileSize(row.mp3Size)} ·
          ${row.lrcHref ? `Lyric: ${formatFileSize(row.lrcSize)} ·` : 'No lyric ·'}
          ${row.coverHref ? `Cover: ${formatFileSize(row.coverSize)}` : 'No cover'}
        </div>
        <div class="links">
          <a href="${row.mp3Href}" download>Download MP3</a>
          ${row.lrcHref ? `<a href="${row.lrcHref}" download>Download Lyric</a>` : ''}
          ${row.coverHref ? `<a href="${row.coverHref}" download>Download Cover</a>` : ''}
        </div>
      </div>
    </article>`,
  )
  .join('\n')}
  </main>
  <footer>Generated by SAKURAIN build tools · for static hosting or CDN</footer>
</body>
</html>
`;

  const indexPath = path.join(STATIC_SITE_DIR, 'index.html');
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`  ✓ Generated static music site at dist-music/ (${rows.length} tracks)`);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate content/data/playlist.json by scanning public/music/mp3 for MP3 files.
 * Audio, lyric and cover URLs point to the external CDN. Local media is
 * organised as public/music/{mp3,lyric,music-covers} and used as build material.
 */
async function generatePlaylist() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.log('  ⚠ public/music/mp3 directory not found, skipping playlist generation');
    return;
  }

  const files = fs
    .readdirSync(MUSIC_DIR)
    .filter((name) => name.toLowerCase().endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    console.log('  ⚠ No MP3 files found in public/music/mp3, writing empty playlist');
  }

  const songs = [];
  for (const file of files) {
    const filePath = path.join(MUSIC_DIR, file);
    const basename = path.basename(file, path.extname(file));

    const parsed = parseFilename(basename);
    let metadata;
    try {
      metadata = await parseFile(filePath);
    } catch (err) {
      console.warn(`  ⚠ Failed to read metadata for ${file}: ${err.message}`);
      metadata = { common: {} };
    }

    const title = metadata.common.title || parsed.title;
    const artist = metadata.common.artist || parsed.artist;
    const cover = await extractCover(metadata, basename);

    const lrcPath = path.join(LYRIC_DIR, `${basename}.lrc`);
    const hasLyrics = fs.existsSync(lrcPath);
    const lyricUrl = hasLyrics
      ? `${CDN_BASE_URL}${CDN_LYRIC_PATH}${encodeURIComponent(`${basename}.lrc`)}`
      : null;

    songs.push({
      id: basename,
      title,
      artist,
      src: `${CDN_BASE_URL}${CDN_MP3_PATH}${encodeURIComponent(file)}`,
      cover,
      lyricUrl,
    });
  }

  ensureDir(path.dirname(PLAYLIST_PATH));
  fs.writeFileSync(PLAYLIST_PATH, JSON.stringify({ songs }, null, 2), 'utf-8');
  console.log(`  ✓ Generated content/data/playlist.json (${songs.length} songs)`);

  await generateStaticSite(songs);
}

generatePlaylist().catch((err) => {
  console.error('Failed to generate playlist:', err);
  process.exit(1);
});
