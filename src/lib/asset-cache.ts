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
  size: number;
  cachedAt: number;
}

const blobUrlToOriginalSrc = new Map<string, string>();

/**
 * True for external HTTP(S) URLs that should be cached.
 */
function isCacheable(url: string): boolean {
  return /^https?:\/\//.test(url);
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
    await deleteEntry(entry.url);
    total -= entry.size || 0;
  }
}

/**
 * Fetch an external asset and store it in IndexedDB.
 */
async function fetchAndCache(url: string, type: 'audio' | 'cover'): Promise<void> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) return;
  const blob = await response.blob();
  await putEntry({
    url,
    type,
    blob,
    size: blob.size,
    cachedAt: Date.now(),
  });
}

/**
 * Register a blob URL so audio source comparisons can map it back to the
 * original COS URL.
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
 * is not cached yet. Uncached files are fetched in the background.
 */
export async function getCachedAudioUrl(src: string): Promise<string> {
  if (!src || typeof window === 'undefined' || !isCacheable(src)) return src;
  try {
    const entry = await getEntry(src);
    if (entry?.blob) {
      const blobUrl = URL.createObjectURL(entry.blob);
      registerBlobUrl(blobUrl, src);
      return blobUrl;
    }
    fetchAndCache(src, 'audio').catch(() => {});
    return src;
  } catch {
    return src;
  }
}

/**
 * Return the raw lyric text for a URL, fetching and caching it if needed.
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
    if (entry?.text !== undefined) return entry.text;

    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) return null;
    const text = await response.text();
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
 * Return a cached blob URL for a cover image, or the original URL if the image
 * is not cached yet. Uncached images are fetched in the background.
 */
export async function getCachedCoverUrl(url: string | undefined | null): Promise<string> {
  if (!url || typeof window === 'undefined' || !isCacheable(url)) return url || '';
  try {
    const entry = await getEntry(url);
    if (entry?.blob) {
      const blobUrl = URL.createObjectURL(entry.blob);
      registerBlobUrl(blobUrl, url);
      return blobUrl;
    }
    fetchAndCache(url, 'cover').catch(() => {});
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
