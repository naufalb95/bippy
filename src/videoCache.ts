// LRU cache for remote flashcard videos.
//
// What it does:
//   - Downloads remote video URLs to FileSystem.cacheDirectory on first
//     use, then returns the local file URI on subsequent uses.
//   - Keeps at most CACHE_MAX entries; evicting an entry deletes the
//     underlying file.
//   - Wiped on startup (clearCache) so the cache is effectively
//     "gone on exit" — disk usage stays bounded across sessions.
//
// Concurrency: in-flight downloads are deduplicated. Two scans of the
// same uncached URL share a single download promise.

import * as FileSystem from 'expo-file-system/legacy';

const CACHE_MAX = 10;
const CACHE_SUBDIR = 'bippy-video-cache';

type Entry = { url: string; localUri: string };

// Most-recently-used at the end.
const entries: Entry[] = [];
const inFlight = new Map<string, Promise<string>>();

let initPromise: Promise<void> | null = null;

function cacheRoot(): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory unavailable');
  }
  return `${FileSystem.cacheDirectory}${CACHE_SUBDIR}/`;
}

async function ensureRoot(): Promise<void> {
  await FileSystem.makeDirectoryAsync(cacheRoot(), { intermediates: true });
}

function fileNameFor(url: string): string {
  // Stable, filesystem-safe slug from the URL. Hash isn't needed for a
  // 10-entry cache — base64-encoding the URL and stripping unsafe chars
  // is plenty and keeps the original filename hint for debugging.
  const slug = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]/gi, '_')
    .slice(-120);
  return slug;
}

/**
 * Wipe the on-disk cache. Call once at app startup so the cache is
 * effectively per-session.
 */
export async function clearCache(): Promise<void> {
  entries.length = 0;
  inFlight.clear();
  try {
    await FileSystem.deleteAsync(cacheRoot(), { idempotent: true });
  } catch {
    // Best effort — nothing on disk yet, or a transient FS error.
  }
}

/**
 * Resolve a video source to something `expo-video`'s useVideoPlayer can
 * load right now.
 *
 * - Bundled `require()` (number): passed through untouched.
 * - Remote URL (string): downloaded to cache on miss, returned as a
 *   local `file://` URI on hit. Touches the entry as most-recently-used.
 */
export async function resolveVideoSource(
  source: number | string,
): Promise<number | string> {
  if (typeof source !== 'string') return source;
  if (!source.startsWith('http')) return source;

  // Cache hit — promote to MRU and return.
  const idx = entries.findIndex((e) => e.url === source);
  if (idx >= 0) {
    const entry = entries.splice(idx, 1)[0];
    entries.push(entry);
    return entry.localUri;
  }

  // Coalesce concurrent downloads of the same URL.
  const existing = inFlight.get(source);
  if (existing) return existing;

  const download = (async () => {
    if (!initPromise) initPromise = ensureRoot();
    await initPromise;

    const target = `${cacheRoot()}${fileNameFor(source)}`;
    const result = await FileSystem.downloadAsync(source, target);

    entries.push({ url: source, localUri: result.uri });

    // Evict oldest if we're over the cap.
    while (entries.length > CACHE_MAX) {
      const evicted = entries.shift();
      if (evicted) {
        FileSystem.deleteAsync(evicted.localUri, { idempotent: true }).catch(
          () => {},
        );
      }
    }

    return result.uri;
  })();

  inFlight.set(source, download);
  try {
    return await download;
  } finally {
    inFlight.delete(source);
  }
}
