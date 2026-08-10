/**
 * Client-side persistent cache for COS-hosted music assets.
 *
 * Stores audio files, cover images and lyric text in IndexedDB so repeat visits
 * do not re-download the same resources from Tencent COS. The cache enforces
 * per-type size limits and evicts the oldest entries with a simple LRU policy.
 *
 * Only external HTTP(S) URLs are cached; local paths are passed through.
 */

const DB_NAME = 'sakurain-asset-cache';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const LIMITS = {
  audio: 200 * 1024 * 1024,
  cover: 20 * 1024 * 1024,
  lyrics: 1 * 1024 * 1024,
};

interface CacheEntry {
  url: string;
  type: 'audio' | 'cover' | 'lyrics';
  blob?: Blob;
  text?: string;
  etag?: string;
  lastModified?: string;
  size: number;
  cachedAt: number;
}

const blobUrlToOriginalSrc = new Map<string, string>();

/**
 * Cached CORS compatibility results per page origin. Used as a temporary
 * workaround when the CDN returns a fixed Access-Control-Allow-Origin that
 * does not match the current development or preview domain.
 */
const corsSupportedByOrigin = new Map<string, boolean>();

/**
 * Reference-counted set of original URLs that are currently in use by the
 * player. Protected assets are skipped during LRU eviction so the track being
 * played (and the one being preloaded) are never deleted from IndexedDB.
 */
const protectedUrlRefs = new Map<string, number>();

/**
 * Mark an asset URL as currently in use. Calls are reference-counted so the
 * same URL can be protected by both the current track and the preload track.
 */
export function protectAsset(url: string): void {
  if (!url) return;
  protectedUrlRefs.set(url, (protectedUrlRefs.get(url) || 0) + 1);
}

/**
 * Remove one protection reference for an asset URL. Once the count reaches
 * zero the URL becomes eligible for LRU eviction again.
 */
export function unprotectAsset(url: string): void {
  if (!url) return;
  const count = protectedUrlRefs.get(url) || 0;
  if (count <= 1) {
    protectedUrlRefs.delete(url);
  } else {
    protectedUrlRefs.set(url, count - 1);
  }
}

/**
 * True for external HTTP(S) URLs that should be cached.
 */
function isCacheable(url: string): boolean {
  return /^https:\/\//.test(url);
}

/**
 * Clear the cached CORS compatibility results. Called when the browser detects
 * a network change so the next track can re-probe the CDN headers.
 */
export function clearCorsProbeCache(): void {
  corsSupportedByOrigin.clear();
}

/**
 * Probe whether the CDN serves CORS headers compatible with the current page
 * origin. This is a temporary workaround for CDNs that return a fixed
 * Access-Control-Allow-Origin value. Results are cached per origin for the
 * lifetime of the page session.
 */
export async function isCorsSupported(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !isCacheable(url)) return true;

  const origin = window.location.origin;
  const cached = corsSupportedByOrigin.get(origin);
  if (cached !== undefined) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      credentials: 'omit',
      mode: 'cors',
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    const acao = response.headers.get('Access-Control-Allow-Origin');
    const supported = acao === '*' || acao === origin;
    corsSupportedByOrigin.set(origin, supported);
    return supported;
  } catch {
    // A CORS error or network failure means we cannot rely on cross-origin
    // headers for this origin. Fall back to no-cors media playback.
    corsSupportedByOrigin.set(origin, false);
    return false;
  }
}

// Re-probe CORS compatibility after the browser reconnects so a different
// network path or CDN edge node is re-evaluated before the next track loads.
if (typeof window !== 'undefined') {
  window.addEventListener('online', clearCorsProbeCache);
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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('type', 'type', { unique: false });
      }
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
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Retrieve a single cache entry by its original URL.
 */
async function getEntry(url: string): Promise<CacheEntry | undefined> {
  try {
    return await withStore('readonly', (store) => store.get(url));
  } catch {
    return undefined;
  }
}

/**
 * Persist a cache entry to IndexedDB.
 */
async function putEntry(entry: CacheEntry): Promise<void> {
  await ensureSpace(entry.type, entry.size);
  await withStore('readwrite', (store) => store.put(entry));
}

/**
 * Delete a single cache entry.
 */
async function deleteEntry(url: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(url));
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
    // Skip assets that are currently loaded or being preloaded by the player.
    if (protectedUrlRefs.has(entry.url)) continue;
    await deleteEntry(entry.url);
    total -= entry.size || 0;
  }

  if (total + needed > limit) {
    throw new Error(`Unable to make enough room in ${type} cache`);
  }
}

type ValidationResult =
  | { kind: 'refreshed'; entry: CacheEntry }
  | { kind: 'response'; response: Response }
  | undefined;

/**
 * Fetch an external asset with conditional validation. Returns the existing
 * entry refreshed when the server responds 304 Not Modified, otherwise the
 * full 200 response so the caller can store the new body.
 */
async function fetchWithValidation(url: string, existing?: CacheEntry): Promise<ValidationResult> {
  const headers: HeadersInit = {};
  if (existing?.etag) {
    headers['If-None-Match'] = existing.etag;
  } else if (existing?.lastModified) {
    headers['If-Modified-Since'] = existing.lastModified;
  }

  const response = await fetch(url, { credentials: 'omit', headers });
  if (response.status === 304 && existing) {
    return { kind: 'refreshed', entry: { ...existing, cachedAt: Date.now() } };
  }
  if (!response.ok) return undefined;
  return { kind: 'response', response };
}

/**
 * Fetch an external asset and store it in IndexedDB. Uses the existing entry
 * for a 304 Not Modified response to avoid re-downloading unchanged assets.
 */
async function fetchAndCache(
  url: string,
  type: 'audio' | 'cover',
  existing?: CacheEntry
): Promise<CacheEntry | undefined> {
  const hasUsableContent = existing?.blob && existing.blob.size > 0;
  const fetched = await fetchWithValidation(url, hasUsableContent ? existing : undefined);
  if (!fetched) return undefined;

  if (fetched.kind === 'refreshed') {
    await putEntry(fetched.entry);
    return fetched.entry;
  }

  const blob = await fetched.response.blob();
  const entry: CacheEntry = {
    url,
    type,
    blob,
    etag: fetched.response.headers.get('etag') || undefined,
    lastModified: fetched.response.headers.get('last-modified') || undefined,
    size: blob.size,
    cachedAt: Date.now(),
  };
  await putEntry(entry);
  return entry;
}

/**
 * Check whether a cached entry has exceeded the 30-day TTL.
 * Failures are treated as "not expired" so the cache remains usable.
 */
function isCacheExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.cachedAt > CACHE_TTL_MS;
}

/**
 * Register a blob URL so audio source comparisons can map it back to the
 * original CDN URL.
 */
export function registerBlobUrl(blobUrl: string, originalUrl: string): void {
  blobUrlToOriginalSrc.set(blobUrl, originalUrl);
}

/**
 * Revoke a blob URL and remove its original-URL mapping.
 */
export function revokeBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl);
  blobUrlToOriginalSrc.delete(blobUrl);
}

/**
 * Resolve a possibly-blob URL back to its original URL.
 */
export function resolveOriginalSrc(src: string): string {
  return blobUrlToOriginalSrc.get(src) || src;
}

/**
 * Return a cached blob URL for an audio file, or the original URL if the file
 * is not cached yet. Cached files are reused for 30 days and refreshed after
 * the TTL expires.
 */
export async function getCachedAudioUrl(src: string): Promise<string> {
  if (!src || typeof window === 'undefined' || !isCacheable(src)) return src;
  try {
    const entry = await getEntry(src);
    if (entry?.blob) {
      const expired = isCacheExpired(entry);
      if (!expired) {
        const blobUrl = URL.createObjectURL(entry.blob);
        registerBlobUrl(blobUrl, src);
        return blobUrl;
      }
    }
    const newEntry = await fetchAndCache(src, 'audio', entry);
    if (newEntry?.blob) {
      const blobUrl = URL.createObjectURL(newEntry.blob);
      registerBlobUrl(blobUrl, src);
      return blobUrl;
    }
    return src;
  } catch {
    return src;
  }
}

/**
 * Return the raw lyric text for a URL, fetching and caching it if needed.
 * Cached lyrics are reused for 30 days and refreshed after the TTL expires.
 */
export async function getCachedLyrics(url: string | undefined | null): Promise<string | null> {
  if (!url || typeof window === 'undefined' || !isCacheable(url)) {
    if (!url) return null;
    try {
      const response = await fetch(url, { credentials: 'omit' });
      return response.ok ? await response.text() : null;
    } catch {
      return null;
    }
  }

  try {
    const entry = await getEntry(url);
    if (entry?.text !== undefined) {
      const expired = isCacheExpired(entry);
      if (!expired) return entry.text;
    }

    const hasUsableContent = entry?.text !== undefined;
    const fetched = await fetchWithValidation(url, hasUsableContent ? entry : undefined);
    if (!fetched) return null;

    if (fetched.kind === 'refreshed') {
      await putEntry(fetched.entry);
      return fetched.entry.text ?? null;
    }

    const text = await fetched.response.text();
    await putEntry({
      url,
      type: 'lyrics',
      text,
      etag: fetched.response.headers.get('etag') || undefined,
      lastModified: fetched.response.headers.get('last-modified') || undefined,
      size: new Blob([text]).size,
      cachedAt: Date.now(),
    });
    return text;
  } catch {
    return null;
  }
}

/**
 * Return a cached blob URL for a cover image, or the original URL if the image
 * is not cached yet. Cached covers are reused for 30 days and refreshed after
 * the TTL expires.
 */
export async function getCachedCoverUrl(url: string | undefined | null): Promise<string> {
  if (!url || typeof window === 'undefined' || !isCacheable(url)) return url || '';
  try {
    const entry = await getEntry(url);
    if (entry?.blob) {
      const expired = isCacheExpired(entry);
      if (!expired) {
        const blobUrl = URL.createObjectURL(entry.blob);
        registerBlobUrl(blobUrl, url);
        return blobUrl;
      }
    }
    const newEntry = await fetchAndCache(url, 'cover', entry);
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
