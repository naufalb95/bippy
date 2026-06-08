// LRU cache for remote flashcard videos.
//
// Behaviour:
//   - resolveVideoSource() returns SYNCHRONOUSLY: the local file URI if
//     the URL is cached, otherwise the URL itself. expo-video can
//     stream + buffer URLs natively, so first-play starts as soon as
//     the player has enough data — no "wait for full download".
//   - Cache misses kick off a background download. Once it finishes,
//     the next mount of the same URL gets the local file → instant play.
//   - At most VIDEO_CACHE_MAX entries on disk; oldest evicted.
//   - clearCache() wipes the on-disk directory at startup so the cache
//     is effectively per-session and disk doesn't accumulate.
//
// Concurrency: in-flight downloads for a URL are deduped.

import * as FileSystem from 'expo-file-system/legacy';
import { VIDEO_CACHE_MAX } from './constants';

const CACHE_SUBDIR = 'bippy-video-cache';

type Entry = { url: string; localUri: string };

// Most-recently-used at the end.
const entries: Entry[] = [];
const inFlight = new Map<string, Promise<void>>();
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
  // Stable, filesystem-safe slug from the URL.
  const slug = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]/gi, '_')
    .slice(-120);
  return slug;
}

/**
 * Wipe the on-disk cache. Call once at app startup.
 */
export async function clearCache(): Promise<void> {
  entries.length = 0;
  inFlight.clear();
  try {
    await FileSystem.deleteAsync(cacheRoot(), { idempotent: true });
  } catch {
    // Best effort.
  }
}

/**
 * Resolve a video source for immediate playback. Synchronous:
 *
 * - Bundled `require()` (number): passed through.
 * - Cached URL: returns the local file URI (and promotes MRU).
 * - Uncached URL: returns the URL itself for streaming, and kicks off a
 *   background download so the next scan of the same URL is instant.
 */
export function resolveVideoSource(source: number | string): number | string {
  if (typeof source !== 'string' || !source.startsWith('http')) {
    return source;
  }

  // Cache hit — promote to MRU.
  const idx = entries.findIndex((e) => e.url === source);
  if (idx >= 0) {
    const entry = entries.splice(idx, 1)[0];
    entries.push(entry);
    return entry.localUri;
  }

  // Cache miss — warm in the background, return URL for streaming now.
  warmCache(source);
  return source;
}

function warmCache(url: string): void {
  if (inFlight.has(url)) return;
  const task = (async () => {
    try {
      if (!initPromise) initPromise = ensureRoot();
      await initPromise;
      const target = `${cacheRoot()}${fileNameFor(url)}`;
      const result = await FileSystem.downloadAsync(url, target);
      entries.push({ url, localUri: result.uri });
      while (entries.length > VIDEO_CACHE_MAX) {
        const evicted = entries.shift();
        if (evicted) {
          FileSystem.deleteAsync(evicted.localUri, { idempotent: true }).catch(
            () => {},
          );
        }
      }
    } catch {
      // Best effort — the kid is watching the streamed version anyway.
    } finally {
      inFlight.delete(url);
    }
  })();
  inFlight.set(url, task);
}
