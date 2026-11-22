/**
 * Client-side persistent cache for COS-hosted music assets.
 *
 * Stores audio files, cover images and lyric text in IndexedDB so assets are
 * downloaded from the CDN at most once. Cached entries are kept indefinitely
 * and reused on every subsequent visit, minimising CDN egress traffic. A size
 * cap per asset type and an LRU eviction policy protect browser storage. Audio
 * playback streams directly from the CDN on first visit while the file is
 * cached in the background; subsequent visits play from IndexedDB. Manual cache
 * clearing is exposed via clearAssetCache().
 */

const DB_NAME = 'sakurain-asset-cache';
const DB_VERSION = 2;
const STORE_NAME = 'assets';

const LIMITS = {
  audio: 512 * 1024 * 1024,
  cover: 20 * 1024 * 1024,
  lyrics: 1 * 1024 * 1024,
};

interface CacheEntry {
  key?: string;
  url: string;
  type: 'audio' | 'cover' | 'lyrics';
  blob?: Blob;
  text?: string;
  size: number;
  cachedAt: number;
}

const blobUrlToOriginalSrc = new Map<string, string>();

/**
 * Cache-key → blob URL. The player may need a playable URL synchronously inside
 * a user gesture (iOS only honours play() called in the gesture handler), so a
 * previously resolved blob URL is memoised here and reused by later lookups.
 */
const blobUrlByCacheKey = new Map<string, string>();

/**
 * Reference-counted set of original URLs that are currently in use by the
 * player. Protected assets are skipped during LRU eviction so the track being
 * played (and the one being preloaded) are never deleted from IndexedDB.
 */
const protectedUrlRefs = new Map<string, number>();

/**
 * Deduplicate concurrent downloads of the same audio path. The preload element
 * and the main player can request the same track at nearly the same time;
 * sharing one promise avoids downloading (and writing) it twice.
 */
const audioCacheInFlight = new Map<string, Promise<void>>();

/**
 * Mark an asset URL as currently in use. Calls are reference-counted so the
 * same URL can be protected by both the current track and the preload track.
 * Protection is keyed by the normalized asset path so CDN prefix changes do
 * not break the reference count.
 */
export function protectAsset(url: string): void {
  if (!url) return;
  const key = normalizeCacheKey(url);
  protectedUrlRefs.set(key, (protectedUrlRefs.get(key) || 0) + 1);
}

/**
 * Remove one protection reference for an asset URL. Once the count reaches
 * zero the URL becomes eligible for LRU eviction again.
 */
export function unprotectAsset(url: string): void {
  if (!url) return;
  const key = normalizeCacheKey(url);
  const count = protectedUrlRefs.get(key) || 0;
  if (count <= 1) {
    protectedUrlRefs.delete(key);
  } else {
    protectedUrlRefs.set(key, count - 1);
  }
}

/**
 * True for external HTTP(S) URLs that should be cached.
 */
function isCacheable(url: string): boolean {
  return /^https:\/\//.test(url);
}

/**
 * A cached audio blob must actually contain audio. CDNs sometimes answer a
 * missing file with a 200 text/html error page; caching that would make the
 * next play fail even though the entry looks "cached".
 */
function isPlayableAudioBlob(blob: Blob | undefined): blob is Blob {
  if (!blob || blob.size === 0) return false;
  const type = (blob.type || '').toLowerCase();
  if (!type) return true;
  return (
    type.startsWith('audio/') ||
    type === 'application/octet-stream' ||
    type === 'binary/octet-stream'
  );
}

/** Reject HTML error pages returned with an audio-looking URL. */
function isAudioContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const type = contentType.split(';', 1)[0].trim().toLowerCase();
  return (
    type.startsWith('audio/') ||
    type === 'application/octet-stream' ||
    type === 'binary/octet-stream'
  );
}

/** Same guard for cover images. */
function isUsableImageBlob(blob: Blob | undefined): blob is Blob {
  if (!blob || blob.size === 0) return false;
  const type = (blob.type || '').toLowerCase();
  if (!type) return true;
  return (
    type.startsWith('image/') ||
    type === 'application/octet-stream' ||
    type === 'binary/octet-stream'
  );
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const type = contentType.split(';', 1)[0].trim().toLowerCase();
  return (
    type.startsWith('image/') ||
    type === 'application/octet-stream' ||
    type === 'binary/octet-stream'
  );
}

/**
 * Known CDN mirrors that serve identical asset paths. If one host is down or
 * unreachable, the same path can be retried against the others. Cache keys are
 * normalized by pathname, so all mirrors share one cache entry.
 */
const CDN_FALLBACK_HOSTS = ['file.sakurain.net', 'music.sakurain.net', 'cos.sakurain.net'];

/**
 * Build an ordered list of URLs to try: the original first, then the same path
 * on every other known CDN host. Non-CDN or relative URLs are returned as-is.
 */
export function withCdnFallbacks(url: string): string[] {
  try {
    const parsed = new URL(url);
    if (!CDN_FALLBACK_HOSTS.includes(parsed.hostname)) return [url];
    const candidates = [url];
    for (const host of CDN_FALLBACK_HOSTS) {
      if (host === parsed.hostname) continue;
      const alt = new URL(parsed.toString());
      alt.hostname = host;
      candidates.push(alt.toString());
    }
    return candidates;
  } catch {
    return [url];
  }
}

/**
 * Fetch text, retrying the same path on mirror CDN hosts when the primary
 * fails. Returns null only when every candidate fails or is not ok.
 */
async function fetchTextWithFallback(url: string): Promise<string | null> {
  for (const candidate of withCdnFallbacks(url)) {
    try {
      const response = await fetch(candidate, { credentials: 'omit' });
      if (!response.ok) continue;
      const text = await response.text();
      if (text) return text;
    } catch {
      // Try the next mirror host.
    }
  }
  return null;
}

/**
 * Normalize a URL to a cache key based on the asset file path. Different CDN
 * base URLs that serve the same file (e.g. cos.sakurain.net/mp3/song.mp3 and
 * file.sakurain.net/music/mp3/song.mp3) share the same key, so switching the
 * CDN prefix does not invalidate the local cache.
 */
function normalizeCacheKey(url: string): string {
  if (typeof window === 'undefined') return url;
  try {
    const parsed = new URL(url, window.location.href);
    const pathname = parsed.pathname;
    const match = pathname.match(/\/(mp3|lyric|music-covers)\/.*$/);
    // Proxy endpoints such as /api/lyric?name=... rely on the query string to
    // identify the resource; dropping it would collapse every lyric into one
    // cache entry.
    return match ? match[0] : `${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Public resolver for the normalized cache key of a URL.
 */
export function resolveCacheKey(url: string): string {
  if (typeof window === 'undefined') return url;
  return normalizeCacheKey(url);
}

/**
 * Open the IndexedDB database and create the object store on first use.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        // Schema v2 switches the key from the full URL to the normalized asset
        // path. Drop the old store so entries are keyed consistently.
        db.deleteObjectStore(STORE_NAME);
      }
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      store.createIndex('type', 'type', { unique: false });
      store.createIndex('url', 'url', { unique: false });
    };
  });
}

/**
 * Execute a request against the asset object store.
 */
async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);
    let result!: T;
    let settled = false;

    const fail = (error: DOMException | null) => {
      if (settled) return;
      settled = true;
      reject(error ?? new Error('IndexedDB transaction failed'));
    };

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => fail(request.error);
    // Resolve only after the transaction commits. Resolving on request success
    // alone can report a write as complete before it is durably persisted,
    // which matters when the tab is closed immediately after caching.
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    transaction.onerror = () => fail(transaction.error);
    transaction.onabort = () => fail(transaction.error);
  });
}

/**
 * Retrieve a single cache entry by its original URL.
 */
async function getEntry(url: string): Promise<CacheEntry | undefined> {
  if (!url) return undefined;
  const key = normalizeCacheKey(url);
  try {
    return await withStore('readonly', (store) => store.get(key));
  } catch {
    return undefined;
  }
}

/**
 * Delete a single cache entry. Used when an existing entry is malformed
 * (for example an HTML error page cached as audio).
 */
async function deleteEntry(url: string): Promise<void> {
  if (!url) return;
  const key = normalizeCacheKey(url);
  try {
    await withStore('readwrite', (store) => store.delete(key));
  } catch {
    // Best-effort cleanup; a failed delete must not block playback.
  }
}

let persistenceRequested = false;

/**
 * Ask the browser to keep this origin's storage. Persistence is best-effort:
 * it reduces the chance that a cached track is evicted between visits.
 */
async function requestPersistentStorage(): Promise<void> {
  if (persistenceRequested || typeof navigator === 'undefined') return;
  persistenceRequested = true;
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted?.())) {
      await navigator.storage.persist();
    }
  } catch {
    // Browsers may deny persistence; the cache still works normally.
  }
}

/**
 * Persist a cache entry to IndexedDB.
 */
async function putEntry(entry: CacheEntry): Promise<void> {
  await ensureSpace(entry.type, entry.size);
  const keyedEntry = { ...entry, key: normalizeCacheKey(entry.url) };
  await withStore('readwrite', (store) => store.put(keyedEntry));
  // Ask for persistent storage after a successful write (i.e. after the user
  // has shown intent by playing a track).
  void requestPersistentStorage();
}

/**
 * List all cache entries of a given type.
 */
async function getEntriesByType(assetType: CacheEntry['type']): Promise<CacheEntry[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(assetType);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB index request failed'));
      request.onsuccess = () => resolve((request.result as CacheEntry[]) || []);
    });
  } catch {
    return [];
  }
}

/**
 * Evict the oldest entries of a type until there is room for the new asset.
 */
async function ensureSpace(type: CacheEntry['type'], needed: number): Promise<void> {
  const limit = LIMITS[type];
  const entries = await getEntriesByType(type);
  let total = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
  if (total + needed <= limit) return;

  entries.sort((a, b) => a.cachedAt - b.cachedAt);
  for (const entry of entries) {
    if (total + needed <= limit) break;
    if (!entry.key) continue;
    // Skip assets that are currently loaded or being preloaded by the player.
    if (protectedUrlRefs.has(entry.key)) continue;
    await withStore('readwrite', (store) => store.delete(entry.key!));
    total -= entry.size || 0;
  }

  if (total + needed > limit) {
    throw new Error(`Unable to make enough room in ${type} cache`);
  }
}

/**
 * Fetch an external asset and store it in IndexedDB.
 */
async function fetchAndCache(
  url: string,
  type: 'audio' | 'cover'
): Promise<CacheEntry | undefined> {
  let blob: Blob | undefined;
  for (const candidate of withCdnFallbacks(url)) {
    try {
      const response = await fetch(candidate, { credentials: 'omit' });
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type');
      if (type === 'audio' && !isAudioContentType(contentType)) continue;
      if (type === 'cover' && !isImageContentType(contentType)) continue;

      const candidateBlob = await response.blob();
      if (type === 'audio' && !isPlayableAudioBlob(candidateBlob)) continue;
      if (type === 'cover' && !isUsableImageBlob(candidateBlob)) continue;
      blob = candidateBlob;
      break;
    } catch {
      // Try the next mirror host.
    }
  }
  if (!blob || blob.size === 0) return undefined;

  const entry: CacheEntry = {
    url,
    type,
    blob,
    size: blob.size,
    cachedAt: Date.now(),
  };
  await putEntry(entry);
  return entry;
}

/**
 * Speculative downloads (background caching, next-track preload) are a
 * convenience; streaming is the requirement. On a metered or very slow
 * connection — which is the common case on phones — skip them so the player
 * does not burn data on a track the user may never hear.
 */
export function isPrefetchAllowed(): boolean {
  if (typeof navigator === 'undefined') return true;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  const type = connection.effectiveType;
  return type !== 'slow-2g' && type !== '2g';
}

/**
 * Download an audio file in the background and persist it to IndexedDB.
 * This does not block playback; the caller is expected to stream the file
 * directly from its original URL while caching happens asynchronously.
 */
async function cacheAudioInBackground(url: string): Promise<void> {
  if (!url || typeof window === 'undefined' || !isCacheable(url)) return;
  if (!isPrefetchAllowed()) return;

  const key = normalizeCacheKey(url);
  const inFlight = audioCacheInFlight.get(key);
  if (inFlight) return inFlight;

  const task = (async () => {
    try {
      const existing = await getEntry(url);
      if (isPlayableAudioBlob(existing?.blob)) return;

      // Remove malformed entries (e.g. an HTML error page cached previously)
      // before writing the fresh audio payload.
      if (existing) await deleteEntry(url);

      await fetchAndCache(url, 'audio');
    } catch {
      // Background caching is best-effort; playback is not affected.
    }
  })();

  audioCacheInFlight.set(key, task);
  try {
    await task;
  } finally {
    audioCacheInFlight.delete(key);
  }
}

/**
 * Register a blob URL so audio source comparisons can map it back to the
 * original CDN URL.
 */
export function registerBlobUrl(blobUrl: string, originalUrl: string): void {
  blobUrlToOriginalSrc.set(blobUrl, originalUrl);
  blobUrlByCacheKey.set(normalizeCacheKey(originalUrl), blobUrl);
}

/**
 * Revoke a blob URL and remove its original-URL mapping.
 */
export function revokeBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl);
  blobUrlToOriginalSrc.delete(blobUrl);
  for (const [key, value] of blobUrlByCacheKey) {
    if (value === blobUrl) blobUrlByCacheKey.delete(key);
  }
}

/**
 * Resolve a possibly-blob URL back to its original URL.
 */
export function resolveOriginalSrc(src: string): string {
  return blobUrlToOriginalSrc.get(src) || src;
}

export type AudioSource = 'local' | 'get' | 'direct';

interface CachedAudioResult {
  url: string;
  source: AudioSource;
}

/**
 * Look up an already cached audio blob without touching the network.
 *
 * Returns a memoised blob URL when the track is in IndexedDB, otherwise null.
 * Used to prepare a playable source *before* the user taps play, so the click
 * handler can start playback synchronously (required by iOS) while still
 * playing from the local cache.
 */
export async function peekCachedAudioUrl(src: string): Promise<string | null> {
  if (!src || typeof window === 'undefined' || !isCacheable(src)) return null;

  const key = normalizeCacheKey(src);
  const memoised = blobUrlByCacheKey.get(key);
  if (memoised) return memoised;

  try {
    const entry = await getEntry(src);
    if (!entry?.blob || !isPlayableAudioBlob(entry.blob)) return null;
    const blobUrl = URL.createObjectURL(entry.blob);
    registerBlobUrl(blobUrl, src);
    return blobUrl;
  } catch {
    return null;
  }
}

/**
 * Return a playable URL for an audio file and report how it was resolved.
 *
 * - If the file is already cached locally, a blob URL is returned and the UI
 *   shows "Local".
 * - If the file is not yet cached, the original CDN URL is returned so the
 *   browser can stream it via HTTP range requests. A background fetch is
 *   started to cache the file for subsequent visits, and the UI shows "GET".
 * - Non-HTTPS or unavailable sources fall back to the original URL and show
 *   "Direct".
 */
export async function getCachedAudioUrlWithSource(src: string): Promise<CachedAudioResult> {
  if (!src || typeof window === 'undefined' || !isCacheable(src)) {
    return { url: src, source: 'direct' };
  }
  try {
    const cachedUrl = await peekCachedAudioUrl(src);
    if (cachedUrl) return { url: cachedUrl, source: 'local' };

    // A malformed entry must not be reused on every play; drop it so the
    // background fetch can replace it with a valid audio blob.
    const entry = await getEntry(src);
    if (entry) await deleteEntry(src);

    // Stream from the original URL immediately; cache in the background so the
    // next visit can play from IndexedDB without another CDN round-trip.
    void cacheAudioInBackground(src);
    return { url: src, source: 'get' };
  } catch {
    return { url: src, source: 'direct' };
  }
}

/**
 * Backward-compatible wrapper that only returns the resolved URL.
 */
export async function getCachedAudioUrl(src: string): Promise<string> {
  const result = await getCachedAudioUrlWithSource(src);
  return result.url;
}

/** Reject HTML error pages and other non-LRC payloads before caching. */
function looksLikeLrc(text: string): boolean {
  return /\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/.test(text);
}

/**
 * Return the raw lyric text for a URL, fetching and caching it if needed.
 * Cached lyrics are reused indefinitely.
 */
export async function getCachedLyrics(url: string | undefined | null): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  if (!isCacheable(url)) {
    try {
      const response = await fetch(url, { credentials: 'omit' });
      if (!response.ok) return null;
      const text = await response.text();
      return looksLikeLrc(text) ? text : null;
    } catch {
      return null;
    }
  }

  try {
    const entry = await getEntry(url);
    if (entry?.text !== undefined && looksLikeLrc(entry.text)) return entry.text;

    // Try the primary host, then mirror CDNs. A single host outage must not
    // leave the track without lyrics.
    const text = await fetchTextWithFallback(url);
    if (!text || !looksLikeLrc(text)) return null;

    await putEntry({
      url,
      type: 'lyrics',
      text,
      size: new Blob([text]).size,
      cachedAt: Date.now(),
    });
    return text;
  } catch {
    return null;
  }
}

/**
 * Return a cached blob URL for a cover image, or fetch and cache it if the
 * image is not yet stored locally. Cached covers are reused indefinitely.
 */
export async function getCachedCoverUrl(url: string | undefined | null): Promise<string> {
  if (!url || typeof window === 'undefined' || !isCacheable(url)) return url || '';
  try {
    const entry = await getEntry(url);
    if (entry?.blob && isUsableImageBlob(entry.blob)) {
      const blobUrl = URL.createObjectURL(entry.blob);
      registerBlobUrl(blobUrl, url);
      return blobUrl;
    }
    if (entry) await deleteEntry(url);

    const newEntry = await fetchAndCache(url, 'cover');
    if (newEntry?.blob) {
      const blobUrl = URL.createObjectURL(newEntry.blob);
      registerBlobUrl(blobUrl, url);
      return blobUrl;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Clear the entire asset cache. Useful for a manual "refresh" action.
 */
export async function clearAssetCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(request.error ?? new Error('IndexedDB clear failed'));
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore cleanup failures
  }
}
