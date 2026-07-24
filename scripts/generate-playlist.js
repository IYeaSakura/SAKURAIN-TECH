import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const MUSIC_DIR = path.join(PROJECT_ROOT, 'public', 'music');
const LYRIC_DIR = path.join(MUSIC_DIR, 'Lyric');
const COVER_DIR = path.join(PROJECT_ROOT, 'public', 'image', 'music-covers');
const PLAYLIST_PATH = path.join(PROJECT_ROOT, 'content', 'data', 'playlist.json');

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
 * Extract the first embedded picture from an MP3 and write it to the cover directory.
 * Returns the public URL path, or null when no picture is found.
 */
async function extractCover(metadata, basename) {
  const pictures = metadata.common.picture;
  if (!pictures || pictures.length === 0) return null;

  const picture = pictures[0];
  const ext = getCoverExtension(picture.format);
  const coverName = `${basename}.${ext}`;
  const coverPath = path.join(COVER_DIR, coverName);

  ensureDir(COVER_DIR);
  fs.writeFileSync(coverPath, picture.data);
  return `/image/music-covers/${coverName}`;
}

/**
 * Generate content/data/playlist.json by scanning public/music for MP3 files.
 * Metadata, embedded cover art and LRC lyrics are read from the filesystem.
 */
async function generatePlaylist() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.log('  ⚠ public/music directory not found, skipping playlist generation');
    return;
  }

  const files = fs
    .readdirSync(MUSIC_DIR)
    .filter((name) => name.toLowerCase().endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    console.log('  ⚠ No MP3 files found in public/music, writing empty playlist');
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
    const lyrics = fs.existsSync(lrcPath) ? parseLrc(lrcPath) : [];

    songs.push({
      id: basename,
      title,
      artist,
      src: `/music/${file}`,
      cover,
      lyrics,
    });
  }

  ensureDir(path.dirname(PLAYLIST_PATH));
  fs.writeFileSync(PLAYLIST_PATH, JSON.stringify({ songs }, null, 2), 'utf-8');
  console.log(`  ✓ Generated content/data/playlist.json (${songs.length} songs)`);
}

generatePlaylist().catch((err) => {
  console.error('Failed to generate playlist:', err);
  process.exit(1);
});
